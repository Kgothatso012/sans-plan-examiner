/**
 * Tshwane Examiner - Unified API Server
 * 
 * Single API for all channels: Web, WhatsApp, Telegram
 * 
 * Endpoints:
 * POST /analyze   - Analyze building plan
 * POST /faq       - Zoning Q&A
 * POST /triage    - Route complaint
 * POST /parse     - Extract from document
 * GET  /health   - Health check
 */

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB max

// ============================================
// CONFIG
// ============================================

const CONFIG = {
  minimaxKey: process.env.MINIMAX_API_KEY,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_ANON_KEY,
  model: process.env.AI_MODEL || 'MiniMax-M2.5'
};

let supabase = null;
if (CONFIG.supabaseUrl && CONFIG.supabaseKey) {
  supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('../web-app'));

// ============================================
// SANS 10400 COMPLIANCE CHECKS
// ============================================

const COMPLIANCE_CHECKS = [
  { id: 'COVERAGE', name: 'Building Coverage', max: 60, unit: '%', zone: 'R1' },
  { id: 'COVERAGE', name: 'Building Coverage', max: 50, unit: '%', zone: 'R2' },
  { id: 'HEIGHT', name: 'Building Height', max: 3, unit: 'storeys', zone: 'R1' },
  { id: 'HEIGHT', name: 'Building Height', max: 2, unit: 'storeys', zone: 'R2' },
  { id: 'SETBACK_F', name: 'Front Setback', min: 3, unit: 'm', zone: 'R1' },
  { id: 'SETBACK_S', name: 'Side Setback', min: 1, unit: 'm', zone: 'R1' },
  { id: 'SETBACK_R', name: 'Rear Setback', min: 3, unit: 'm', zone: 'R1' },
  { id: 'PARKING', name: 'Parking Bays', min: 2, unit: 'bays', zone: 'R1' },
  { id: 'NONREF', name: 'Non-Refundable Fee', min: 500, unit: 'ZAR', zone: 'all' }
];

// ============================================
// AI ANALYSIS FUNCTION
// ============================================

