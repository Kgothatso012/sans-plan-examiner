/**
 * Regression Tests - Verify All Features Still Work
 * Run this before and after refactoring to catch regressions
 */

const planChecker = require('../src/plan-checker');

describe('Regression Tests', () => {
  describe('Core plan-checker functionality', () => {
    test('nbrRules is an array with 34 rules', () => {
      expect(Array.isArray(planChecker.nbrRules)).toBe(true);
      expect(planChecker.nbrRules.length).toBe(34);
    });

    test('getAllCategories returns array', () => {
      const cats = planChecker.getAllCategories();
      expect(Array.isArray(cats)).toBe(true);
      expect(cats.length).toBeGreaterThan(0);
    });

    test('analyzeDocument returns valid structure', () => {
      const result = planChecker.analyzeDocument('coverage 55%', 'test.pdf', 1);
      expect(result).toHaveProperty('documentName', 'test.pdf');
      expect(result).toHaveProperty('overallScore');
      expect(result).toHaveProperty('passedRules');
      expect(result).toHaveProperty('failedRules');
    });

    test('getComplianceLevel returns valid levels', () => {
      expect(planChecker.getComplianceLevel(100).level).toBe('PASS');
      expect(planChecker.getComplianceLevel(90).level).toBe('PASS');
      expect(planChecker.getComplianceLevel(70).level).toBe('CONDITIONS');
      expect(planChecker.getComplianceLevel(50).level).toBe('REVIEW');
      expect(planChecker.getComplianceLevel(49).level).toBe('REJECT');
    });
  });

  describe('Coverage rules', () => {
    test('CVRG-001 passes at 60%', () => {
      const rule = planChecker.nbrRules.find(r => r.id === 'CVRG-001');
      expect(rule.check({ coverage: 60 })).toBe(true);
    });

    test('CVRG-001 fails at 61%', () => {
      const rule = planChecker.nbrRules.find(r => r.id === 'CVRG-001');
      expect(rule.check({ coverage: 61 })).toBe(false);
    });

    test('CVRG-002 passes at 50%', () => {
      const rule = planChecker.nbrRules.find(r => r.id === 'CVRG-002');
      expect(rule.check({ coverage: 50 })).toBe(true);
    });

    test('CVRG-003 passes at 70%', () => {
      const rule = planChecker.nbrRules.find(r => r.id === 'CVRG-003');
      expect(rule.check({ impermeable: 70 })).toBe(true);
    });
  });

  describe('Height rules', () => {
    test('HEIT-001 passes at 3 storeys', () => {
      const rule = planChecker.nbrRules.find(r => r.id === 'HEIT-001');
      expect(rule.check({ storeys: 3 })).toBe(true);
    });

    test('HEIT-001 fails at 4 storeys', () => {
      const rule = planChecker.nbrRules.find(r => r.id === 'HEIT-001');
      expect(rule.check({ storeys: 4 })).toBe(false);
    });

    test('HEIT-002 passes at 2 storeys', () => {
      const rule = planChecker.nbrRules.find(r => r.id === 'HEIT-002');
      expect(rule.check({ storeys: 2 })).toBe(true);
    });
  });

  describe('Setback rules', () => {
    test('SETB-001 passes at 3m', () => {
      const rule = planChecker.nbrRules.find(r => r.id === 'SETB-001');
      expect(rule.check({ setbackFront: 3 })).toBe(true);
    });

    test('SETB-001 fails at 2.9m', () => {
      const rule = planChecker.nbrRules.find(r => r.id === 'SETB-001');
      expect(rule.check({ setbackFront: 2.9 })).toBe(false);
    });

    test('SETB-002 passes at 1m', () => {
      const rule = planChecker.nbrRules.find(r => r.id === 'SETB-002');
      expect(rule.check({ setbackSide: 1 })).toBe(true);
    });

    test('SETB-003 passes at 3m', () => {
      const rule = planChecker.nbrRules.find(r => r.id === 'SETB-003');
      expect(rule.check({ setbackRear: 3 })).toBe(true);
    });
  });

  describe('Parking rules', () => {
    test('PRKG-001 passes at 2 bays', () => {
      const rule = planChecker.nbrRules.find(r => r.id === 'PRKG-001');
      expect(rule.check({ parking: 2 })).toBe(true);
    });

    test('PRKG-001 fails at 1 bay', () => {
      const rule = planChecker.nbrRules.find(r => r.id === 'PRKG-001');
      expect(rule.check({ parking: 1 })).toBe(false);
    });
  });

  describe('Dimension rules', () => {
    test('CEIL-001 passes at 2.4m', () => {
      const rule = planChecker.nbrRules.find(r => r.id === 'CEIL-001');
      expect(rule.check({ ceilingHeight: 2.4 })).toBe(true);
    });

    test('ROOM-001 passes at 8m²', () => {
      const rule = planChecker.nbrRules.find(r => r.id === 'ROOM-001');
      expect(rule.check({ habitableRoomArea: 8 })).toBe(true);
    });
  });

  describe('Stair rules', () => {
    test('STIR-001 passes at 900mm', () => {
      const rule = planChecker.nbrRules.find(r => r.id === 'STIR-001');
      expect(rule.check({ stairWidth: 900 })).toBe(true);
    });

    test('STIR-002 passes at 180mm', () => {
      const rule = planChecker.nbrRules.find(r => r.id === 'STIR-002');
      expect(rule.check({ riserHeight: 180 })).toBe(true);
    });

    test('STIR-003 passes at 250mm', () => {
      const rule = planChecker.nbrRules.find(r => r.id === 'STIR-003');
      expect(rule.check({ treadDepth: 250 })).toBe(true);
    });
  });

  describe('Fire safety rules', () => {
    test('FIRE-001 passes when occupancy class is set', () => {
      const rule = planChecker.nbrRules.find(r => r.id === 'FIRE-001');
      expect(rule.check({ occupancyClass: 'A1' })).toBe(true);
    });

    test('FIRE-002 passes when detector is true', () => {
      const rule = planChecker.nbrRules.find(r => r.id === 'FIRE-002');
      expect(rule.check({ fireDetector: true })).toBe(true);
    });

    test('FIRE-003 passes when extinguisher count >= 1', () => {
      const rule = planChecker.nbrRules.find(r => r.id === 'FIRE-003');
      expect(rule.check({ fireExtinguisherCount: 1 })).toBe(true);
    });
  });

  describe('End-to-end analyzeDocument', () => {
    test('returns realistic overall score', () => {
      const result = planChecker.analyzeDocument('', 'empty.pdf', 1);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
    });

    test('coverage violation is detected', () => {
      const result = planChecker.analyzeDocument('coverage 65%', 'test.pdf', 1);
      const failed = result.failedRules.find(r => r.id === 'CVRG-001');
      expect(failed).toBeDefined();
    });

    test('passes are recorded correctly', () => {
      const result = planChecker.analyzeDocument('coverage 55%', 'test.pdf', 1);
      const passed = result.passedRules.find(r => r.id === 'CVRG-001');
      expect(passed).toBeDefined();
    });
  });

  describe('Stress test', () => {
    test('analyzeDocument handles very long text', () => {
      const longText = 'coverage 55% '.repeat(1000);
      const result = planChecker.analyzeDocument(longText, 'stress.pdf', 1);
      expect(result).toHaveProperty('overallScore');
    });

    test('analyzeDocument handles special characters', () => {
      const text = 'coverage 55% <script>alert("xss")</script>';
      const result = planChecker.analyzeDocument(text, 'special.pdf', 1);
      expect(result).toHaveProperty('overallScore');
    });

    test('analyzeDocument handles unicode', () => {
      const text = 'coverage 55% © Tshiȝwȧne Municipality';
      const result = planChecker.analyzeDocument(text, 'unicode.pdf', 1);
      expect(result).toHaveProperty('overallScore');
    });
  });
});