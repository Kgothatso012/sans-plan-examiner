// Analysis routes
const express = require('express');
const fs = require('fs');
const pdf = require('pdf-parse');
const { supabase } = require('../config/supabase');
const { requireAdminAuth } = require('../middleware/auth');
const SansAnalyzer = require('../ai/sans-analyzer');
const MiniMaxClient = require('../ai/minimax-client');
const DocumentVerifier = require('../ai/document-verifier');

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

module.exports = router;