async function analyzeWithAI(imageBase64, erf, address) {
  const prompt = `You are a building plan examiner for City of Tshwane. 
Analyze this building plan and return JSON.

INPUT:
- ERF: ${erf || 'Not provided'}
- Address: ${address || 'Not provided'}

Return JSON only (no markdown):
{
  "erf": "extracted ERF number",
  "address": "extracted address",
  "zone": "R1|R2|C1|C2|I1|OS|UU",
  "coverage": calculated %,
  "height": storeys,
  "setbacks": { "front": m, "side": m, "rear": m },
  "parking": bays,
  "compliance": [
    { "check": "COVERAGE", "status": "PASS|FAIL|WARN", "value": "40%", "required": "max 60%" }
  ],
  "issues": ["issue 1", "issue 2"],
  "recommendation": "APPROVE|CONDITIONS|REJECT",
  "examiner_notes": "brief notes"
}`;

  try {
    const response = await axios.post('https://api.minimax.chat/v1/text/chatcompletion_pro', {
      model: CONFIG.model,
      messages: [
        { role: 'system', content: 'You are a building control expert for South African municipal building regulations.' },
        { role: 'user', content: prompt + (imageBase64 ? `\n\nImage: ${imageBase64}` : '') }
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${CONFIG.minimaxKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    const text = response.data?.choices?.[0]?.message?.content || '';
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { error: 'Could not parse AI response', raw: text };
  } catch (err) {
    return { error: err.message };
  }
}

// ============================================
// FAQ KNOWLEDGE BASE
// ============================================

const FAQ = {
  'pool': 'Swimming pools require municipal approval. Submit site plan showing pool location, fencing, and filtration. Fee: R500 non-refundable.',
  'carport': 'Carports under 40m² don\'t need building approval if standalone. Include on site plan for record.',
  'second-dwelling': 'Second dwellings allowed on R1 zoned properties up to 80m². Requires separate services connection.',
  'boundary': 'Structure must be 1m from boundary (side/rear), 3m from street boundary. Check title deed restrictions.',
  'height': 'R1 max 3 storeys (9m), R2 max 2 storeys (6m). Roof space not counted if <2.3m.',
  'coverage': 'R1 max 60% coverage, R2 max 50%. Coverage = building footprint / erf size.',
  'parking': 'New residential: 2 bays per dwelling. Single dwelling on >600m²: 1 bay. Visitor parking: 1 per 5 dwellings.',
  'subdivide': 'Subdivision requires council approval. Minimum erf size: 500m² (R1).',
  'boundary-wall': 'Max height 1.8m. Requires neighbor notification for walls >1.2m on common boundary.'
};

// ============================================
// ENDPOINTS
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Analyze building plan
app.post('/api/analyze', upload.single('plan'), async (req, res) => {
  try {
    const { erf, address, text } = req.body;
    let imageBase64 = null;
    
    if (req.file) {
      imageBase64 = req.file.buffer.toString('base64');
    }
    
    const result = await analyzeWithAI(imageBase64, erf, address);
    
    // Log to Supabase
    if (supabase) {
      await supabase.from('examinations').insert({
        erf,
        address,
        result: result,
        channel: req.headers.origin || 'api'
      });
    }
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// FAQ Q&A
app.post('/api/faq', async (req, res) => {
  try {
    const { question } = req.body;
    const lower = question.toLowerCase();
    
    // Find matching FAQ
    for (const [key, answer] of Object.entries(FAQ)) {
      if (lower.includes(key)) {
        // Log to Supabase
        if (supabase) {
          await supabase.from('faq_logs').insert({ question, answer });
        }
        return res.json({ question, answer, key });
      }
    }
    
    // Use AI for unknown questions
    const prompt = `You are Tshwane Municipality building control. Answer this question from the public.
Question: ${question}
Keep answer brief (2 sentences max).`;

    const response = await axios.post('https://api.minimax.chat/v1/text/chatcompletion_pro', {
      model: CONFIG.model,
      messages: [{ role: 'user', content: prompt }]
    }, {
      headers: { 'Authorization': `Bearer ${CONFIG.minimaxKey}`, 'Content-Type': 'application/json' }
    });

    const answer = response.data?.choices?.[0]?.message?.content || 'Please contact building control directly.';

    if (supabase) {
      await supabase.from('faq_logs').insert({ question, answer });
    }

    res.json({ question, answer, source: 'ai' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Complaint triage
app.post('/api/triage', async (req, res) => {
  try {
    const { complaint, location, category } = req.body;
    
    let dept = 'unknown';
    let priority = 'normal';
    
    const lower = (complaint || '').toLowerCase();
    
    // Auto-categorize
    if (lower.match(/pothole|road|street|asphalt|tar/)) {
      dept = 'Roads';
    } else if (lower.match(/water|leak|pipe|drain/)) {
      dept = 'Water';
    } else if (lower.match(/electric|power|light|eskom/)) {
      dept = 'Electricity';
    } else if (lower.match(/tree|green|park|grass/)) {
      dept = 'Parks';
    } else if (lower.match(/rubbish|trash|waste|bin/)) {
      dept = 'Waste';
    } else if (lower.match(/noise|music|party|building/)) {
      dept = 'By-Law';
    }
    
    // Priority
    if (lower.match(/urgent|emergency|danger|safety/)) {
      priority = 'high';
    }

    const result = { complaint, location, category: dept, priority, reference: `TSH-${Date.now()}` };

    if (supabase) {
      await supabase.from('complaints').insert(result);
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Document parse
app.post('/api/parse', upload.single('document'), async (req, res) => {
  try {
    const text = req.body.text || '';
    const prompt = `Extract building application details from this text. Return JSON:
{
  "owner_name": "name",
  "erf": "number",
  "address": "address",
  "zone": "zone",
  "proposal": "what is being built"
}`;

    const response = await axios.post('https://api.minimax.chat/v1/text/chatcompletion_pro', {
      model: CONFIG.model,
      messages: [{ role: 'user', content: prompt + '\n\n' + text }]
    }, {
      headers: { 'Authorization': `Bearer ${CONFIG.minimaxKey}`, 'Content-Type': 'application/json' }
    });

    const content = response.data?.choices?.[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      res.json(JSON.parse(jsonMatch[0]));
    } else {
      res.json({ error: 'Could not parse document' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// SERVER
// ============================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🏛️ Tshwane Examiner API running on port ${PORT}`);
});