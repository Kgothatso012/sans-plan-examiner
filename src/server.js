// Joe's Examiner - SANS Plan Examiner API
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// JWT for applicant auth
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'joe-examiner-jwt-secret-2024';

// Email (nodemailer)
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// Supabase config (required)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_KEY must be set in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// MiniMax API (for AI analysis) - optional
const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
const MINIMAX_BASE_URL = 'https://api.minimax.chat/v1';

// Admin API Key (required)
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;
if (!ADMIN_API_KEY) {
  console.error('WARNING: ADMIN_API_KEY not set. Admin endpoints will not work.');
}

// Middleware
app.use(cors());
app.use(express.json());

// Static files - serve from root directory
app.use(express.static(path.join(__dirname, '..')));

// Root redirect to homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// File upload config
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 },
  storage: multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);
    }
  })
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ============ AUTH MIDDLEWARE ============
const requireAdminAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!ADMIN_API_KEY) {
    return res.status(500).json({ error: 'Admin API key not configured' });
  }
  if (apiKey === ADMIN_API_KEY) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// ============ APPLICANT AUTH MIDDLEWARE ============
const requireAuth = (req, res, next) => {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.applicantId = decoded.applicantId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ============ APPLICANT AUTH ENDPOINTS ============

// Register new applicant
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Hash password
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

    const { data: applicant, error } = await supabase
      .from('applicants')
      .insert({ email, password_hash: passwordHash, name })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Email already registered' });
      }
      throw error;
    }

    // Generate JWT
    const token = jwt.sign({ applicantId: applicant.id, email: applicant.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ success: true, token, applicant: { id: applicant.id, email: applicant.email, name: applicant.name } });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Hash password
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

    const { data: applicant, error } = await supabase
      .from('applicants')
      .select('*')
      .eq('email', email)
      .eq('password_hash', passwordHash)
      .single();

    if (error || !applicant) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign({ applicantId: applicant.id, email: applicant.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ success: true, token, applicant: { id: applicant.id, email: applicant.email, name: applicant.name } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get current user
app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const { data: applicant } = await supabase
      .from('applicants')
      .select('id, email, name, created_at')
      .eq('id', req.applicantId)
      .single();

    if (!applicant) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ applicant });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ HEALTH CHECK ============
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============ APPLICATION ENDPOINTS ============

