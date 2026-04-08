// Comment routes
const express = require('express');
const { supabase } = require('../config/supabase');
const { requireAdminAuth } = require('../middleware/auth');
const { logAudit } = require('../services/audit');
const { notifyApplicant } = require('../services/email');

const router = express.Router();

// Add comment to application
router.post('/applications/:id/comments', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { comment_text, clause_id, violation_type, page_number, x_position, y_position } = req.body;

    const { data: comment, error } = await supabase
      .from('application_comments')
      .insert({
        application_id: id,
        comment_text,
        clause_id: clause_id || null,
        comment_type: violation_type || 'GENERAL',
        page_number: page_number || 1,
        x_position: x_position || null,
        y_position: y_position || null,
        resolved: false
      })
      .select()
      .single();

    if (error) throw error;

    await logAudit('ADD_COMMENT', 'application', id, { comment_id: comment.id, clause_id, violation_type });
    await notifyApplicant(id, 'comment_added');

    res.json({ success: true, comment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get comments for application
router.get('/applications/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: comments, error } = await supabase
      .from('application_comments')
      .select('*, comment_replies(*)')
      .eq('application_id', id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(comments || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reply to comment
router.post('/comments/:id/reply', async (req, res) => {
  try {
    const { id } = req.params;
    const { reply_text, user_type } = req.body;

    const { data: comment } = await supabase.from('application_comments').select('application_id').eq('id', id).single();
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const { data: reply, error } = await supabase
      .from('comment_replies')
      .insert({
        comment_id: id,
        reply_text,
        author_type: user_type || 'applicant'
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, reply });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark comment as fixed
router.put('/comments/:id/fix', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { resolved, resolution_note } = req.body;

    const { data, error } = await supabase
      .from('application_comments')
      .update({
        resolved: resolved !== undefined ? resolved : true,
        resolution_note: resolution_note || null,
        resolved_at: resolved !== false ? new Date().toISOString() : null
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, comment: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
