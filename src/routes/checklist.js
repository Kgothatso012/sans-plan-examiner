/**
 * Checklist Routes — Bra Joe's Official Building Plan Check List
 * Supports examiner workflow: save/get/bulk checklist decisions per application
 */
const express = require('express');
const { supabase } = require('../config/supabase');
const { requireAdminAuth } = require('../middleware/auth');
const BRA_JOE_CHECKLIST = require('../data/bra-joe-checklist');

const router = express.Router();

// ─── GET /api/applications/:id/checklist ───────────────────────────────────
// Get all checklist data for an application (items + examiner decisions + AI status)
router.get('/applications/:id/checklist', async (req, res) => {
  try {
    const { id } = req.params;

    // Get stored examiner decisions
    const { data: decisions, error: decErr } = await supabase
      .from('application_checklist')
      .select('*')
      .eq('application_id', id);

    if (decErr) throw decErr;

    // Build lookup map
    const decisionMap = {};
    for (const d of (decisions || [])) {
      decisionMap[d.checklist_item_id] = d;
    }

    // Merge with checklist item definitions
    const result = BRA_JOE_CHECKLIST.items.map(item => {
      const stored = decisionMap[item.id] || {};
      return {
        ...item,
        examiner_status: stored.examiner_status || null,
        examiner_notes: stored.examiner_notes || null,
        ai_status: stored.ai_status || null,
        db_id: stored.id || null,
      };
    });

    res.json({
      success: true,
      items: result,
      sections: BRA_JOE_CHECKLIST.sections,
      summary: computeSummary(result),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── GET /api/applications/:id/checklist/summary ───────────────────────────
// Get per-section pass/fail/n/a counts
router.get('/api/applications/:id/checklist/summary', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('application_checklist')
      .select('section, examiner_status, ai_status')
      .eq('application_id', id);

    if (error) throw error;

    const summary = {};
    for (const section of BRA_JOE_CHECKLIST.sections) {
      summary[section.id] = { pass: 0, fail: 0, na: 0, need_info: 0, unchecked: 0 };
    }

    // Initialize all sections with full counts (all items start unchecked)
    const itemCountBySection = {};
    for (const item of BRA_JOE_CHECKLIST.items) {
      if (!itemCountBySection[item.section]) itemCountBySection[item.section] = 0;
      itemCountBySection[item.section]++;
    }

    for (const section of BRA_JOE_CHECKLIST.sections) {
      summary[section.id] = {
        total: itemCountBySection[section.id] || 0,
        pass: 0,
        fail: 0,
        na: 0,
        need_info: 0,
        unchecked: itemCountBySection[section.id] || 0,
      };
    }

    for (const row of (data || [])) {
      if (!summary[row.section]) continue;
      summary[row.section].unchecked--;
      if (row.examiner_status === 'PASS') summary[row.section].pass++;
      else if (row.examiner_status === 'FAIL') summary[row.section].fail++;
      else if (row.examiner_status === 'N/A') summary[row.section].na++;
      else if (row.examiner_status === 'NEED_INFO') summary[row.section].need_info++;
    }

    res.json({ success: true, summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── PUT /api/applications/:id/checklist/:itemId ───────────────────────────
// Save/update a single checklist item decision
router.put('/applications/:id/checklist/:itemId', requireAdminAuth, async (req, res) => {
  try {
    const { id, itemId } = req.params;
    const { examiner_status, examiner_notes } = req.body;

    // Validate item exists in checklist
    const item = BRA_JOE_CHECKLIST.items.find(i => i.id === itemId);
    if (!item) {
      return res.status(404).json({ error: `Unknown checklist item: ${itemId}` });
    }

    const validStatuses = ['PASS', 'FAIL', 'N/A', 'NEED_INFO', null];
    if (examiner_status && !validStatuses.includes(examiner_status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Upsert
    const { data, error } = await supabase
      .from('application_checklist')
      .upsert({
        application_id: id,
        checklist_item_id: itemId,
        section: item.section,
        examiner_status,
        examiner_notes: examiner_notes || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'application_id,checklist_item_id',
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, decision: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /api/applications/:id/checklist/bulk ──────────────────────────────
// Bulk save multiple checklist item decisions
router.post('/applications/:id/checklist/bulk', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { decisions } = req.body; // [{checklist_item_id, examiner_status, examiner_notes}]

    if (!Array.isArray(decisions)) {
      return res.status(400).json({ error: 'decisions must be an array' });
    }

    const validStatuses = ['PASS', 'FAIL', 'N/A', 'NEED_INFO'];
    const records = [];

    for (const dec of decisions) {
      const item = BRA_JOE_CHECKLIST.items.find(i => i.id === dec.checklist_item_id);
      if (!item) continue; // skip unknown items
      if (dec.examiner_status && !validStatuses.includes(dec.examiner_status)) continue;

      records.push({
        application_id: id,
        checklist_item_id: dec.checklist_item_id,
        section: item.section,
        examiner_status: dec.examiner_status || null,
        examiner_notes: dec.examiner_notes || null,
        updated_at: new Date().toISOString(),
      });
    }

    if (records.length === 0) {
      return res.json({ success: true, saved: 0 });
    }

    const { data, error } = await supabase
      .from('application_checklist')
      .upsert(records, { onConflict: 'application_id,checklist_item_id' })
      .select();

    if (error) throw error;

    res.json({ success: true, saved: data.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /api/applications/:id/checklist/ai-populate ─────────────────────
// Called by analysis route after AI analysis — populates AI status for auto-checkable items
router.post('/applications/:id/checklist/ai-populate', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { analysis_results } = req.body;
    // analysis_results: [{clause_id, status, checklist_item_id}]

    if (!Array.isArray(analysis_results)) {
      return res.status(400).json({ error: 'analysis_results must be an array' });
    }

    // Map clause_id results to checklist item IDs
    const statusByClause = {};
    for (const r of analysis_results) {
      if (r.clause_id) statusByClause[r.clause_id] = r.status;
    }

    const updates = [];
    for (const [checklistId, clauseId] of Object.entries(BRA_JOE_CHECKLIST.clauseMapping)) {
      const aiStatus = statusByClause[clauseId];
      if (!aiStatus) continue;

      const item = BRA_JOE_CHECKLIST.items.find(i => i.id === checklistId);
      if (!item) continue;

      updates.push({
        application_id: id,
        checklist_item_id: checklistId,
        section: item.section,
        ai_status: aiStatus,
        updated_at: new Date().toISOString(),
      });
    }

    if (updates.length > 0) {
      const { error } = await supabase
        .from('application_checklist')
        .upsert(updates, { onConflict: 'application_id,checklist_item_id' });

      if (error) throw error;
    }

    res.json({ success: true, ai_populated: updates.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /api/applications/:id/checklist/mark-all-na ─────────────────────
// Bulk mark all CIRCULATION items as N/A (examiner didn't miss — they're routing only)
router.post('/applications/:id/checklist/mark-all-na', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { section } = req.body; // optional — if not provided, marks all CIRCULATION

    const sectionItems = BRA_JOE_CHECKLIST.items.filter(
      i => i.section === (section || 'CIRCULATION')
    );

    const records = sectionItems.map(item => ({
      application_id: id,
      checklist_item_id: item.id,
      section: item.section,
      examiner_status: 'N/A',
      examiner_notes: 'Department routing — not applicable to this application type',
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('application_checklist')
      .upsert(records, { onConflict: 'application_id,checklist_item_id' });

    if (error) throw error;

    res.json({ success: true, marked_na: records.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Helper ─────────────────────────────────────────────────────────────────
function computeSummary(items) {
  const summary = {};
  for (const section of BRA_JOE_CHECKLIST.sections) {
    summary[section.id] = { total: 0, pass: 0, fail: 0, na: 0, need_info: 0, unchecked: 0 };
  }
  for (const item of items) {
    if (!summary[item.section]) continue;
    summary[item.section].total++;
    if (item.examiner_status === 'PASS') summary[item.section].pass++;
    else if (item.examiner_status === 'FAIL') summary[item.section].fail++;
    else if (item.examiner_status === 'N/A') summary[item.section].na++;
    else if (item.examiner_status === 'NEED_INFO') summary[item.section].need_info++;
    else summary[item.section].unchecked++;
  }
  return summary;
}

module.exports = router;