// Submit new application
app.post('/api/applications/submit', upload.array('documents', 10), async (req, res) => {
  try {
    const { erfNumber, ownerName, ownerEmail, ownerPhone, description, zoning } = req.body;

    // Generate reference number
    const refNumber = 'TC' + Date.now().toString().slice(-6);

    // Insert application
    const { data: application, error } = await supabase
      .from('applications')
      .insert({
        reference: refNumber,
        erf_number: erfNumber,
        owner_name: ownerName,
        owner_email: ownerEmail,
        owner_phone: ownerPhone,
        description: description,
        zoning: zoning,
        status: 'PENDING'
      })
      .select()
      .single();

    if (error) throw error;

    // Upload documents
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fileName = `${application.id}/${Date.now()}-${file.originalname}`;

        // Upload to Supabase Storage
        const fileBuffer = fs.readFileSync(file.path);
        const { error: uploadError } = await supabase.storage
          .from('applications')
          .upload(fileName, fileBuffer);

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
        }

        // Save document reference
        await supabase.from('application_documents').insert({
          application_id: application.id,
          doc_type: file.fieldname || 'general',
          storage_path: fileName,
          file_name: file.originalname
        });

        // Cleanup temp file
        fs.unlinkSync(file.path);
      }
    }

    res.json({
      success: true,
      reference: refNumber,
      applicationId: application.id,
      message: 'Application submitted successfully'
    });
  } catch (error) {
    console.error('Submit error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get application by reference
app.get('/api/applications/:reference', async (req, res) => {
  try {
    const { reference } = req.params;

    const { data: application, error } = await supabase
      .from('applications')
      .select('*')
      .eq('reference', reference)
      .single();

    if (error || !application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Get documents
    const { data: documents } = await supabase
      .from('application_documents')
      .select('*')
      .eq('application_id', application.id);

    // Get comments
    const { data: comments } = await supabase
      .from('application_comments')
      .select('*')
      .eq('application_id', application.id)
      .order('created_at', { ascending: true });

    // Get revisions
    const { data: revisions } = await supabase
      .from('application_revisions')
      .select('*')
      .eq('application_id', application.id)
      .order('revision_number', { ascending: true });

    res.json({
      ...application,
      documents: documents || [],
      comments: comments || [],
      revisions: revisions || []
    });
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({ error: error.message });
  }
});

// List all applications (admin only - must come first)
app.get('/api/applications/all', requireAdminAuth, async (req, res) => {
  try {
    const { data: applications, error } = await supabase
      .from('applications')
      .select('*, application_documents(*), application_analysis(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(applications);
  } catch (error) {
    console.error('List applications error:', error);
    res.status(500).json({ error: error.message });
  }
});

// List applications for applicant (by email query param)
app.get('/api/applications', async (req, res) => {
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
    console.error('List applications error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update application status
app.put('/api/applications/:id/status', requireAdminAuth, async (req, res) => {
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

    // Send email notification
    await notifyApplicant(id, 'status_changed');

    res.json({ success: true, application: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ COMMENT ENDPOINTS ============

// Add comment to application
app.post('/api/applications/:id/comments', requireAdminAuth, async (req, res) => {
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

    // Send email notification about new comment
    await notifyApplicant(id, 'comment_added');

    res.json({ success: true, comment });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get comments for application
app.get('/api/applications/:id/comments', async (req, res) => {
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
app.post('/api/comments/:id/reply', async (req, res) => {
  try {
    const { id } = req.params;
    const { reply_text, user_type } = req.body; // user_type: 'applicant' or 'admin'

    // Get comment to find application_id
    const { data: comment } = await supabase
      .from('application_comments')
      .select('application_id')
      .eq('id', id)
      .single();

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
app.put('/api/comments/:id/fix', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('application_comments')
      .update({ status: 'FIXED' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, comment: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ REVISION ENDPOINTS ============

// Submit revision
app.post('/api/applications/:id/revisions', upload.array('documents', 10), async (req, res) => {
  try {
    const { id } = req.params;
    const { change_log } = req.body;

    // Get current revision count
    const { data: revisions } = await supabase
      .from('application_revisions')
      .select('revision_number')
      .eq('application_id', id)
      .order('revision_number', { ascending: false })
      .limit(1);

    const newRevision = (revisions?.[0]?.revision_number || 0) + 1;

    // Create revision record
    const { data: revision, error } = await supabase
      .from('application_revisions')
      .insert({
        application_id: id,
        revision_number: newRevision,
        change_log: change_log || '',
        status: 'SUBMITTED'
      })
      .select()
      .single();

    if (error) throw error;

    // Upload revision documents
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fileName = `${id}/rev${newRevision}/${Date.now()}-${file.originalname}`;
        const fileBuffer = fs.readFileSync(file.path);

        await supabase.storage
          .from('applications')
          .upload(fileName, fileBuffer);

        await supabase.from('application_documents').insert({
          application_id: id,
          doc_type: 'revision',
          storage_path: fileName,
          file_name: file.originalname,
          revision_id: revision.id
        });

        fs.unlinkSync(file.path);
      }
    }

    // Update application status
    await supabase
      .from('applications')
      .update({ status: 'REVISION', updated_at: new Date().toISOString() })
      .eq('id', id);

    // Send email notification about revision
    await notifyApplicant(id, 'revision_submitted');

    res.json({ success: true, revision, revisionNumber: newRevision });
  } catch (error) {
    console.error('Submit revision error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get revisions
app.get('/api/applications/:id/revisions', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: revisions, error } = await supabase
      .from('application_revisions')
      .select('*, application_documents(*)')
      .eq('application_id', id)
      .order('revision_number', { ascending: true });

    if (error) throw error;

    res.json(revisions || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ ANALYSIS ENDPOINTS ============

// Run AI analysis
app.post('/api/applications/:id/analyze', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Get application and documents
    const { data: application } = await supabase
      .from('applications')
      .select('*')
      .eq('id', id)
      .single();

    const { data: documents } = await supabase
      .from('application_documents')
      .select('*')
      .eq('application_id', id);

    if (!documents || documents.length === 0) {
      return res.status(400).json({ error: 'No documents to analyze' });
    }

    // Get document content (first document for now)
    const doc = documents[0];
    const { data: fileData } = await supabase.storage
      .from('applications')
      .download(doc.storage_path);

    // Extract text from PDF
    let textContent = '';
    try {
      const pdf = require('pdf-parse');
      const dataBuffer = Buffer.from(await fileData.arrayBuffer());
      const data = await pdf(dataBuffer);
      textContent = data.text;
    } catch (e) {
      textContent = 'PDF text extraction failed - using placeholder';
    }

    // Call MiniMax API for analysis
    const analysisPrompt = `You are a building plan compliance examiner for Tshwane Municipality, South Africa.
Analyze the following building plan text for compliance with SANS 10400 (National Building Regulations).

Check for:
1. Site coverage (max 60%)
2. Parking requirements
3. Fire safety exits
4. Accessibility (wheelchair access)
5. Ventilation requirements
6. Sanitation facilities
7. Structural requirements

For each violation found, respond in this format:
CLAUSE: [SANS clause ID]
VIOLATION: [description of violation]
REASONING: [why it doesn't comply]

Text content:
${textContent.slice(0, 8000)}`;

    const response = await fetch(`${MINIMAX_BASE_URL}/text/chatcompletion_v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MINIMAX_API_KEY}`
      },
      body: JSON.stringify({
        model: 'MiniMax-Text-01',
        messages: [{ role: 'user', content: analysisPrompt }]
      })
    });

    const aiResult = await response.json();
    const analysisText = aiResult.choices?.[0]?.message?.content || 'Analysis completed';

    // Parse and store analysis results
    const clauses = analysisText.match(/CLAUSE: (.*?)\nVIOLATION: (.*?)\nREASONING: (.*?)(?=\nCLAUSE:|$)/gs) || [];

    for (const clause of clauses) {
      const match = clause.match(/CLAUSE: (.*?)\nVIOLATION: (.*?)\nREASONING: (.*?)$/s);
      if (match) {
        await supabase.from('application_analysis').insert({
          application_id: id,
          clause_id: match[1].trim(),
          status: 'FAIL',
          violation_text: match[2].trim(),
          reasoning: match[3].trim()
        });
      }
    }

    // If no specific violations found, add a pass
    if (clauses.length === 0) {
      await supabase.from('application_analysis').insert({
        application_id: id,
        clause_id: 'OVERALL',
        status: 'PASS',
        violation_text: null,
        reasoning: analysisText.slice(0, 500)
      });
    }

    // Update application status
    await supabase
      .from('applications')
      .update({ status: 'ANALYZED', updated_at: new Date().toISOString() })
      .eq('id', id);

    res.json({
      success: true,
      analysis: analysisText,
      violationsFound: clauses.length
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get analysis results
app.get('/api/applications/:id/analysis', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: analysis, error } = await supabase
      .from('application_analysis')
      .select('*')
      .eq('application_id', id)
      .order('analyzed_at', { ascending: true });

    if (error) throw error;

    res.json(analysis || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ DOCUMENT SERVING ============

// Get document download URL
app.get('/api/documents/:appId/:docId', async (req, res) => {
  try {
    const { appId, docId } = req.params;

    const { data: doc } = await supabase
      .from('application_documents')
      .select('*')
      .eq('id', docId)
      .single();

    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const { data: url } = supabase.storage
      .from('applications')
      .getPublicUrl(doc.storage_path);

    res.json({ url: url.publicUrl, fileName: doc.file_name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download document (redirects to storage URL)
app.get('/api/documents/:appId/:docId/download', async (req, res) => {
  try {
    const { appId, docId } = req.params;

    const { data: doc } = await supabase
      .from('application_documents')
      .select('*')
      .eq('id', docId)
      .single();

    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const { data: url } = supabase.storage
      .from('applications')
      .getPublicUrl(doc.storage_path);

    res.redirect(url.publicUrl);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ APPROVAL LETTER ============

// Generate approval letter
app.get('/api/applications/:id/letter', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: application } = await supabase
      .from('applications')
      .select('*')
      .eq('id', id)
      .single();

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const letterHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Courier New', monospace; padding: 40px; max-width: 800px; margin: 0 auto; }
    .stamp {
      border: 4px solid #1a5f1a;
      color: #1a5f1a;
      padding: 10px 20px;
      font-size: 24px;
      font-weight: bold;
      transform: rotate(-5deg);
      display: inline-block;
      margin: 20px 0;
    }
    h1 { color: #1a5f1a; }
    .details { margin: 20px 0; padding: 20px; background: #f5f5f5; }
  </style>
</head>
<body>
  <h1>TSHWANE MUNICIPALITY</h1>
  <h2>Building Plan Approval</h2>

  <div class="stamp">APPROVED</div>

  <div class="details">
    <p><strong>Reference:</strong> ${application.reference}</p>
    <p><strong>ERF Number:</strong> ${application.erf_number}</p>
    <p><strong>Owner:</strong> ${application.owner_name}</p>
    <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
  </div>

  <p>Dear ${application.owner_name},</p>

  <p>Your building plan application has been approved subject to the following conditions:</p>
  <ul>
    <li>All construction must comply with SANS 10400 regulations</li>
    <li>Building must be completed within 24 months of approval</li>
    <li>All fees must be paid before construction commences</li>
  </ul>

  <p>Yours faithfully,<br>
  <strong>J. Makena</strong><br>
  Building Plan Examiner<br>
  Tshwane Municipality</p>
</body>
</html>`;

    res.set('Content-Type', 'text/html');
    res.send(letterHtml);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ PLAN CHECKER BASIC API ============

// Import plan checker
let nbrRules, getAllCategories, analyzeDocument, getComplianceLevel;
try {
  const checker = require('/home/kgothatso012/plan-checker-shared/src/index.js');
  nbrRules = checker.nbrRules;
  getAllCategories = checker.getAllCategories;
  analyzeDocument = checker.analyzeDocument;
  getComplianceLevel = checker.getComplianceLevel;
} catch (e) {
  console.log('Plan checker not available');
}

// List rules
app.get('/api/rules', (req, res) => {
  if (!nbrRules) {
    return res.json({ totalRules: 0, categories: [], rules: [] });
  }
  const categories = getAllCategories();
  res.json({
    totalRules: nbrRules.length,
    categories,
    rules: nbrRules.map(r => ({
      id: r.id,
      category: r.category,
      title: r.title,
      description: r.description,
      reference: r.reference,
    })),
  });
});

// ============ ANALYTICS ENDPOINTS ============

// Get dashboard statistics
app.get('/api/analytics/dashboard', requireAdminAuth, async (req, res) => {
  try {
    // Get application counts by status
    const { data: applications } = await supabase
      .from('applications')
      .select('status, created_at');

    const statusCounts = {
      PENDING: 0,
      ANALYZING: 0,
      COMPLETED: 0,
      REJECTED: 0
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let submittedToday = 0;
    let submittedThisWeek = 0;
    let submittedThisMonth = 0;

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    applications?.forEach(app => {
      // Count by status
      if (statusCounts[app.status] !== undefined) {
        statusCounts[app.status]++;
      }

      // Count by time
      const created = new Date(app.created_at);
      if (created >= today) submittedToday++;
      if (created >= weekAgo) submittedThisWeek++;
      if (created >= monthAgo) submittedThisMonth++;
    });

    // Get comment statistics
    const { data: comments } = await supabase
      .from('application_comments')
      .select('resolved');

    const totalComments = comments?.length || 0;
    const resolvedComments = comments?.filter(c => c.resolved).length || 0;

    // Get revision statistics
    const { data: revisions } = await supabase
      .from('application_revisions')
      .select('status');

    const totalRevisions = revisions?.length || 0;
    const pendingRevisions = revisions?.filter(r => r.status === 'pending').length || 0;

    // Get applicant count
    const { count: applicantCount } = await supabase
      .from('applicants')
      .select('*', { count: 'exact', head: true });

    res.json({
      applications: {
        total: applications?.length || 0,
        byStatus: statusCounts,
        submittedToday,
        submittedThisWeek,
        submittedThisMonth
      },
      comments: {
        total: totalComments,
        resolved: resolvedComments,
        pending: totalComments - resolvedComments
      },
      revisions: {
        total: totalRevisions,
        pending: pendingRevisions
      },
      applicants: {
        total: applicantCount || 0
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get applications trend (last 30 days)
app.get('/api/analytics/trend', requireAdminAuth, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: applications } = await supabase
      .from('applications')
      .select('created_at, status')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    // Group by date
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

// Get top violations (most common clause IDs)
app.get('/api/analytics/violations', requireAdminAuth, async (req, res) => {
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

// Check plan endpoint
app.post('/api/check', upload.single('file'), async (req, res) => {
  try {
    if (!analyzeDocument) {
      return res.json({ success: true, message: 'Checker not loaded' });
    }

    const file = req.file;
    const erfNumber = req.body.erf;
    const documentName = file ? file.originalname : 'document.pdf';

    let text = '';
    let pageCount = 1;

    if (file) {
      const ext = path.extname(file.originalname).toLowerCase();
      if (ext === '.pdf') {
        const pdf = require('pdf-parse');
        const dataBuffer = fs.readFileSync(file.path);
        const data = await pdf(dataBuffer);
        text = data.text;
        pageCount = data.numpages;
      }
      fs.unlinkSync(file.path);
    } else {
      text = req.body.text || '';
    }

    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    const report = analyzeDocument(text, documentName, pageCount);
    const compliance = getComplianceLevel(report.overallScore);

    res.json({
      success: true,
      erf: erfNumber,
      document: documentName,
      pages: pageCount,
      overallScore: report.overallScore,
      compliance: compliance.level,
      complianceColor: compliance.color,
      totalRules: report.totalRules,
      passedRules: report.passedRules,
      failedRules: report.failedRules,
      categories: report.categories,
      missingInfo: report.missingInfo,
      analyzedAt: report.analyzedAt,
    });
  } catch (error) {
    console.error('Check error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Quick check with text
app.post('/api/check/text', async (req, res) => {
  try {
    if (!analyzeDocument) {
      return res.json({ success: true, message: 'Checker not loaded' });
    }

    const { text, erf, documentName = 'document.pdf', pages = 1 } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    const report = analyzeDocument(text, documentName, pages);
    const compliance = getComplianceLevel(report.overallScore);

    res.json({
      success: true,
      erf,
      document: documentName,
      overallScore: report.overallScore,
      compliance: compliance.level,
      totalRules: report.totalRules,
      passedRules: report.passedRules,
      failedRules: report.failedRules,
      categories: report.categories,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ START SERVER ============
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
