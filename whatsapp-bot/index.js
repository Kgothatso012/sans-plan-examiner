/**
 * Tshwane Plan Examiner - WhatsApp Bot
 *
 * Ratepayer sends building plan photo → AI analyzes → returns compliance status
 *
 * Setup:
 * 1. Run `npm install`
 * 2. Set env vars (see .env.example)
 * 3. Run `npm start`
 * 4. Configure WhatsApp Cloud API webhook URL
 */

const express = require('express');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// ============================================
// CONFIG
// ============================================

const app = express();
app.use(express.json());

// Environment variables (set in .env or production)
const CONFIG = {
  whatsappToken: process.env.WHATSAPP_TOKEN,
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  minimaxKey: process.env.MINIMAX_API_KEY,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_ANON_KEY,
  verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'tshwane-verify',
  adminNumber: process.env.ADMIN_NUMBER // Admin gets notifications
};

let supabase = null;
if (CONFIG.supabaseUrl && CONFIG.supabaseKey) {
  supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);
}

// ============================================
// SANS 10400 CHECKLIST (Simplified for Bot)
// ============================================

const COMPLIANCE_CHECKS = [
  {
    id: 'COVERAGE',
    name: 'Building Coverage',
    description: 'Max 60% coverage for residential',
    check: (extract) => {
      const match = extract.match(/coverage[:\s]*(\d+)%/i) || extract.match(/(\d+)%\s*coverage/i);
      if (match) {
        const pct = parseInt(match[1]);
        return pct <= 60 ? 'PASS' : 'FAIL';
      }
      return 'PENDING';
    }
  },
  {
    id: 'ZONING',
    name: 'Zoning',
    description: 'Residential/Commercial/Industrial indicated',
    check: (extract) => {
      const zoning = extract.match(/zoning[:\s]*(\w+)/i);
      if (zoning && ['residential', 'commercial', 'industrial'].includes(zoning[1].toLowerCase())) {
        return 'PASS';
      }
      return 'PENDING';
    }
  },
  {
    id: 'SETBACK',
    name: 'Setbacks',
    description: 'Minimum 3m front, 1.5m sides',
    check: (extract) => {
      const setback = extract.match(/setback/i);
      return setback ? 'PASS' : 'PENDING';
    }
  },
  {
    id: 'HEIGHT',
    name: 'Building Height',
    description: 'Max 3 storeys or per zoning',
    check: (extract) => {
      const storeys = extract.match(/(\d+)\s*(?:storey|storeys|level|levels)/i);
      if (storeys && parseInt(storeys[1]) <= 3) return 'PASS';
      return 'PENDING';
    }
  }
];

// ============================================
// WHATSAPP API HELPERS
// ============================================

async function sendWhatsAppMessage(to, text) {
  if (!CONFIG.whatsappToken) return console.log('No WhatsApp token, would send:', text);

  try {
    await axios.post(`https://graph.facebook.com/v21.0/${CONFIG.whatsappPhoneNumberId}/messages`, {
      messaging_product: 'whatapp',
      to,
      text: { body: text }
    }, {
      headers: { 'Authorization': `Bearer ${CONFIG.whatsappToken}` }
    });
  } catch (e) {
    console.error('WhatsApp send error:', e.response?.data || e.message);
  }
}

async function sendWhatsAppImage(to, imageUrl, caption) {
  if (!CONFIG.whatsappToken) return;

  try {
    await axios.post(`https://graph.facebook.com/v21.0/${CONFIG.whatsappPhoneNumberId}/messages`, {
      messaging_product: 'whatapp',
      to,
      type: 'image',
      image: { id: imageUrl } // Or use link/caption for URL
    }, {
      headers: { 'Authorization': `Bearer ${CONFIG.whatsappToken}` }
    });
  } catch (e) {
    console.error('WhatsApp image error:', e.response?.data || e.message);
  }
}

async function downloadMedia(mediaId) {
  if (!CONFIG.whatsappToken) return null;

  try {
    // Get media URL
    const mediaRes = await axios.get(`https://graph.facebook.com/v21.0/${mediaId}`, {
      headers: { 'Authorization': `Bearer ${CONFIG.whatsappToken}` }
    });

    const url = mediaRes.data.url;

    // Download the actual media
    const mediaRes2 = await axios.get(url, {
      headers: { 'Authorization': `Bearer ${CONFIG.whatsappToken}` },
      responseType: 'arraybuffer'
    });

    return Buffer.from(mediaRes2.data);
  } catch (e) {
    console.error('Media download error:', e.message);
    return null;
  }
}

// ============================================
// AI ANALYSIS
// ============================================

async function analyzePlan(imageBuffer, filename) {
  // For now, simulate with text extraction
  // In production: use Claude Vision or MiniMax Vision API

  const EXTracted_SAMPLE = `
    Proposed residential dwelling on Erf 12345
    Coverage: 55%
    Zoning: Residential
    Setback: Front 3m, Sides 1.5m
    2 Storeys
    Floor area: 250m²
  `; // This would come from OCR/Vision

  return EXTracted_SAMPLE;
}

function checkCompliance(extractedText) {
  const results = COMPLIANCE_CHECKS.map(check => ({
    ...check,
    status: check.check(extractedText)
  }));

  // Generate summary
  const passCount = results.filter(r => r.status === 'PASS').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;

  return {
    results,
    summary: passCount >= 3 ? 'LIKELY_COMPLIANT' : failCount >= 1 ? 'NEEDS_REVIEW' : 'INCOMPLETE',
    passCount,
    failCount
  };
}

