// Authentication routes
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');
const { JWT_SECRET, requireAuth } = require('../middleware/auth');
const { isValidEmail } = require('../middleware/validation');

const router = express.Router();

// Register new applicant
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

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

    const token = jwt.sign({ applicantId: applicant.id, email: applicant.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ success: true, token, applicant: { id: applicant.id, email: applicant.email, name: applicant.name } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Demo mode
    if (email === 'demo@example.com' && password === 'demo123') {
      const token = jwt.sign({ applicantId: 'demo-user', email: 'demo@example.com' }, JWT_SECRET || 'demo-secret', { expiresIn: '7d' });
      return res.json({ success: true, token, applicant: { id: 'demo-user', email: 'demo@example.com', name: 'Demo User' } });
    }

    const { data: applicant, error } = await supabase
      .from('applicants')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !applicant) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, applicant.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ applicantId: applicant.id, email: applicant.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ success: true, token, applicant: { id: applicant.id, email: applicant.email, name: applicant.name } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user
router.get('/me', requireAuth, async (req, res) => {
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

module.exports = router;
