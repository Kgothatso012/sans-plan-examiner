/**
 * Tshwane Document Parser
 *
 * AI extracts data from scanned application forms
 */

const express = require('express');
const multer = require('multer');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Fields to extract from forms
const FIELD_PATTERNS = {
  erf: /(?:erf|port|plot)\s*no\.?\s*:?\s*([a-z0-9]+)/i,
  owner: /(?:owner|name|applicant)\s*(?:name)?\s*:?\s*([a-z\s]+)/i,
  address: /(?:address|property)\s*(?:address)?\s*:?\s*([a-z0-9\s,]+)/i,
  phone: /(?:phone|tel|mobile|cell)\s*:?\s*(\+?[\d\s\-]+)/i,
  email: /email\s*:?\s*([a-z@.\s]+)/i,
  area: /(?:floor\s*)?area\s*:?\s*(\d+)\s*m²/i,
  zoning: /zoning\s*:?\s*([a-z]+)/i,
  coverage: /coverage\s*:?\s*(\d+)\s*%/i,
  storeys: /(\d+)\s*(?:storey|storeys|level|levels)/i,
  height: /height\s*:?\s*([\d.]+)\s*m/i
};

// Extract fields from text
function parseFields(text) {
  const result = {};

  for (const [field, pattern] of Object.entries(FIELD_PATTERNS)) {
    const match = text.match(pattern);
    if (match) {
      result[field] = match[1].trim();
    }
  }

  return result;
}

// Route: Upload form
app.post('/parse', upload.single('document'), async (req, res) => {
  if (!req.file) {
    return res.json({ error: 'No file uploaded' });
  }

  try {
    const text = req.file.originalname.endsWith('.pdf')
      ? await extractPdfText(req.file.path)
      : await extractImageText(req.file.path);

    const fields = parseFields(text);

    res.json({
      success: true,
      file: req.file.originalname,
      raw_text: text.substring(0, 500),
      extracted: fields,
      confidence: Object.keys(fields).length >= 3 ? 'high' : 'medium'
    });
  } catch (e) {
    res.json({ error: e.message });
  } finally {
    fs.rmSync(req.file.path, { force: true });
  }
});

// Health
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Simple text extraction (would use Vision API in production)
async function extractPdfText(path) {
  // Placeholder - would use pdf-parse
  return `
    ERF NUMBER: 12345
    OWNER: John Smith
    ADDRESS: 123 Main St, Pretoria
    PHONE: +27721234567
    EMAIL: john@example.com
    FLOOR AREA: 250m²
    ZONING: Residential
    COVERAGE: 55%
    STOREYS: 2
  `;
}

async function extractImageText(path) {
  return `
    ERF NUMBER: 12345
    OWNER: Jane Doe
    PHONE: +27831234567
    FLOOR AREA: 180m²
    ZONING: Residential
    COVERAGE: 48%
  `;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════╗
║   TSHWANE DOCUMENT PARSER          ║
╠═══════════════════════════════════╣
║   POST /parse (multipart/form)    ║
║   GET  /health                     ║
╠═══════════════════════════════════╣
║   Running on port ${PORT}              ║
╚═══════════════════════════════════╝
  `);
});

module.exports = app;