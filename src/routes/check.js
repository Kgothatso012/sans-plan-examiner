// Check routes (plan checker)
const express = require('express');
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const { upload } = require('../config/middleware');

const router = express.Router();

// Import plan checker
let nbrRules, getAllCategories, analyzeDocument, getComplianceLevel;
try {
  const checker = require('../plan-checker.js');
  nbrRules = checker.nbrRules;
  getAllCategories = checker.getAllCategories;
  analyzeDocument = checker.analyzeDocument;
  getComplianceLevel = checker.getComplianceLevel;
} catch (e) {
  // Plan checker not available
}

// List rules
router.get('/rules', (req, res) => {
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

// Check plan endpoint
router.post('/check', upload.single('file'), async (req, res) => {
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
    res.status(500).json({ error: error.message });
  }
});

// Quick check with text
router.post('/check/text', async (req, res) => {
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

module.exports = router;
