// Application routes
const express = require('express');
const fs = require('fs');
const { supabase } = require('../config/supabase');
const { requireAdminAuth } = require('../middleware/auth');
const { submitLimiter, upload } = require('../config/middleware');
const { sanitizeStr } = require('../middleware/validation');
const { notifyApplicant } = require('../services/email');
const { logAudit } = require('../services/audit');

const router = express.Router();

// Submit new application
router.post('/submit', submitLimiter, upload.array('documents', 10), async (req, res) => {
  try {
    const { erfNumber, ownerName, ownerEmail, ownerPhone, description, zoning } = req.body;

    if (!erfNumber || !ownerName || !ownerEmail) {
      return res.status(400).json({ error: 'ERF number, owner name, and email are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(ownerEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const sanitized = {
      erf_number: erfNumber.trim().slice(0, 50),
      owner_name: ownerName.trim().slice(0, 100),
      owner_email: ownerEmail.toLowerCase().trim(),
      owner_phone: ownerPhone?.trim().slice(0, 20) || null,
      description: description?.trim().slice(0, 1000) || null,
      zoning: zoning?.trim().slice(0, 50) || null
    };

    const refNumber = 'TC' + Date.now().toString().slice(-6);

    const { data: application, error } = await supabase
      .from('applications')
      .insert({
        reference: refNumber,
        erf_number: sanitized.erf_number,
        owner_name: sanitized.owner_name,
        owner_email: sanitized.owner_email,
        owner_phone: sanitized.owner_phone,
        description: sanitized.description,
        zoning: sanitized.zoning,
        status: 'PENDING'
      })
      .select()
      .single();

    if (error) throw error;

    const files = Array.isArray(req.files) ? req.files : (req.files ? [req.files] : []);
    if (files.length > 0) {
      for (const file of files) {
        const fileName = `${application.id}/${Date.now()}-${file.originalname}`;
        const fileBuffer = fs.readFileSync(file.path);

        await supabase.storage.from('applications').upload(fileName, fileBuffer);

        await supabase.from('application_documents').insert({
          application_id: application.id,
          doc_type: file.fieldname || 'general',
          storage_path: fileName,
          file_name: file.originalname
        });

        fs.unlinkSync(file.path);
      }
    }

    await notifyApplicant(application.id, 'submitted');

    res.json({
      success: true,
      reference: refNumber,
      applicationId: application.id,
      message: 'Application submitted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List all applications (admin)
router.get('/all', requireAdminAuth, async (req, res) => {
  try {
    const { data: applications, error } = await supabase
      .from('applications')
      .select('*, application_documents(*), application_analysis(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get application by reference or id
router.get('/:reference', async (req, res) => {
  try {
    const { reference } = req.params;
    const isUUID = reference.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

    let application;
    if (isUUID) {
      const { data, error } = await supabase.from('applications').select('*').eq('id', reference).single();
      application = data;
      if (error) throw error;
    } else {
      const { data, error } = await supabase.from('applications').select('*').eq('reference', reference).single();
      application = data;
      if (error || !application) {
        return res.status(404).json({ error: 'Application not found' });
      }
    }

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const { data: documents } = await supabase.from('application_documents').select('*').eq('application_id', application.id);
    const { data: comments } = await supabase.from('application_comments').select('*').eq('application_id', application.id).order('created_at', { ascending: true });
    const { data: revisions } = await supabase.from('application_revisions').select('*').eq('application_id', application.id).order('revision_number', { ascending: true });

    res.json({
      ...application,
      documents: documents || [],
      comments: comments || [],
      revisions: revisions || []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List applications for applicant
router.get('/', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Email parameter required' });
    }

    const { data: applications, error } = await supabase
      .from('applications')
      .select('*, application_documents(*), application_analysis(*)')
      .eq('owner_email', email)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(applications || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update application status
router.put('/:id/status', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data, error } = await supabase
      .from('applications')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await notifyApplicant(id, 'status_changed');
    await logAudit('STATUS_CHANGE', 'application', id, { status });

    res.json({ success: true, application: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Decision endpoint
router.post('/:id/decision', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { decision } = req.body;

    const validDecisions = ['PENDING', 'IN_PROGRESS', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'REVISION', 'COMPLETED'];
    if (!validDecisions.includes(decision)) {
      return res.status(400).json({ error: 'Invalid decision. Valid: ' + validDecisions.join(', ') });
    }

    const dbStatus = decision === 'APPROVED' ? 'COMPLETED' : decision;

    const { data, error } = await supabase
      .from('applications')
      .update({ status: dbStatus, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await logAudit('DECISION', 'application', id, { decision, reference: data.reference });
    await notifyApplicant(id, 'status_changed');

    res.json({ success: true, application: data, message: `Application ${decision}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Assign application
router.put('/:id/assign', async (req, res) => {
  try {
    const { id } = req.params;
    const { examiner_id } = req.body;
    let assignedTo = examiner_id;

    if (examiner_id === 'self') {
      if (req.examiner) {
        assignedTo = req.examiner.examiner_id;
      } else {
        return res.status(400).json({ error: 'Use examiner_id to assign to specific examiner' });
      }
    }

    const { data, error } = await supabase.from('applications').update({ assigned_to: assignedTo }).eq('id', id).select().single();
    if (error) throw error;

    const examinerEmail = req.examiner?.email || req.admin?.email || 'admin';
    await logAudit('ASSIGN', 'application', id, { assigned_to: assignedTo, examiner: examinerEmail });

    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
