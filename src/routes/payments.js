// Payment routes
const express = require('express');
const { supabase } = require('../config/supabase');
const { requireAdminAuth } = require('../middleware/auth');

const router = express.Router();

// Generate payment reference
router.post('/applications/:id/payment', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    const paymentRef = 'SANS-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const { data, error } = await supabase.from('applications').update({
      payment_reference: paymentRef,
      payment_amount: amount || 2500,
      payment_status: 'PENDING'
    }).eq('id', id).select().single();
    if (error) throw error;
    res.json({ reference: paymentRef, amount: amount || 2500 });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Payment webhook (simulated)
router.post('/payment/webhook', async (req, res) => {
  try {
    const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = req.headers['x-webhook-signature'];
      if (signature !== webhookSecret) {
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }
    }
    const { reference, status } = req.body;
    if (!reference || !status) {
      return res.status(400).json({ error: 'Missing reference or status' });
    }
    const { data: app } = await supabase.from('applications').select('id').eq('payment_reference', reference).single();
    if (app) {
      await supabase.from('applications').update({
        payment_status: status === 'PAID' ? 'PAID' : 'FAILED',
        payment_date: status === 'PAID' ? new Date().toISOString() : null
      }).eq('id', app.id);
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
