// Revision routes
const express = require('express');
const fs = require('fs');
const { supabase } = require('../config/supabase');
const { upload } = require('../config/middleware');
const { notifyApplicant } = require('../services/email');

const router = express.Router();

// Submit revision
router.post('/applications/:id/revisions', upload.array('documents', 10), async (req, res) => {
  try {
    const { id } = req.params;
    const { change_log } = req.body;

    const { data: revisions } = await supabase
      .from('application_revisions')
      .select('revision_number')
      .eq('application_id', id)
      .order('revision_number', { ascending: false })
      .limit(1);

    const newRevision = (revisions?.[0]?.revision_number || 0) + 1;

    const { data: revision, error } = await supabase
      .from('application_revisions')
      .insert({
        application_id: id,
        revision_number: newRevision,
        change_log: change_log || '',
        status: 'PENDING'
      })
      .select()
      .single();

    if (error) throw error;

    const revisionFiles = Array.isArray(req.files) ? req.files : (req.files ? [req.files] : []);
    if (revisionFiles.length > 0) {
      for (const file of revisionFiles) {
        const fileName = `${id}/rev${newRevision}/${Date.now()}-${file.originalname}`;
        const fileBuffer = fs.readFileSync(file.path);

        await supabase.storage.from('applications').upload(fileName, fileBuffer);

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

    await supabase
      .from('applications')
      .update({ status: 'REVISION', updated_at: new Date().toISOString() })
      .eq('id', id);

    await notifyApplicant(id, 'revision_submitted');

    res.json({ success: true, revision, revisionNumber: newRevision });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get revisions
router.get('/applications/:id/revisions', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: revisions, error } = await supabase
      .from('application_revisions')
      .select('*')
      .eq('application_id', id)
      .order('revision_number', { ascending: true });

    if (error) throw error;

    const revisionsWithDocs = await Promise.all((revisions || []).map(async (rev) => {
      const { data: docs } = await supabase.from('application_documents').select('*').eq('application_id', id);
      return { ...rev, documents: docs || [] };
    }));

    res.json(revisionsWithDocs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
