/**
 * SANS Plan Checker - Basic Rule Analysis
 * Provides building compliance checking based on SANS 10400 rules
 */

const nbrRules = [
  // Coverage Rules
  { id: 'CVRG-001', category: 'Coverage', title: 'Max Building Coverage', description: 'Building coverage must not exceed zone maximum', 
    check: (data) => data.coverage <= 60, getValue: (data) => data.coverage, required: '≤60%' },
  { id: 'CVRG-002', category: 'Coverage', title: 'Impermeable Surfaces', description: 'Impermeable surfaces must be managed', 
    check: (data) => data.impermeable <= 70, getValue: (data) => data.impermeable, required: '≤70%' },
  
  // Height Rules  
  { id: 'HEIT-001', category: 'Height', title: 'Max Building Height', description: 'Maximum 3 storeys in R1 zone',
    check: (data) => data.storeys <= 3, getValue: (data) => data.storeys, required: '≤3 storeys' },
    
  // Setback Rules
  { id: 'SETB-001', category: 'Setbacks', title: 'Front Setback', description: 'Minimum 3m front setback',
    check: (data) => data.setbackFront >= 3, getValue: (data) => data.setbackFront, required: '≥3m' },
  { id: 'SETB-002', category: 'Setbacks', title: 'Side Setback', description: 'Minimum 1m side setback',  
    check: (data) => data.setbackSide >= 1, getValue: (data) => data.setbackSide, required: '≥1m' },
  { id: 'SETB-003', category: 'Setbacks', title: 'Rear Setback', description: 'Minimum 3m rear setback',
    check: (data) => data.setbackRear >= 3, getValue: (data) => data.setbackRear, required: '≥3m' },

  // Parking
  { id: 'PRKG-001', category: 'Parking', title: 'Parking Bays', description: 'Minimum 2 parking bays per dwelling',
    check: (data) => data.parking >= 2, getValue: (data) => data.parking, required: '≥2 bays' },

  // Building Lines
  { id: 'BL-001', category: 'Building Lines', title: 'Street Boundary', description: 'Building must be set back from street',
    check: (data) => data.streetLine >= 3, getValue: (data) => data.streetLine, required: '≥3m' },
];

// Default data template
const defaultData = {
  coverage: 0,
  impermeable: 0,
  storeys: 1,
  setbackFront: 3,
  setbackSide: 1,
  setbackRear: 3,
  parking: 2,
  streetLine: 3
};

// Categories
function getAllCategories() {
  const cats = {};
  nbrRules.forEach(rule => {
    if (!cats[rule.category]) cats[rule.category] = [];
    cats[rule.category].push(rule);
  });
  return Object.keys(cats).map(cat => ({ name: cat, rules: cats[cat] }));
}

// Extract data from text
function extractDataFromText(text) {
  // Reset data
  data = { coverage: 0, impermeable: 0, storeys: 1, setbackFront: 3, setbackSide: 1, setbackRear: 3, parking: 2, streetLine: 3 };
  
  const lower = text.toLowerCase();
  
  // Extract coverage %
  const covMatch = lower.match(/coverage[:\s]*(\d+)%/);
  if (covMatch) data.coverage = parseInt(covMatch[1]);
  
  // Extract storeys
  const storeyMatch = lower.match(/(\d+)\s*storey/);
  if (storeyMatch) data.storeys = parseInt(storeyMatch[1]);
  
  // Extract setbacks
  const frontMatch = lower.match(/front\s*setback[:\s]*(\d+\.?\d*)\s*m/);
  if (frontMatch) data.setbackFront = parseFloat(frontMatch[1]);
  
  const sideMatch = lower.match(/side\s*setback[:\s]*(\d+\.?\d*)\s*m/);
  if (sideMatch) data.setbackSide = parseFloat(sideMatch[1]);
  
  const rearMatch = lower.match(/rear\s*setback[:\s]*(\d+\.?\d*)\s*m/);
  if (rearMatch) data.setbackRear = parseFloat(rearMatch[1]);
  
  // Extract parking
  const parkMatch = lower.match(/parking[:\s]*(\d+)\s*(bay|space)/);
  if (parkMatch) data.parking = parseInt(parkMatch[1]);
  
  // Extract erf size
  const erfMatch = lower.match(/erf[:\s]*(\d+)\s*m/);
  if (erfMatch) {
    const erfSize = parseInt(erfMatch[1]);
    if (erfSize > 0 && erfSize < 1000) {
      data.coverage = Math.round((data.coverage / 100) * erfSize);
    }
  }
  
  return data;
}

// Analyze document
function analyzeDocument(text, documentName = 'document.pdf', pageCount = 1) {
  extractDataFromText(text);
  
  const passedRules = [];
  const failedRules = [];
  const missingInfo = [];
  
  nbrRules.forEach(rule => {
    try {
      const result = rule.check(data);
      if (result === true) {
        passedRules.push({ id: rule.id, title: rule.title, value: rule.value() });
      } else if (result === false) {
        failedRules.push({ 
          id: rule.id, 
          title: rule.title, 
          required: rule.required,
          value: rule.value(),
          description: rule.description
        });
      }
    } catch (e) {
      missingInfo.push({ id: rule.id, title: rule.title, error: e.message });
    }
  });
  
  const totalRules = nbrRules.length;
  const overallScore = totalRules > 0 ? Math.round((passedRules.length / totalRules) * 100) : 100;
  
  return {
    documentName,
    pageCount,
    overallScore,
    totalRules,
    passedRules,
    failedRules,
    missingInfo,
    analyzedAt: new Date().toISOString()
  };
}

// Compliance level
function getComplianceLevel(score) {
  if (score >= 90) return { level: 'PASS', color: '#059669' };
  if (score >= 70) return { level: 'CONDITIONS', color: '#d97706' };
  if (score >= 50) return { level: 'REVIEW', color: '#dc2626' };
  return { level: 'REJECT', color: '#dc2626' };
}

module.exports = {
  nbrRules,
  getAllCategories,
  analyzeDocument,
  getComplianceLevel
};