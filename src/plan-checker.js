/**
 * SANS Plan Checker - Basic Rule Analysis
 * Provides building compliance checking based on SANS 10400 rules
 */

const nbrRules = [
  // === SANS 10400 BUILDING RULES ===
  
  // Coverage Rules (SANS 10400-B)
  { id: 'CVRG-001', category: 'Coverage', title: 'Max Building Coverage R1', description: 'Building coverage must not exceed 60% in R1 zone', 
    check: (data) => data.coverage <= 60, getValue: (data) => data.coverage, required: '≤60%' },
  { id: 'CVRG-002', category: 'Coverage', title: 'Max Building Coverage R2', description: 'Building coverage must not exceed 50% in R2 zone', 
    check: (data) => data.coverage <= 50, getValue: (data) => data.coverage, required: '≤50%' },
  { id: 'CVRG-003', category: 'Coverage', title: 'Impermeable Surfaces', description: 'Impermeable surfaces must not exceed 70%', 
    check: (data) => data.impermeable <= 70, getValue: (data) => data.impermeable, required: '≤70%' },
  
  // Height Rules (SANS 10400-A)
  { id: 'HEIT-001', category: 'Height', title: 'Max Height R1 Zone', description: 'Maximum 3 storeys (9m) in R1 residential zone',
    check: (data) => data.storeys <= 3, getValue: (data) => data.storeys, required: '≤3 storeys' },
  { id: 'HEIT-002', category: 'Height', title: 'Max Height R2 Zone', description: 'Maximum 2 storeys (6m) in R2 residential zone',
    check: (data) => data.storeys <= 2, getValue: (data) => data.storeys, required: '≤2 storeys' },
  
  // Setback Rules (SANS 10400-B)
  { id: 'SETB-001', category: 'Setbacks', title: 'Front Setback', description: 'Minimum 3m front street setback',
    check: (data) => data.setbackFront >= 3, getValue: (data) => data.setbackFront, required: '≥3m' },
  { id: 'SETB-002', category: 'Setbacks', title: 'Side Setback', description: 'Minimum 1m side boundary setback',  
    check: (data) => data.setbackSide >= 1, getValue: (data) => data.setbackSide, required: '≥1m' },
  { id: 'SETB-003', category: 'Setbacks', title: 'Rear Setback', description: 'Minimum 3m rear boundary setback',
    check: (data) => data.setbackRear >= 3, getValue: (data) => data.setbackRear, required: '≥3m' },

  // Parking (Tshwane Bylaws)
  { id: 'PRKG-001', category: 'Parking', title: 'Parking Bays', description: 'Minimum 2 parking bays per dwelling',
    check: (data) => data.parking >= 2, getValue: (data) => data.parking, required: '≥2 bays' },
  { id: 'PRKG-002', category: 'Parking', title: 'Visitor Parking', description: '1 visitor parking per 5 dwellings',
    check: (data) => data.visitorParking >= 1, getValue: (data) => data.visitorParking, required: '≥1' },

  // Building Lines
  { id: 'BL-001', category: 'Building Lines', title: 'Street Boundary Line', description: 'Building must be 3m from street boundary',
    check: (data) => data.streetLine >= 3, getValue: (data) => data.streetLine, required: '≥3m' },
  
  // Floor Area Ratio
  { id: 'FAR-001', category: 'FAR', title: 'Floor Area Ratio', description: 'FAR must not exceed 0.6 in R1 zone',
    check: (data) => data.far <= 0.6, getValue: (data) => data.far, required: '≤0.6' },
  
  // Boundary Walls
  { id: 'WALL-001', category: 'Walls', title: 'Max Wall Height', description: 'Boundary wall max height 1.8m',
    check: (data) => data.wallHeight <= 1.8, getValue: (data) => data.wallHeight, required: '≤1.8m' },
  
  // Second Dwelling
  { id: 'SEC-001', category: 'Second Dwelling', title: 'Second Unit Size', description: 'Second dwelling max 80m² on R1',
    check: (data) => data.secondUnit <= 80, getValue: (data) => data.secondUnit, required: '≤80m²' },
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
  visitorParking: 1,
  streetLine: 3,
  far: 0,
  wallHeight: 0,
  secondUnit: 0
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
  const data = { ...defaultData };

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
  const data = extractDataFromText(text);

  const passedRules = [];
  const failedRules = [];
  const missingInfo = [];

  nbrRules.forEach(rule => {
    try {
      const result = rule.check(data);
      if (result === true) {
        passedRules.push({ id: rule.id, title: rule.title, value: rule.getValue(data) });
      } else if (result === false) {
        failedRules.push({
          id: rule.id,
          title: rule.title,
          required: rule.required,
          value: rule.getValue(data),
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