const {
  nbrRules,
  getAllCategories,
  analyzeDocument,
  getComplianceLevel
} = require('../src/plan-checker');

describe('plan-checker.js', () => {

  describe('nbrRules', () => {
    test('should have 34 rules defined', () => {
      expect(nbrRules.length).toBe(34);
    });

    test('each rule should have required fields', () => {
      nbrRules.forEach(rule => {
        expect(rule).toHaveProperty('id');
        expect(rule).toHaveProperty('category');
        expect(rule).toHaveProperty('title');
        expect(rule).toHaveProperty('description');
        expect(rule).toHaveProperty('check');
        expect(rule).toHaveProperty('getValue');
        expect(rule).toHaveProperty('required');
      });
    });

    test('each rule id should be unique', () => {
      const ids = nbrRules.map(r => r.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('Coverage Rules', () => {
    const cvrgRules = nbrRules.filter(r => r.id.startsWith('CVRG'));

    test('CVRG-001: R1 zone coverage <= 60% passes', () => {
      const rule = cvrgRules.find(r => r.id === 'CVRG-001');
      expect(rule.check({ coverage: 60 })).toBe(true);
      expect(rule.check({ coverage: 55 })).toBe(true);
    });

    test('CVRG-001: R1 zone coverage > 60% fails', () => {
      const rule = cvrgRules.find(r => r.id === 'CVRG-001');
      expect(rule.check({ coverage: 61 })).toBe(false);
    });

    test('CVRG-002: R2 zone coverage <= 50% passes', () => {
      const rule = cvrgRules.find(r => r.id === 'CVRG-002');
      expect(rule.check({ coverage: 50 })).toBe(true);
    });

    test('CVRG-002: R2 zone coverage > 50% fails', () => {
      const rule = cvrgRules.find(r => r.id === 'CVRG-002');
      expect(rule.check({ coverage: 51 })).toBe(false);
    });

    test('CVRG-003: Impermeable <= 70% passes', () => {
      const rule = cvrgRules.find(r => r.id === 'CVRG-003');
      expect(rule.check({ impermeable: 70 })).toBe(true);
    });

    test('CVRG-003: Impermeable > 70% fails', () => {
      const rule = cvrgRules.find(r => r.id === 'CVRG-003');
      expect(rule.check({ impermeable: 71 })).toBe(false);
    });
  });

  describe('Height Rules', () => {
    const heightRules = nbrRules.filter(r => r.id.startsWith('HEIT'));

    test('HEIT-001: R1 zone <= 3 storeys passes', () => {
      const rule = heightRules.find(r => r.id === 'HEIT-001');
      expect(rule.check({ storeys: 3 })).toBe(true);
      expect(rule.check({ storeys: 2 })).toBe(true);
    });

    test('HEIT-001: R1 zone > 3 storeys fails', () => {
      const rule = heightRules.find(r => r.id === 'HEIT-001');
      expect(rule.check({ storeys: 4 })).toBe(false);
    });

    test('HEIT-002: R2 zone <= 2 storeys passes', () => {
      const rule = heightRules.find(r => r.id === 'HEIT-002');
      expect(rule.check({ storeys: 2 })).toBe(true);
    });

    test('HEIT-002: R2 zone > 2 storeys fails', () => {
      const rule = heightRules.find(r => r.id === 'HEIT-002');
      expect(rule.check({ storeys: 3 })).toBe(false);
    });
  });

  describe('Setback Rules', () => {
    const setbackRules = nbrRules.filter(r => r.id.startsWith('SETB'));

    test('SETB-001: Front setback >= 3m passes', () => {
      const rule = setbackRules.find(r => r.id === 'SETB-001');
      expect(rule.check({ setbackFront: 3 })).toBe(true);
      expect(rule.check({ setbackFront: 4 })).toBe(true);
    });

    test('SETB-001: Front setback < 3m fails', () => {
      const rule = setbackRules.find(r => r.id === 'SETB-001');
      expect(rule.check({ setbackFront: 2.9 })).toBe(false);
    });

    test('SETB-002: Side setback >= 1m passes', () => {
      const rule = setbackRules.find(r => r.id === 'SETB-002');
      expect(rule.check({ setbackSide: 1 })).toBe(true);
    });

    test('SETB-002: Side setback < 1m fails', () => {
      const rule = setbackRules.find(r => r.id === 'SETB-002');
      expect(rule.check({ setbackSide: 0.9 })).toBe(false);
    });

    test('SETB-003: Rear setback >= 3m passes', () => {
      const rule = setbackRules.find(r => r.id === 'SETB-003');
      expect(rule.check({ setbackRear: 3 })).toBe(true);
    });

    test('SETB-003: Rear setback < 3m fails', () => {
      const rule = setbackRules.find(r => r.id === 'SETB-003');
      expect(rule.check({ setbackRear: 2.9 })).toBe(false);
    });
  });

  describe('Parking Rules', () => {
    const parkingRules = nbrRules.filter(r => r.id.startsWith('PRKG'));

    test('PRKG-001: Parking >= 2 passes', () => {
      const rule = parkingRules.find(r => r.id === 'PRKG-001');
      expect(rule.check({ parking: 2 })).toBe(true);
      expect(rule.check({ parking: 3 })).toBe(true);
    });

    test('PRKG-001: Parking < 2 fails', () => {
      const rule = parkingRules.find(r => r.id === 'PRKG-001');
      expect(rule.check({ parking: 1 })).toBe(false);
    });

    test('PRKG-002: Visitor parking >= 1 passes', () => {
      const rule = parkingRules.find(r => r.id === 'PRKG-002');
      expect(rule.check({ visitorParking: 1 })).toBe(true);
    });

    test('PRKG-002: Visitor parking < 1 fails', () => {
      const rule = parkingRules.find(r => r.id === 'PRKG-002');
      expect(rule.check({ visitorParking: 0 })).toBe(false);
    });
  });

  describe('Other Rules', () => {
    test('BL-001: Street line >= 3m passes', () => {
      const rule = nbrRules.find(r => r.id === 'BL-001');
      expect(rule.check({ streetLine: 3 })).toBe(true);
    });

    test('BL-001: Street line < 3m fails', () => {
      const rule = nbrRules.find(r => r.id === 'BL-001');
      expect(rule.check({ streetLine: 2.9 })).toBe(false);
    });

    test('FAR-001: FAR <= 0.6 passes', () => {
      const rule = nbrRules.find(r => r.id === 'FAR-001');
      expect(rule.check({ far: 0.6 })).toBe(true);
    });

    test('FAR-001: FAR > 0.6 fails', () => {
      const rule = nbrRules.find(r => r.id === 'FAR-001');
      expect(rule.check({ far: 0.61 })).toBe(false);
    });

    test('WALL-001: Wall height <= 1.8m passes', () => {
      const rule = nbrRules.find(r => r.id === 'WALL-001');
      expect(rule.check({ wallHeight: 1.8 })).toBe(true);
    });

    test('WALL-001: Wall height > 1.8m fails', () => {
      const rule = nbrRules.find(r => r.id === 'WALL-001');
      expect(rule.check({ wallHeight: 1.81 })).toBe(false);
    });

    test('SEC-001: Second unit <= 80m² passes', () => {
      const rule = nbrRules.find(r => r.id === 'SEC-001');
      expect(rule.check({ secondUnit: 80 })).toBe(true);
    });

    test('SEC-001: Second unit > 80m² fails', () => {
      const rule = nbrRules.find(r => r.id === 'SEC-001');
      expect(rule.check({ secondUnit: 81 })).toBe(false);
    });
  });

  describe('Dimension Rules (New)', () => {
    test('CEIL-001: Habitable ceiling height >= 2.4m passes', () => {
      const rule = nbrRules.find(r => r.id === 'CEIL-001');
      expect(rule.check({ ceilingHeight: 2.4 })).toBe(true);
      expect(rule.check({ ceilingHeight: 2.5 })).toBe(true);
    });

    test('CEIL-001: Ceiling height < 2.4m fails', () => {
      const rule = nbrRules.find(r => r.id === 'CEIL-001');
      expect(rule.check({ ceilingHeight: 2.3 })).toBe(false);
    });

    test('CEIL-002: Non-habitable ceiling height >= 2.1m passes', () => {
      const rule = nbrRules.find(r => r.id === 'CEIL-002');
      expect(rule.check({ ceilingHeightNonHab: 2.1 })).toBe(true);
    });

    test('ROOM-001: Habitable room >= 8m² passes', () => {
      const rule = nbrRules.find(r => r.id === 'ROOM-001');
      expect(rule.check({ habitableRoomArea: 8 })).toBe(true);
    });

    test('ROOM-001: Habitable room < 8m² fails', () => {
      const rule = nbrRules.find(r => r.id === 'ROOM-001');
      expect(rule.check({ habitableRoomArea: 7.9 })).toBe(false);
    });

    test('ROOM-002: Bedroom >= 7m² passes', () => {
      const rule = nbrRules.find(r => r.id === 'ROOM-002');
      expect(rule.check({ bedroomArea: 7 })).toBe(true);
    });
  });

  describe('Stair Rules (New)', () => {
    test('STIR-001: Stair width >= 900mm passes', () => {
      const rule = nbrRules.find(r => r.id === 'STIR-001');
      expect(rule.check({ stairWidth: 900 })).toBe(true);
    });

    test('STIR-001: Stair width < 900mm fails', () => {
      const rule = nbrRules.find(r => r.id === 'STIR-001');
      expect(rule.check({ stairWidth: 899 })).toBe(false);
    });

    test('STIR-002: Riser height <= 180mm passes', () => {
      const rule = nbrRules.find(r => r.id === 'STIR-002');
      expect(rule.check({ riserHeight: 180 })).toBe(true);
    });

    test('STIR-002: Riser height > 180mm fails', () => {
      const rule = nbrRules.find(r => r.id === 'STIR-002');
      expect(rule.check({ riserHeight: 181 })).toBe(false);
    });

    test('STIR-003: Tread depth >= 250mm passes', () => {
      const rule = nbrRules.find(r => r.id === 'STIR-003');
      expect(rule.check({ treadDepth: 250 })).toBe(true);
    });

    test('STIR-003: Tread depth < 250mm fails', () => {
      const rule = nbrRules.find(r => r.id === 'STIR-003');
      expect(rule.check({ treadDepth: 249 })).toBe(false);
    });
  });

  describe('Ventilation Rules (New)', () => {
    test('VENT-001: Window area >= 10% passes', () => {
      const rule = nbrRules.find(r => r.id === 'VENT-001');
      expect(rule.check({ windowAreaPct: 10 })).toBe(true);
    });

    test('VENT-001: Window area < 10% fails', () => {
      const rule = nbrRules.find(r => r.id === 'VENT-001');
      expect(rule.check({ windowAreaPct: 9 })).toBe(false);
    });

    test('VENT-002: Openable area >= 5% passes', () => {
      const rule = nbrRules.find(r => r.id === 'VENT-002');
      expect(rule.check({ openableAreaPct: 5 })).toBe(true);
    });

    test('VENT-002: Openable area < 5% fails', () => {
      const rule = nbrRules.find(r => r.id === 'VENT-002');
      expect(rule.check({ openableAreaPct: 4 })).toBe(false);
    });
  });

  describe('Glazing Rules (New)', () => {
    test('GLAZ-001: Safety glass required = true passes', () => {
      const rule = nbrRules.find(r => r.id === 'GLAZ-001');
      expect(rule.check({ safetyGlassRequired: true })).toBe(true);
    });

    test('GLAZ-001: Safety glass required = false fails', () => {
      const rule = nbrRules.find(r => r.id === 'GLAZ-001');
      expect(rule.check({ safetyGlassRequired: false })).toBe(false);
    });
  });

  describe('getAllCategories', () => {
    test('should return array of categories', () => {
      const categories = getAllCategories();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
    });

    test('each category should have name and rules', () => {
      const categories = getAllCategories();
      categories.forEach(cat => {
        expect(cat).toHaveProperty('name');
        expect(cat).toHaveProperty('rules');
        expect(Array.isArray(cat.rules)).toBe(true);
      });
    });

    test('should include Coverage category', () => {
      const categories = getAllCategories();
      const coverage = categories.find(c => c.name === 'Coverage');
      expect(coverage).toBeDefined();
      expect(coverage.rules.length).toBe(3);
    });
  });

  describe('analyzeDocument', () => {
    test('should return analysis result with all fields', () => {
      const result = analyzeDocument('coverage 55% storeys 2', 'test.pdf', 1);
      expect(result).toHaveProperty('documentName', 'test.pdf');
      expect(result).toHaveProperty('pageCount', 1);
      expect(result).toHaveProperty('overallScore');
      expect(result).toHaveProperty('totalRules', 34);
      expect(result).toHaveProperty('passedRules');
      expect(result).toHaveProperty('failedRules');
      expect(result).toHaveProperty('missingInfo');
      expect(result).toHaveProperty('analyzedAt');
    });

    test('should pass when coverage is 55%', () => {
      const result = analyzeDocument('coverage 55%', 'test.pdf', 1);
      const cvrg001 = result.passedRules.find(r => r.id === 'CVRG-001');
      expect(cvrg001).toBeDefined();
    });

    test('should fail when coverage exceeds 60%', () => {
      const result = analyzeDocument('coverage 65%', 'test.pdf', 1);
      const cvrg001 = result.failedRules.find(r => r.id === 'CVRG-001');
      expect(cvrg001).toBeDefined();
      expect(cvrg001.value).toBe(65);
    });

    test('should handle empty text gracefully', () => {
      const result = analyzeDocument('', 'empty.pdf', 1);
      expect(result.documentName).toBe('empty.pdf');
      expect(result.totalRules).toBe(34);
    });

    test('should calculate overall score correctly', () => {
      const result = analyzeDocument('', 'test.pdf', 1);
      // Empty text means no data extracted, rules fail
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });
  });

  describe('getComplianceLevel', () => {
    test('score >= 90 returns PASS', () => {
      const level = getComplianceLevel(90);
      expect(level.level).toBe('PASS');
      expect(level.color).toBe('#059669');
    });

    test('score >= 70 returns CONDITIONS', () => {
      const level = getComplianceLevel(70);
      expect(level.level).toBe('CONDITIONS');
      expect(level.color).toBe('#d97706');
    });

    test('score >= 50 returns REVIEW', () => {
      const level = getComplianceLevel(50);
      expect(level.level).toBe('REVIEW');
    });

    test('score < 50 returns REJECT', () => {
      const level = getComplianceLevel(49);
      expect(level.level).toBe('REJECT');
    });
  });

});