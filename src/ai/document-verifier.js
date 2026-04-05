/**
 * SANS Plan Examiner - Document Verification Module
 * Uses OCR to scan PDFs and verify document consistency
 */

const Tesseract = require('tesseract.js');
const pdf = require('pdf-parse');
const fs = require('fs');

class DocumentVerifier {
  constructor() {
    this.workers = {};
  }

  /**
   * Extract text from any document (PDF or image)
   */
  async extractText(fileBuffer, fileType) {
    try {
      if (fileType === 'application/pdf') {
        // Try PDF text layer first
        try {
          const pdfData = await pdf(fileBuffer);
          if (pdfData.text && pdfData.text.length > 100) {
            return { success: true, text: pdfData.text, method: 'pdf-parse' };
          }
        } catch (e) { /* Fall through to OCR */ }

        // Use OCR for scanned PDFs
        return await this.extractWithOCR(fileBuffer);
      } else if (fileType.startsWith('image/')) {
        return await this.extractWithOCR(fileBuffer);
      }

      return { success: false, error: 'Unsupported file type' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Extract text using Tesseract OCR
   */
  async extractWithOCR(buffer) {
    try {
      const result = await Tesseract.recognize(buffer, 'eng', {
        logger: () => {} // Suppress progress
      });
      return {
        success: true,
        text: result.data.text,
        confidence: result.data.confidence,
        method: 'ocr'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Verify all documents for an application
   */
  async verifyApplication(documents) {
    const results = {
      timestamp: new Date().toISOString(),
      documents: {},
      verification: {},
      issues: [],
      passed: true
    };

    // Extract text from each document
    for (const doc of documents) {
      const textResult = await this.extractText(doc.buffer, doc.mimeType);
      results.documents[doc.doc_type] = {
        text: textResult.text || '',
        method: textResult.method || 'none',
        confidence: textResult.confidence || 0
      };
    }

    // Run verification checks
    const docs = results.documents;

    // 1. Check zoning consistency
    const zoningResult = this.verifyZoning(docs);
    results.verification.zoning = zoningResult;

    // 2. Check erf number consistency
    const erfResult = this.verifyErfNumber(docs);
    results.verification.erf = erfResult;

    // 3. Check servitudes
    const servitudeResult = this.verifyServitudes(docs);
    results.verification.servitudes = servitudeResult;

    // 4. Check building lines
    const buildingLinesResult = this.verifyBuildingLines(docs);
    results.verification.buildingLines = buildingLinesResult;

    // 5. Check sewer connection
    const sewerResult = this.verifySewer(docs);
    results.verification.sewer = sewerResult;

    // 6. Check coverage calculation
    const coverageResult = this.verifyCoverage(docs);
    results.verification.coverage = coverageResult;

    // 7. Check title deed match
    const titleDeedResult = this.verifyTitleDeed(docs);
    results.verification.titleDeed = titleDeedResult;

    // Compile issues
    Object.values(results.verification).forEach(check => {
      if (check.status === 'FAIL') {
        results.issues.push(check.message);
        results.passed = false;
      }
    });

    return results;
  }

  /**
   * Verify zoning is consistent across documents
   */
  verifyZoning(docs) {
    const zoningKeywords = ['zoning', 'residential', 'commercial', 'industrial', 'r1', 'r2', 'r3', 'c1', 'c2', 'c3'];

    let foundZoning = null;
    let issues = [];

    // Find zoning mention in each document
    Object.entries(docs).forEach(([docType, doc]) => {
      const text = (doc.text || '').toLowerCase();
      const matches = zoningKeywords.filter(kw => text.includes(kw));

      if (matches.length > 0) {
        if (!foundZoning) {
          foundZoning = { type: matches[0], docs: [docType] };
        } else if (foundZoning.type !== matches[0]) {
          issues.push(`Zoning conflict: ${docType} shows '${matches[0]}' but earlier shows '${foundZoning.type}'`);
        } else {
          foundZoning.docs.push(docType);
        }
      }
    });

    if (issues.length > 0) {
      return { status: 'FAIL', message: issues.join('; ') };
    }
    return { status: 'PASS', message: 'Zoning consistent across documents' };
  }

  /**
   * Verify ERF number matches across documents
   */
  verifyErfNumber(docs) {
    const erfPattern = /\b(\d{4,6}[A-Z]?)\b/i;

    let erfNumbers = {};

    Object.entries(docs).forEach(([docType, doc]) => {
      const matches = (doc.text || '').match(erfPattern);
      if (matches) {
        erfNumbers[docType] = matches[1];
      }
    });

    const uniqueErfs = [...new Set(Object.values(erfNumbers))];

    if (uniqueErfs.length > 1) {
      return { status: 'FAIL', message: `ERF mismatch: ${JSON.stringify(erfNumbers)}` };
    }
    return { status: 'PASS', message: `ERF ${uniqueErfs[0] || 'not found'} consistent` };
  }

  /**
   * Check if servitudes are shown on building plan
   */
  verifyServitudes(docs) {
    const servitudeKeywords = ['servitude', 'easement', 'right of way', 'servient', 'dominant'];

    const buildingPlan = docs.building_plans?.text?.toLowerCase() || '';
    const sgDoc = docs.sg?.text?.toLowerCase() || '';

    const hasServitudeOnSG = servitudeKeywords.some(kw => sgDoc.includes(kw));
    const hasServitudeOnPlan = servitudeKeywords.some(kw => buildingPlan.includes(kw));

    if (hasServitudeOnSG && !hasServitudeOnPlan) {
      return { status: 'WARN', message: 'Servitude shown on SG but not marked on building plan' };
    }
    return { status: 'PASS', message: 'Servitude check complete' };
  }

  /**
   * Verify building lines are indicated
   */
  verifyBuildingLines(docs) {
    const buildingLineKeywords = ['building line', 'setback', 'building restriction', 'street line', 'common boundary'];

    const buildingPlan = docs.building_plans?.text?.toLowerCase() || '';
    const hasBuildingLines = buildingLineKeywords.some(kw => buildingPlan.includes(kw));

    // Also check for numeric measurements near boundaries
    const setbackPattern = /(\d+(?:\.\d+)?)\s*(m|mm|metres?|feet|')/gi;
    const measurements = [...buildingPlan.matchAll(setbackPattern)];

    if (measurements.length === 0 && !hasBuildingLines) {
      return { status: 'WARN', message: 'No building line/setback measurements found on plan' };
    }
    return { status: 'PASS', message: `Found ${measurements.length} setback measurements` };
  }

  /**
   * Verify sewer connection point is shown
   */
  verifySewer(docs) {
    const sewerKeywords = ['sewer', 'sewage', 'drain', 'waste water', 'connection', 'manhole', 'inspection chamber'];

    const buildingPlan = docs.building_plans?.text?.toLowerCase() || '';
    const hasSewer = sewerKeywords.some(kw => buildingPlan.includes(kw));

    if (!hasSewer) {
      return { status: 'WARN', message: 'No sewer connection point shown on plan' };
    }
    return { status: 'PASS', message: 'Sewer connection indicated' };
  }

  /**
   * Verify coverage percentage and calculate from plan if needed
   */
  verifyCoverage(docs) {
    const coveragePattern = /coverage[:\s]*(\d+(?:\.\d+)?)\s*%/i;

    let foundCoverage = null;
    let issues = [];

    Object.entries(docs).forEach(([docType, doc]) => {
      const text = doc.text || '';
      const match = text.match(coveragePattern);

      if (match) {
        const pct = parseFloat(match[1]);
        if (!foundCoverage) {
          foundCoverage = { value: pct, docs: [docType] };
        } else if (Math.abs(foundCoverage.value - pct) > 5) {
          issues.push(`${docType}: ${pct}% differs from ${foundCoverage.docs[0]}: ${foundCoverage.value}%`);
        } else {
          foundCoverage.docs.push(docType);
        }
      }
    });

    if (issues.length > 0) {
      return { status: 'FAIL', message: issues.join('; ') };
    }

    if (foundCoverage && foundCoverage.value > 60) {
      return { status: 'FAIL', message: `Coverage ${foundCoverage.value}% exceeds 60% max for residential` };
    }

    return foundCoverage
      ? { status: 'PASS', message: `Coverage ${foundCoverage.value}% within limits` }
      : { status: 'WARN', message: 'No coverage percentage found - manual calculation needed' };
  }

  /**
   * Verify title deed property matches building plan
   */
  verifyTitleDeed(docs) {
    const titleDeed = docs.title_deed?.text || '';
    const buildingPlan = docs.building_plans?.text || '';

    // Check for property description matching
    const patterns = [
      /erf\s*(\d+)/i,
      /portion\s*(\d+)/i,
      /farm\s*(\w+)/i,
      /lot\s*(\d+)/i
    ];

    let titleProps = [];
    let planProps = [];

    patterns.forEach(pattern => {
      const titleMatch = titleDeed.match(pattern);
      if (titleMatch) titleProps.push(titleMatch[0]);

      const planMatch = buildingPlan.match(pattern);
      if (planMatch) planProps.push(planMatch[0]);
    });

    if (titleProps.length > 0 && planProps.length > 0) {
      const common = titleProps.filter(t => planProps.some(p => p.toLowerCase() === t.toLowerCase()));
      if (common.length === 0) {
        return { status: 'FAIL', message: `Property reference mismatch: Title has ${titleProps.join(', ')} but plan has ${planProps.join(', ')}` };
      }
    }

    return { status: 'PASS', message: 'Title deed check complete' };
  }
}

module.exports = new DocumentVerifier();