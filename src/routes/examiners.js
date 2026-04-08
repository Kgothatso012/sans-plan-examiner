// Examiner routes
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');
const { JWT_SECRET, requireAdminAuth, requireExaminerAuth } = require('../middleware/auth');
const { logAudit } = require('../services/audit');

const router = express.Router();

// Register examiner
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, employee_number } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name required' });
    }
    const password_hash = await bcrypt.hash(password, 10);
    const { data, error } = await supabase.from('examiners').insert({
      email, password_hash, name, employee_number
    }).select().single();
    if (error) throw error;
    const token = jwt.sign({ examiner_id: data.id, email: data.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, examiner: { id: data.id, email: data.email, name: data.name } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Login examiner
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data: examiner, error } = await supabase.from('examiners').select('*').eq('email', email).single();
    if (error || !examiner) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const valid = await bcrypt.compare(password, examiner.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ examiner_id: examiner.id, email: examiner.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, examiner: { id: examiner.id, email: examiner.email, name: examiner.name } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get examiner's queue
router.get('/queue', requireExaminerAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('assigned_to', req.examiner.examiner_id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// List all examiners (admin)
router.get('/', requireAdminAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('examiners').select('id,email,name,employee_number,created_at');
    if (error) throw error;
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
