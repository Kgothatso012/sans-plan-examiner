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

// Department routing - determines which depts need to review based on application type
function getRequiredDepartments(applicationType, erfSize = null) {
  const departments = {
    BC: 'Building Control',
    RSP: 'Regional Spatial Planning',
    FS: 'Fire Safety',
    GEO: 'Geology',
    MH: 'Municipal Health',
    TI: 'Traffic Impact',
    RSW: 'Roads and Storm Water',
    WS: 'Water and Sanitation',
    WM: 'Waste Management',
    EPO: 'Environmental Planning & Open Space',
    WP: 'Water Pollution',
    TRES: 'Treasury'
  };

  const routingRules = {
    'residential-small': ['BC', 'MH', 'RSW'],  // < 500m²
    'residential': ['BC', 'RSP', 'MH', 'RSW'], // >= 500m²
    'commercial': ['BC', 'RSP', 'FS', 'TI', 'RSW', 'WS', 'EPO', 'TRES'],
    'industrial': ['BC', 'RSP', 'FS', 'GEO', 'TI', 'RSW', 'WS', 'WM', 'EPO', 'WP', 'TRES'],
    'other': ['BC', 'RSP', 'MH', 'TRES'],
    'default': ['BC', 'RSP', 'MH', 'TRES']
  };

  const requiredDepts = routingRules[applicationType] || routingRules['default'];
  return requiredDepts.map(code => ({ code, name: departments[code], status: 'PENDING' }));
}

// Submit new application
router.post('/submit', submitLimiter, upload.array('documents', 10), async (req, res) => {
  try {
    const { erfNumber, ownerName, ownerEmail, ownerPhone, description, zoning, applicationType, professionalName, professionalReg, professionalBody, professionalEmail, professionalCompany } = req.body;

    if (!erfNumber || !ownerName || !ownerEmail) {
      return res.status(400).json({ error: 'ERF number, owner name, and email are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(ownerEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const refNumber = 'TC' + Date.now().toString().slice(-6);
    const departments = getRequiredDepartments(applicationType || 'default');

    const sanitized = {
      erf_number: erfNumber.trim().slice(0, 50),
      owner_name: ownerName.trim().slice(0, 100),
      owner_email: ownerEmail.toLowerCase().trim(),
      owner_phone: ownerPhone?.trim().slice(0, 20) || null,
      description: description?.trim().slice(0, 1000) || null,
      zoning: zoning?.trim().slice(0, 50) || null,
      application_type: applicationType || 'other',
      // QP fields
      professional_name: professionalName?.trim().slice(0, 100) || null,
      professional_reg: professionalReg?.trim().slice(0, 50) || null,
      professional_body: professionalBody?.trim().slice(0, 50) || null,
      professional_email: professionalEmail?.toLowerCase().trim() || null,
      professional_company: professionalCompany?.trim().slice(0, 200) || null,
      // Department routing
      departments: departments,
      workflow_stage: 'RECEIVED'
    };

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
        application_type: sanitized.application_type,
        professional_name: sanitized.professional_name,
        professional_reg: sanitized.professional_reg,
        professional_body: sanitized.professional_body,
        professional_email: sanitized.professional_email,
        professional_company: sanitized.professional_company,
        departments: sanitized.departments,
        workflow_stage: 'RECEIVED',
        status: 'RECEIVED'
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
      message: 'Application submitted successfully',
      departments: departments.map(d => d.code)
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
    const { decision, department } = req.body;

    const validDecisions = ['PENDING', 'IN_PROGRESS', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'REVISION', 'COMPLETED'];
    if (!validDecisions.includes(decision)) {
      return res.status(400).json({ error: 'Invalid decision. Valid: ' + validDecisions.join(', ') });
    }

    // If department specified, update that department's status in the departments array
    if (department) {
      const { data: app } = await supabase.from('applications').select('departments').eq('id', id).single();
      if (!app) return res.status(404).json({ error: 'Application not found' });

      const depts = app.departments || [];
      const updatedDepts = depts.map(d => {
        if (d.code === department) {
          return { ...d, status: decision, updated_at: new Date().toISOString() };
        }
        return d;
      });

      // Check if all required departments have approved
      const allApproved = updatedDepts.filter(d => d.status !== 'N/A').every(d => d.status === 'APPROVED');
      const anyRejected = updatedDepts.some(d => d.status === 'REJECTED');

      let overallStatus = 'UNDER_REVIEW';
      if (anyRejected) overallStatus = 'REJECTED';
      else if (allApproved) overallStatus = 'APPROVED';

      const { data, error } = await supabase
        .from('applications')
        .update({
          departments: updatedDepts,
          status: overallStatus,
          workflow_stage: overallStatus === 'APPROVED' || overallStatus === 'REJECTED' ? 'DECISION' : 'UNDER_REVIEW',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await logAudit('DEPT_DECISION', 'application', id, { department, decision, overallStatus });
      return res.json({ success: true, application: data, departmentStatus: decision });
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

// Get applications by department
router.get('/department/:deptCode', requireAdminAuth, async (req, res) => {
  try {
    const { deptCode } = req.params;
    const { status } = req.query;

    const { data: applications, error } = await supabase
      .from('applications')
      .select('*, application_documents(*)')
      .not('departments', 'is', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Filter applications that have this department and match status
    const filtered = applications.filter(app => {
      const depts = app.departments || [];
      const deptMatch = depts.some(d => d.code === deptCode);
      if (!deptMatch) return false;
      if (status) {
        const deptStatus = depts.find(d => d.code === deptCode)?.status;
        return deptStatus === status;
      }
      return true;
    });

    res.json(filtered);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update workflow stage
router.put('/:id/stage', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { stage } = req.body;

    const validStages = ['RECEIVED', 'ACKNOWLEDGED', 'UNDER_REVIEW', 'DECISION', 'COLLECTION'];
    if (!validStages.includes(stage)) {
      return res.status(400).json({ error: 'Invalid stage. Valid: ' + validStages.join(', ') });
    }

    const statusMap = {
      'RECEIVED': 'RECEIVED',
      'ACKNOWLEDGED': 'ACKNOWLEDGED',
      'UNDER_REVIEW': 'UNDER_REVIEW',
      'DECISION': 'APPROVED',
      'COLLECTION': 'COLLECTION'
    };

    const { data, error } = await supabase
      .from('applications')
      .update({
        workflow_stage: stage,
        status: statusMap[stage] || stage,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await logAudit('STAGE_CHANGE', 'application', id, { stage });
    await notifyApplicant(id, 'stage_changed');

    res.json({ success: true, application: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update department status
router.put('/:id/department/:deptCode', requireAdminAuth, async (req, res) => {
  try {
    const { id, deptCode } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Valid: ' + validStatuses.join(', ') });
    }

    // Get current application
    const { data: app, error: appErr } = await supabase
      .from('applications')
      .select('departments')
      .eq('id', id)
      .single();

    if (appErr) throw appErr;

    // Update department in array
    const departments = app.departments || [];
    const deptIndex = departments.findIndex(d => d.code === deptCode);

    if (deptIndex === -1) {
      return res.status(404).json({ error: 'Department not found in application' });
    }

    departments[deptIndex] = { ...departments[deptIndex], status };

    const { data, error } = await supabase
      .from('applications')
      .update({ departments, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await logAudit('DEPT_STATUS', 'application', id, { department: deptCode, status });

    res.json({ success: true, departments });
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
