// Analytics routes
const express = require('express');
const { supabase } = require('../config/supabase');
const { requireAdminAuth } = require('../middleware/auth');

const router = express.Router();

// Dashboard statistics
router.get('/dashboard', requireAdminAuth, async (req, res) => {
  try {
    const { data: applications } = await supabase.from('applications').select('status, created_at');

    const statusCounts = { PENDING: 0, ANALYZING: 0, COMPLETED: 0, REJECTED: 0 };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let submittedToday = 0, submittedThisWeek = 0, submittedThisMonth = 0;

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    applications?.forEach(app => {
      if (statusCounts[app.status] !== undefined) {
        statusCounts[app.status]++;
      }
      const created = new Date(app.created_at);
      if (created >= today) submittedToday++;
      if (created >= weekAgo) submittedThisWeek++;
      if (created >= monthAgo) submittedThisMonth++;
    });

    const { data: comments } = await supabase.from('application_comments').select('resolved');
    const totalComments = comments?.length || 0;
    const resolvedComments = comments?.filter(c => c.resolved).length || 0;

    const { data: revisions } = await supabase.from('application_revisions').select('status');
    const totalRevisions = revisions?.length || 0;
    const pendingRevisions = revisions?.filter(r => r.status === 'pending').length || 0;

    const { count: applicantCount } = await supabase.from('applicants').select('*', { count: 'exact', head: true });

    res.json({
      applications: { total: applications?.length || 0, byStatus: statusCounts, submittedToday, submittedThisWeek, submittedThisMonth },
      comments: { total: totalComments, resolved: resolvedComments, pending: totalComments - resolvedComments },
      revisions: { total: totalRevisions, pending: pendingRevisions },
      applicants: { total: applicantCount || 0 }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Trend (last 30 days)
router.get('/trend', requireAdminAuth, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: applications } = await supabase
      .from('applications')
      .select('created_at, status')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    const trend = {};
    applications?.forEach(app => {
      const date = new Date(app.created_at).toISOString().split('T')[0];
      if (!trend[date]) {
        trend[date] = { total: 0, PENDING: 0, ANALYZING: 0, COMPLETED: 0, REJECTED: 0 };
      }
      trend[date].total++;
      if (trend[date][app.status] !== undefined) {
        trend[date][app.status]++;
      }
    });

    res.json(trend);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Top violations
router.get('/violations', requireAdminAuth, async (req, res) => {
  try {
    const { data: comments } = await supabase
      .from('application_comments')
      .select('clause_id, comment_type')
      .not('clause_id', 'is', null);

    const violationCounts = {};
    comments?.forEach(c => {
      if (c.clause_id && c.comment_type === 'VIOLATION') {
        violationCounts[c.clause_id] = (violationCounts[c.clause_id] || 0) + 1;
      }
    });

    const topViolations = Object.entries(violationCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([clause_id, count]) => ({ clause_id, count }));

    res.json(topViolations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
