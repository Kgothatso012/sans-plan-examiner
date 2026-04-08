// Document routes
const express = require('express');
const fs = require('fs');
const { supabase } = require('../config/supabase');
const { requireAdminAuth } = require('../middleware/auth');
const { upload } = require('../config/middleware');
const { logAudit } = require('../services/audit');

const router = express.Router();

// List documents for application
router.get('/applications/:id/documents', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: docs, error } = await supabase
      .from('application_documents')
      .select('id, document_type, file_name, file_size, storage_path, created_at')
      .eq('application_id', id);

    if (error) throw error;
    res.json(docs || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload document to application (admin)
router.post('/applications/:id/documents', requireAdminAuth, upload.single('documents'), async (req, res) => {
  try {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const fileName = `${id}/${Date.now()}-${file.originalname}`;
    const fileBuffer = fs.readFileSync(file.path);

    const { error: uploadError } = await supabase.storage.from('applications').upload(fileName, fileBuffer);
    if (uploadError) {
      console.error('Storage upload error:', uploadError);
    }

    const { data: doc, error } = await supabase
      .from('application_documents')
      .insert({
        application_id: id,
        doc_type: 'building_plans',
        storage_path: fileName,
        file_name: file.originalname,
        file_size: file.size
      })
      .select()
      .single();

    if (error) throw error;
    fs.unlinkSync(file.path);

    await logAudit('UPLOAD_DOCUMENT', 'application', id, { fileName: file.originalname });

    res.json({ success: true, document: doc });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get document download URL
router.get('/documents/:appId/:docId', async (req, res) => {
  try {
    const { appId, docId } = req.params;

    const { data: doc } = await supabase.from('application_documents').select('*').eq('id', docId).single();
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const { data: url } = supabase.storage.from('applications').getPublicUrl(doc.storage_path);
    res.json({ url: url.publicUrl, fileName: doc.file_name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download document (redirect)
router.get('/documents/:appId/:docId/download', async (req, res) => {
  try {
    const { appId, docId } = req.params;

    const { data: doc } = await supabase.from('application_documents').select('*').eq('id', docId).single();
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const { data: url } = supabase.storage.from('applications').getPublicUrl(doc.storage_path);
    res.redirect(url.publicUrl);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