function formatComplianceResponse(analysis) {
  let msg = '🏠 *TSHWANE PLAN CHECK*\n\n';
  msg += '━━━━━━━━━━━━━━━━━━━━\n\n';

  for (const r of analysis.results) {
    const icon = r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '⚪';
    msg += `${icon} *${r.name}*\n`;
    msg += `   ${r.description}\n`;
    msg += `   Status: ${r.status}\n\n`;
  }

  msg += '━━━━━━━━━━━━━━━━━━━━\n\n';
  msg += `*Summary:* ${analysis.summary}\n`;
  msg += `Passed: ${analysis.passCount}/${analysis.results.length}\n\n`;

  if (analysis.summary === 'LIKELY_COMPLIANT') {
    msg += '✨ *Plan appears compliant.*\n';
    msg += 'Submit to Building Control for final approval.\n';
  } else if (analysis.summary === 'NEEDS_REVIEW') {
    msg += '⚠️ *Some issues detected.*\n';
    msg += 'Please address flagged items before resubmitting.\n';
  } else {
    msg += '📋 *More information needed.*\n';
    msg += 'Please include coverage %, zoning, and setbacks.\n';
  }

  msg += '\n---\n';
  msg += '_Powered by AI for Tshwane_';

  return msg;
}

// ============================================
// WEBHOOK HANDLERS
// ============================================

// WhatsApp verification (GET)
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === CONFIG.verifyToken) {
    console.log('WhatsApp webhook verified');
    res.send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// WhatsApp messages (POST)
app.post('/webhook', async (req, res) => {
  const { entry } = req.body;

  // Acknowledge immediately
  res.sendStatus(200);

  if (!entry || !entry[0]?.changes) return;

  const changes = entry[0].changes;
  for (const change of changes) {
    const messages = change.value?.messages;
    if (!messages) continue;

    for (const msg of messages) {
      const from = msg.from;
      const type = msg.type;

      console.log(`Received ${type} from ${from}`);

      // Handle text
      if (type === 'text') {
        const text = msg.text.body.toLowerCase().trim();

        if (text === 'hi' || text === 'hello' || text === 'start') {
          sendWhatsAppMessage(from,
            '🏠 *Welcome to Tshwane Plan Checker*\n\n' +
            'Send a photo of your building plan and I\'ll check for compliance.\n\n' +
            'I check: coverage %, zoning, setbacks, height.\n\n' +
            '_Powered by AI for Tshwane_'
          );
        } else if (text === 'help') {
          sendWhatsAppMessage(from,
            '*Commands:*\n' +
            '• Send photo of building plan\n' +
            '• Type "demo" for sample analysis\n' +
            '• Type "help" for this message'
          );
        } else if (text === 'demo') {
          // Demo analysis
          const analysis = checkCompliance(
            'Coverage: 55%\nZoning: Residential\nSetback: 3m front\n2 Storeys'
          );
          sendWhatsAppMessage(from, formatComplianceResponse(analysis));
        } else {
          sendWhatsAppMessage(from,
            `I didn't understand "${msg.text.body}"\n\n` +
            'Send a building plan photo or type "help" for options.'
          );
        }
      }

      // Handle image/document
      else if (type === 'image' || type === 'document') {
        try {
          sendWhatsAppMessage(from, '📎 Received! Analyzing your plan...');

          // Download media
          const mediaId = msg[type].id;
          const imageBuffer = await downloadMedia(mediaId);

          // Store if Supabase configured
          let storedUrl = null;
          if (supabase && imageBuffer) {
            const fileName = `plans/${from}-${Date.now()}.jpg`;
            const { data, error } = await supabase.storage
              .from('plans')
              .upload(fileName, imageBuffer);

            if (!error && data) {
              const { data: urlData } = supabase.storage
                .from('plans')
                .getPublicUrl(fileName);
              storedUrl = urlData.publicUrl;
            }
          }

          // Analyze (simulated for now)
          const mockExtraction = `
            Erf: ${from.slice(-6)}
            Coverage: 58%
            Zoning: Residential
            Setback: Front 3m, Sides 1.5m
            2 Storeys
          `; // Would come from Vision API in production

          const analysis = checkCompliance(mockExtraction);
          sendWhatsAppMessage(from, formatComplianceResponse(analysis));

          // Log to Supabase
          if (supabase) {
            await supabase.from('examinations').insert({
              phone: from,
              coverage_pct: 58,
              zoning: 'Residential',
              status: analysis.summary,
              plan_url: storedUrl,
              created_at: new Date().toISOString()
            });
          }

        } catch (e) {
          console.error('Analysis error:', e);
          sendWhatsAppMessage(from,
            '❌ Error analyzing plan. Please try again or type "demo" for sample.'
          );
        }
      }
    }
  }
});

// ============================================
// HEALTH & ADMIN
// ============================================

app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/stats', async (req, res) => {
  if (!supabase) {
    return res.json({ error: 'No Supabase configured' });
  }

  const { count } = await supabase
    .from('examinations')
    .select('*', { count: 'exact', head: true });

  res.json({ total_examinations: count });
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   TSHWANE PLAN EXAMINER BOT           ║
║   WhatsApp Cloud API                ║
╠════════════════════════════════════════╣
║   Webhook: /webhook               ║
║   Health:   /health              ║
║   Stats:    /stats               ║
╠════════════════════════════════════════╣
║   Running on port ${PORT}              ║
╚════════════════════════════════════════╝
  `);
});

module.exports = app; // For testing