/**
 * Accessibility Tests
 * Tests for SANS 10400-E (Access for Physically Disabled) rules
 */

const planChecker = require('../src/plan-checker');

describe('Accessibility Tests (SANS 10400-E)', () => {

  describe('Disabled Parking (DIS-001)', () => {
    test('DIS-001: passes when disabledParking >= 1', () => {
      const rule = planChecker.nbrRules.find(r => r.id === 'DIS-001');
      expect(rule.check({ disabledParking: 1 })).toBe(true);
      expect(rule.check({ disabledParking: 2 })).toBe(true);
    });

    test('DIS-001: fails when disabledParking < 1', () => {
      const rule = planChecker.nbrRules.find(r => r.id === 'DIS-001');
      expect(rule.check({ disabledParking: 0 })).toBe(false);
    });

    test('DIS-001: rule has correct required value', () => {
      const rule = planChecker.nbrRules.find(r => r.id === 'DIS-001');
      expect(rule.required).toBe('≥1');
    });
  });

  describe('Disabled Toilet (DIS-002)', () => {
    test('DIS-002: passes when disabledToilet is true', () => {
      const rule = planChecker.nbrRules.find(r => r.id === 'DIS-002');
      expect(rule.check({ disabledToilet: true })).toBe(true);
    });

    test('DIS-002: fails when disabledToilet is false', () => {
      const rule = planChecker.nbrRules.find(r => r.id === 'DIS-002');
      expect(rule.check({ disabledToilet: false })).toBe(false);
    });

    test('DIS-002: rule references SANS 10400-E', () => {
      const rule = planChecker.nbrRules.find(r => r.id === 'DIS-002');
      expect(rule.description).toContain('SANS 10400-E');
    });
  });

  describe('Ramp Gradient (DIS-003)', () => {
    test('DIS-003: passes at max gradient 1:12 (8.33%)', () => {
      const rule = planChecker.nbrRules.find(r => r.id === 'DIS-003');
      expect(rule.check({ rampGradient: 8.33 })).toBe(true);
      expect(rule.check({ rampGradient: 5 })).toBe(true);
    });

    test('DIS-003: fails when gradient exceeds 1:12', () => {
      const rule = planChecker.nbrRules.find(r => r.id === 'DIS-003');
      expect(rule.check({ rampGradient: 9 })).toBe(false);
      expect(rule.check({ rampGradient: 8.5 })).toBe(false);
    });

    test('DIS-003: rule has correct required value', () => {
      const rule = planChecker.nbrRules.find(r => r.id === 'DIS-003');
      expect(rule.required).toBe('≤8.33%');
    });
  });

  describe('Disabled Access Category', () => {
    test('category includes all 3 disabled access rules', () => {
      const categories = planChecker.getAllCategories();
      const disabledCat = categories.find(c => c.name === 'Disabled Access');
      expect(disabledCat).toBeDefined();
      expect(disabledCat.rules.length).toBe(3);
    });

    test('all disabled access rules have SANS 10400-E reference', () => {
      const disabledRules = planChecker.nbrRules.filter(r => r.category === 'Disabled Access');
      disabledRules.forEach(rule => {
        expect(rule.description).toContain('SANS 10400-E');
      });
    });
  });

  describe('Integration with other rules', () => {
    test('analyzeDocument correctly evaluates disabled access', () => {
      const text = 'disabled parking 2, disabled toilet yes, ramp gradient 6%';
      const result = planChecker.analyzeDocument(text, 'accessible.pdf', 1);

      const disRules = result.passedRules.filter(r => r.id.startsWith('DIS'));
      expect(disRules.length).toBeGreaterThan(0);
    });

    test('non-compliance is flagged in failedRules', () => {
      const text = 'disabled parking 0, disabled toilet no';
      const result = planChecker.analyzeDocument(text, 'non-compliant.pdf', 1);

      const failedDIS = result.failedRules.filter(r => r.id.startsWith('DIS'));
      expect(failedDIS.length).toBe(2);
    });
  });

  describe('Compliance levels for accessibility', () => {
    test('all disabled access rules pass gives high score', () => {
      const data = {
        disabledParking: 2,
        disabledToilet: true,
        rampGradient: 6
      };

      const disRules = planChecker.nbrRules.filter(r => r.category === 'Disabled Access');
      const passedCount = disRules.filter(r => r.check(data) === true).length;

      expect(passedCount).toBe(3);
    });

    test('some disabled access rules fail gives lower score', () => {
      const data = {
        disabledParking: 0,
        disabledToilet: false,
        rampGradient: 6
      };

      const disRules = planChecker.nbrRules.filter(r => r.category === 'Disabled Access');
      const passedCount = disRules.filter(r => r.check(data) === true).length;

      expect(passedCount).toBe(1);
    });
  });

});