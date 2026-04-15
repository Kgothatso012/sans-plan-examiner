// SANS Plan Examiner - Modular API Server
// Refactored from 1783 lines into modular structure

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
require('dotenv').config();

// Config
const { supabase } = require('./config/supabase');
const { generalLimiter, apiLimiter } = require('./config/middleware');

// App setup
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api', apiLimiter);

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    // Silent logging
  });
  next();
});

// Static files
app.use(express.static(path.join(__dirname, '..')));

// Root redirect
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Audit log endpoint (admin)
const { requireAdminAuth } = require('./middleware/auth');
const { logAudit } = require('./services/audit');

app.get('/api/audit', requireAdminAuth, async (req, res) => {
  try {
    const { target_id, target_type, limit = 50 } = req.query;
    let query = supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(parseInt(limit));
    if (target_id) query = query.eq('target_id', target_id);
    if (target_type) query = query.eq('target_type', target_type);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Approval letter endpoint
app.get('/api/applications/:id/letter', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { data: application } = await supabase.from('applications').select('*').eq('id', id).single();
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const letterHtml = `<!DOCTYPE html><html><head><style>body{font-family:'Courier New',monospace;padding:40px;max-width:800px;margin:0 auto}.stamp{border:4px solid #1a5f1a;color:#1a5f1a;padding:10px 20px;font-size:24px;font-weight:bold;transform:rotate(-5deg);display:inline-block;margin:20px 0}h1{color:#1a5f1a}.details{margin:20px 0;padding:20px;background:#f5f5f5}</style></head><body><h1>TSHWANE MUNICIPALITY</h1><h2>Building Plan Approval</h2><div class="stamp">APPROVED</div><div class="details"><p><strong>Reference:</strong> ${application.reference}</p><p><strong>ERF Number:</strong> ${application.erf_number}</p><p><strong>Owner:</strong> ${application.owner_name}</p><p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p></div><p>Dear ${application.owner_name},</p><p>Your building plan application has been approved subject to the following conditions:</p><ul><li>All construction must comply with SANS 10400 regulations</li><li>Building must be completed within 24 months of approval</li><li>All fees must be paid before construction commences</li></ul><p>Yours faithfully,<br><strong>J. Makena</strong><br>Building Plan Examiner<br>Tshwane Municipality</p></body></html>`;

    res.set('Content-Type', 'text/html');
    res.send(letterHtml);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Import routes
const authRoutes = require('./routes/auth');
const applicationRoutes = require('./routes/applications');
const commentRoutes = require('./routes/comments');
const revisionRoutes = require('./routes/revisions');
const documentRoutes = require('./routes/documents');
const examinerRoutes = require('./routes/examiners');
const paymentRoutes = require('./routes/payments');
const analyticsRoutes = require('./routes/analytics');
const analysisRoutes = require('./routes/analysis');
const checkRoutes = require('./routes/check');
const checklistRoutes = require('./routes/checklist');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api', commentRoutes);
app.use('/api', revisionRoutes);
app.use('/api', documentRoutes);
app.use('/api/examiners', examinerRoutes);
app.use('/api', paymentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api', analysisRoutes);
app.use('/api', checkRoutes);
app.use('/api', checklistRoutes);

// General rate limiting
app.use(generalLimiter);

// Start server
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║   SANS Plan Examiner API                 ║
║   Running on http://localhost:${PORT}          ║
╠══════════════════════════════════════════╣
║   Endpoints:                             ║
║   GET  /health                           ║
║   POST /api/applications/submit          ║
║   GET  /api/applications/:reference      ║
║   GET  /api/applications                 ║
║   POST /api/applications/:id/analyze     ║
║   POST /api/applications/:id/comments    ║
║   POST /api/applications/:id/revisions  ║
║   GET  /api/rules                        ║
║   POST /api/check                        ║
╚══════════════════════════════════════════╝
  `);
});

module.exports = app;
