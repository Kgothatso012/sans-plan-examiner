// Analysis routes
const express = require('express');
const fs = require('fs');
const pdf = require('pdf-parse');
const { supabase } = require('../config/supabase');
const { requireAdminAuth } = require('../middleware/auth');
const SansAnalyzer = require('../ai/sans-analyzer');
const MiniMaxClient = require('../ai/minimax-client');
const DocumentVerifier = require('../ai/document-verifier');
const BRA_JOE_CHECKLIST = require('../data/bra-joe-checklist');

const router = express.Router();

// Initialize AI Analyzer
const sansAnalyzer = new SansAnalyzer({
  minimax: {
    apiKey: process.env.MINIMAX_API_KEY,
    baseUrl: process.env.MINIMAX_BASE_URL || 'https://api.minimax.chat/v1',
    model: process.env.MINIMAX_MODEL || 'abab6.5s-chat'
  },
  db: supabase
});

// Run AI analysis
router.post('/applications/:id/analyze', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: application } = await supabase.from('applications').select('*').eq('id', id).single();
    const { data: documents } = await supabase.from('application_documents').select('*').eq('application_id', id);

    if (!documents || documents.length === 0) {
      return res.status(400).json({ error: 'No documents to analyze' });
    }

    const doc = documents[0];
    const { data: fileData } = await supabase.storage.from('applications').download(doc.storage_path);

    let textContent = '';
    let numPages = 0;
    try {
      const dataBuffer = Buffer.from(await fileData.arrayBuffer());
      const pdfData = await pdf(dataBuffer);
      textContent = pdfData.text;
      numPages = pdfData.numpages;
    } catch (e) {
      textContent = 'PDF text extraction failed - using placeholder';
    }

    let result;
    try {
      result = await sansAnalyzer.analyze(id, { pdfBuffer: Buffer.from(await fileData.arrayBuffer()) });
    } catch (analyzeErr) {
      result = { success: false, error: analyzeErr.message };
    }

    if (!result.success) {
      const minimax = new MiniMaxClient({ apiKey: process.env.MINIMAX_API_KEY });
      const fallbackResults = await minimax._fallbackAnalyze(textContent.substring(0, 5000), id);

      for (const r of fallbackResults) {
        await supabase.from('application_analysis').insert({
          application_id: id,
          clause_id: r.clause_id,
          status: r.status,
          violation_text: r.status === 'FAIL' ? r.suggestion : null,
          reasoning: r.reasoning,
          confidence: r.confidence,
          analyzed_at: r.analyzed_at
        });
      }

      // Also populate checklist from fallback results
      await populateChecklistFromAI(id, fallbackResults);

      return res.json({
        success: true,
        analysis: fallbackResults,
        summary: 'Rule-based analysis completed (MiniMax API not available)',
        violationsFound: fallbackResults.filter(r => r.status === 'FAIL').length,
        mode: 'fallback'
      });
    }

    for (const r of result.results) {
      await supabase.from('application_analysis').insert({
        application_id: id,
        clause_id: r.clause_id,
        status: r.status,
        violation_text: r.status === 'FAIL' ? r.suggestion : null,
        reasoning: r.reasoning,
        confidence: r.confidence,
        analyzed_at: r.analyzed_at
      });
    }

    // Dual-write AI results to checklist table for auto-checkable items
    await populateChecklistFromAI(id, result.results);

    await supabase.from('applications').update({ status: 'ANALYZED', updated_at: new Date().toISOString() }).eq('id', id);

    res.json({
      success: true,
      analysis: result.results,
      summary: result.summary,
      extractedInfo: result.extractedInfo,
      violationsFound: result.results.filter(r => r.status === 'FAIL').length,
      mode: 'ai'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify documents
router.post('/applications/:id/verify-docs', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: documents } = await supabase.from('application_documents').select('*').eq('application_id', id);
    if (!documents || documents.length === 0) {
      return res.status(400).json({ error: 'No documents to verify' });
    }

    const docBuffers = [];
    for (const doc of documents) {
      const { data: fileData } = await supabase.storage.from('applications').download(doc.storage_path);
      docBuffers.push({
        doc_type: doc.doc_type,
        mimeType: doc.file_name?.endsWith('.pdf') ? 'application/pdf' : 'application/image',
        buffer: Buffer.from(await fileData.arrayBuffer())
      });
    }

    const verification = await DocumentVerifier.verifyApplication(docBuffers);
    res.json({ success: true, verification });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Process feedback
router.post('/applications/:id/feedback', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { corrections } = req.body;

    const { data: analysis } = await supabase.from('application_analysis').select('*').eq('application_id', id);

    const learnings = [];
    for (const correction of corrections) {
      const original = analysis.find(a => a.clause_id === correction.clause_id);
      if (original) {
        const learning = await sansAnalyzer.processFeedback(id, analysis, [{ clause_id: correction.clause_id, correction: correction.explanation, context: correction.context }]);
        if (learning) learnings.push(learning);
      }
    }

    res.json({ success: true, learnings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get analysis results
router.get('/applications/:id/analysis', async (req, res) => {
  try {
    const { id } = req.params;
    const { data: analysis, error } = await supabase.from('application_analysis').select('*').eq('application_id', id).order('analyzed_at', { ascending: true });
    if (error) throw error;
    res.json(analysis || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get analysis summary grouped by department
router.get('/applications/:id/analysis/by-department', async (req, res) => {
  try {
    const { id } = req.params;
    const { data: analysis, error } = await supabase
      .from('application_analysis')
      .select('*')
      .eq('application_id', id)
      .order('analyzed_at', { ascending: true });

    if (error) throw error;

    // Group by department
    const byDept = {};
    const deptNames = {
      'BC': 'Building Control',
      'RSP': 'Regional Spatial Planning',
      'FS': 'Fire Safety',
      'GEO': 'Geology',
      'MH': 'Municipal Health',
      'TI': 'Traffic Impact',
      'RSW': 'Roads and Storm Water',
      'WS': 'Water and Sanitation',
      'WM': 'Waste Management',
      'EPO': 'Environmental Planning',
      'WP': 'Water Pollution',
      'TRES': 'Treasury'
    };

    analysis.forEach(item => {
      const dept = item.department_code || 'BC';
      if (!byDept[dept]) {
        byDept[dept] = {
          department_code: dept,
          department_name: deptNames[dept] || dept,
          findings: [],
          passCount: 0,
          failCount: 0,
          warningCount: 0,
          criticalCount: 0,
          highCount: 0
        };
      }
      byDept[dept].findings.push(item);
      if (item.status === 'PASS') byDept[dept].passCount++;
      else if (item.status === 'FAIL') {
        byDept[dept].failCount++;
        if (item.severity === 'CRITICAL') byDept[dept].criticalCount++;
        if (item.severity === 'HIGH') byDept[dept].highCount++;
      }
      else if (item.status === 'WARNING') byDept[dept].warningCount++;
    });

    res.json({
      totalFindings: analysis.length,
      departments: Object.values(byDept),
      criticalItems: analysis.filter(a => a.status === 'FAIL' && a.severity === 'CRITICAL'),
      highItems: analysis.filter(a => a.status === 'FAIL' && a.severity === 'HIGH'),
      summary: {
        totalPassed: analysis.filter(a => a.status === 'PASS').length,
        totalFailed: analysis.filter(a => a.status === 'FAIL').length,
        totalWarnings: analysis.filter(a => a.status === 'WARNING').length
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Dual-write AI analysis results to application_checklist table
 * Maps clause_id results to Bra Joe checklist item IDs
 */
async function populateChecklistFromAI(applicationId, aiResults) {
  if (!aiResults || aiResults.length === 0) return;

  // Build clause_id → status lookup
  const statusByClause = {};
  for (const r of aiResults) {
    if (r.clause_id) statusByClause[r.clause_id] = r.status;
  }

  // Reverse mapping: checklist item ID → clause ID
  const checklistToClause = {};
  for (const [checklistId, clauseId] of Object.entries(BRA_JOE_CHECKLIST.clauseMapping)) {
    if (!checklistToClause[clauseId]) checklistToClause[clauseId] = [];
    checklistToClause[clauseId].push(checklistId);
  }

  const updates = [];

  for (const [clauseId, status] of Object.entries(statusByClause)) {
    const mappedItems = checklistToClause[clauseId] || [];
    for (const checklistItemId of mappedItems) {
      const item = BRA_JOE_CHECKLIST.items.find(i => i.id === checklistItemId);
      if (!item) continue;

      updates.push({
        application_id: applicationId,
        checklist_item_id: checklistItemId,
        section: item.section,
        ai_status: status,
        updated_at: new Date().toISOString(),
      });
    }
  }

  if (updates.length > 0) {
    await supabase
      .from('application_checklist')
      .upsert(updates, { onConflict: 'application_id,checklist_item_id' });
  }
}

module.exports = router;
