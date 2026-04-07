/**
 * SANS Plan Checker - Comprehensive Rule Analysis
 * Provides building compliance checking based on SANS 10400 regulations
 *
 * Coverage: 14 base rules + 8 additional rules = 22 total rules
 */

const nbrRules = [
  // === SANS 10400-B / TSHWANE SCHEME - COVERAGE & ZONING ===

  // Coverage Rules
  { id: 'CVRG-001', category: 'Coverage', title: 'Max Building Coverage R1', description: 'Building coverage must not exceed 60% in R1 zone',
    check: (data) => data.coverage <= 60, getValue: (data) => data.coverage, required: '≤60%' },
  { id: 'CVRG-002', category: 'Coverage', title: 'Max Building Coverage R2', description: 'Building coverage must not exceed 50% in R2 zone',
    check: (data) => data.coverage <= 50, getValue: (data) => data.coverage, required: '≤50%' },
  { id: 'CVRG-003', category: 'Coverage', title: 'Impermeable Surfaces', description: 'Impermeable surfaces must not exceed 70%',
    check: (data) => data.impermeable <= 70, getValue: (data) => data.impermeable, required: '≤70%' },

  // Height Rules (SANS 10400-H)
  { id: 'HEIT-001', category: 'Height', title: 'Max Height R1 Zone', description: 'Maximum 3 storeys (9m) in R1 residential zone',
    check: (data) => data.storeys <= 3, getValue: (data) => data.storeys, required: '≤3 storeys' },
  { id: 'HEIT-002', category: 'Height', title: 'Max Height R2 Zone', description: 'Maximum 2 storeys (6m) in R2 residential zone',
    check: (data) => data.storeys <= 2, getValue: (data) => data.storeys, required: '≤2 storeys' },

  // Setback Rules (SANS 10400-B / Tshwane Scheme Clause 20)
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

  // Floor Area Ratio (Tshwane Scheme Clause 20)
  { id: 'FAR-001', category: 'FAR', title: 'Floor Area Ratio', description: 'FAR must not exceed 0.6 in R1 zone',
    check: (data) => data.far <= 0.6, getValue: (data) => data.far, required: '≤0.6' },

  // Boundary Walls (Tshwane Scheme)
  { id: 'WALL-001', category: 'Walls', title: 'Max Wall Height', description: 'Boundary wall max height 1.8m',
    check: (data) => data.wallHeight <= 1.8, getValue: (data) => data.wallHeight, required: '≤1.8m' },

  // Second Dwelling (Tshwane Scheme Clause 20)
  { id: 'SEC-001', category: 'Second Dwelling', title: 'Second Unit Size', description: 'Second dwelling max 80m² on R1',
    check: (data) => data.secondUnit <= 80, getValue: (data) => data.secondUnit, required: '≤80m²' },

  // === SANS 10400-A / C - DIMENSIONS ===

  // Ceiling Height Rules (SANS 10400-C)
  { id: 'CEIL-001', category: 'Dimensions', title: 'Habitable Room Ceiling Height', description: 'Minimum 2.4m ceiling height for habitable rooms (SANS 10400-C)',
    check: (data) => data.ceilingHeight >= 2.4, getValue: (data) => data.ceilingHeight, required: '≥2.4m' },
  { id: 'CEIL-002', category: 'Dimensions', title: 'Non-Habitable Room Ceiling Height', description: 'Minimum 2.1m ceiling height for non-habitable rooms (SANS 10400-C)',
    check: (data) => data.ceilingHeightNonHab >= 2.1, getValue: (data) => data.ceilingHeightNonHab, required: '≥2.1m' },

  // Room Size Rules (SANS 10400-E)
  { id: 'ROOM-001', category: 'Dimensions', title: 'Habitable Room Minimum Area', description: 'Minimum 8m² for habitable rooms',
    check: (data) => data.habitableRoomArea >= 8, getValue: (data) => data.habitableRoomArea, required: '≥8m²' },
  { id: 'ROOM-002', category: 'Dimensions', title: 'Bedroom Minimum Area', description: 'Minimum 7m² for bedrooms',
    check: (data) => data.bedroomArea >= 7, getValue: (data) => data.bedroomArea, required: '≥7m²' },

  // === SANS 10400-D - STAIRS ===

  { id: 'STIR-001', category: 'Stairs', title: 'Min Stair Width', description: 'Minimum 900mm stair width (SANS 10400-D)',
    check: (data) => data.stairWidth >= 900, getValue: (data) => data.stairWidth, required: '≥900mm' },
  { id: 'STIR-002', category: 'Stairs', title: 'Max Riser Height', description: 'Maximum 180mm riser height (SANS 10400-D)',
    check: (data) => data.riserHeight <= 180, getValue: (data) => data.riserHeight, required: '≤180mm' },
  { id: 'STIR-003', category: 'Stairs', title: 'Min Tread Depth', description: 'Minimum 250mm tread depth (SANS 10400-D)',
    check: (data) => data.treadDepth >= 250, getValue: (data) => data.treadDepth, required: '≥250mm' },

  // === SANS 10400-G - VENTILATION ===

  { id: 'VENT-001', category: 'Ventilation', title: 'Min Window Area', description: 'Window area minimum 10% of floor area for habitable rooms (SANS 10400-G)',
    check: (data) => data.windowAreaPct >= 10, getValue: (data) => data.windowAreaPct, required: '≥10%' },
  { id: 'VENT-002', category: 'Ventilation', title: 'Min Openable Area', description: 'Openable window area minimum 5% of floor area (SANS 10400-G)',
    check: (data) => data.openableAreaPct >= 5, getValue: (data) => data.openableAreaPct, required: '≥5%' },

  // === SANS 10400-N - GLAZING ===

  { id: 'GLAZ-001', category: 'Glazing', title: 'Safety Glass Locations', description: 'Safety glass required for doors, side panels, and low windows (SANS 10400-N)',
    check: (data) => data.safetyGlassRequired === true, getValue: (data) => data.safetyGlassRequired ? 'Yes' : 'No', required: 'Required' },

  // === SANS 10400-B - FIRE SAFETY ===

  { id: 'FIRE-001', category: 'Fire Safety', title: 'Occupancy Classification', description: 'Building must have proper occupancy classification (SANS 10400-B)',
    check: (data) => data.occupancyClass !== null && data.occupancyClass !== undefined,
    getValue: (data) => data.occupancyClass || 'Not specified', required: 'Required' },
  { id: 'FIRE-002', category: 'Fire Safety', title: 'Fire Detector Present', description: 'Smoke detectors required for residential (SANS 10400-B)',
    check: (data) => data.fireDetector === true, getValue: (data) => data.fireDetector ? 'Yes' : 'No', required: 'Required' },
  { id: 'FIRE-003', category: 'Fire Safety', title: 'Fire Extinguisher', description: 'Fire extinguisher required per 100m² (SANS 10400-B)',
    check: (data) => data.fireExtinguisherCount >= 1, getValue: (data) => data.fireExtinguisherCount, required: '≥1' },

  // === SANS 10400-E - ACCESS FOR DISABLED ===

  { id: 'DIS-001', category: 'Disabled Access', title: 'Disabled Parking Bays', description: 'Minimum 1 disabled parking bay per 50 (SANS 10400-E)',
    check: (data) => data.disabledParking >= 1, getValue: (data) => data.disabledParking, required: '≥1' },
  { id: 'DIS-002', category: 'Disabled Access', title: 'Disabled Toilet', description: 'Disabled accessible toilet required (SANS 10400-E)',
    check: (data) => data.disabledToilet === true, getValue: (data) => data.disabledToilet ? 'Yes' : 'No', required: 'Required' },
  { id: 'DIS-003', category: 'Disabled Access', title: 'Ramp Gradient', description: 'Ramp gradient max 1:12 for disabled (SANS 10400-E)',
    check: (data) => data.rampGradient <= 8.33, getValue: (data) => data.rampGradient, required: '≤8.33%' },

  // === SANS 10400-J - STRUCTURAL ===

  { id: 'STR-001', category: 'Structural', title: 'DPC Required', description: 'Damp proof course required at ground level (SANS 10400-J)',
    check: (data) => data.dpcRequired === true, getValue: (data) => data.dpcRequired ? 'Yes' : 'No', required: 'Required' },
  { id: 'STR-002', category: 'Structural', title: 'Foundation Depth', description: 'Foundation depth min 600mm for residential (SANS 10400-J)',
    check: (data) => data.foundationDepth >= 600, getValue: (data) => data.foundationDepth, required: '≥600mm' },

  // === TSHWANE SCHEME - ADDITIONAL RULES ===

  { id: 'TSH-001', category: 'Tshwane', title: 'Refuse Room', description: 'Refuse storage room required per 10 dwellings (Tshwane Scheme)',
    check: (data) => data.refuseRoom >= 4, getValue: (data) => data.refuseRoom, required: '≥4m²' },
  { id: 'TSH-002', category: 'Tshwane', title: 'Stormwater Disposal', description: 'Stormwater must be disposed to municipal connection (Tshwane Scheme)',
    check: (data) => data.stormwaterConnected === true, getValue: (data) => data.stormwaterConnected ? 'Yes' : 'No', required: 'Required' },
];

// Default data template - all SANS 10400 rule fields
const defaultData = {
  // Coverage & Zoning
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
  secondUnit: 0,
  // Dimensions (SANS 10400-C/E)
  ceilingHeight: 2.4,
  ceilingHeightNonHab: 2.1,
  habitableRoomArea: 8,
  bedroomArea: 7,
  // Stairs (SANS 10400-D)
  stairWidth: 900,
  riserHeight: 180,
  treadDepth: 250,
  // Ventilation (SANS 10400-G)
  windowAreaPct: 10,
  openableAreaPct: 5,
  // Glazing (SANS 10400-N)
  safetyGlassRequired: false,
  // Fire Safety (SANS 10400-B)
  occupancyClass: null,
  fireDetector: false,
  fireExtinguisherCount: 0,
  // Disabled Access (SANS 10400-E)
  disabledParking: 0,
  disabledToilet: false,
  rampGradient: 0,
  // Structural (SANS 10400-J)
  dpcRequired: true,
  foundationDepth: 0,
  // Tshwane Scheme
  refuseRoom: 0,
  stormwaterConnected: false
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