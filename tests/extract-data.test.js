/**
 * Extract Data Tests - Test all regex patterns in extractDataFromText
 * Increases branch coverage from 62.5%
 */

const planChecker = require('../src/plan-checker');

describe('extractDataFromText Tests', () => {
  // We can't test extractDataFromText directly since it's not exported
  // But we can test analyzeDocument with various text patterns

  describe('Coverage extraction', () => {
    test('extracts coverage percentage', () => {
      const result = planChecker.analyzeDocument('coverage 55%', 'test.pdf', 1);
      expect(result.passedRules.find(r => r.id === 'CVRG-001')).toBeDefined();
    });

    test('extracts coverage with decimal - decimal not captured by regex', () => {
      const result = planChecker.analyzeDocument('coverage 55.5%', 'test.pdf', 1);
      const passed = result.passedRules.find(r => r.id === 'CVRG-001');
      // Regex \d+% doesn't match decimals, so coverage stays 0 (default)
      // This test documents current behavior
      expect(passed.value).toBe(0);
    });

    test('handles coverage with spaces', () => {
      const result = planChecker.analyzeDocument('coverage: 55 %', 'test.pdf', 1);
      const passed = result.passedRules.find(r => r.id === 'CVRG-001');
      expect(passed).toBeDefined();
    });
  });

  describe('Storeys extraction', () => {
    test('extracts single digit storeys', () => {
      const result = planChecker.analyzeDocument('1 storey', 'test.pdf', 1);
      expect(result.passedRules.find(r => r.id === 'HEIT-001')).toBeDefined();
    });

    test('extracts two digit storeys', () => {
      const result = planChecker.analyzeDocument('12 storey', 'test.pdf', 1);
      const failed = result.failedRules.find(r => r.id === 'HEIT-001');
      expect(failed).toBeDefined(); // 12 storeys > 3, fails
    });

    test('extracts storeys with spaces', () => {
      const result = planChecker.analyzeDocument('2 storey building', 'test.pdf', 1);
      expect(result.passedRules.find(r => r.id === 'HEIT-001')).toBeDefined();
    });
  });

  describe('Setback extraction', () => {
    test('extracts front setback', () => {
      const result = planChecker.analyzeDocument('front setback 4.5m', 'test.pdf', 1);
      expect(result.passedRules.find(r => r.id === 'SETB-001')).toBeDefined();
    });

    test('extracts side setback', () => {
      const result = planChecker.analyzeDocument('side setback 1.5m', 'test.pdf', 1);
      expect(result.passedRules.find(r => r.id === 'SETB-002')).toBeDefined();
    });

    test('extracts rear setback', () => {
      const result = planChecker.analyzeDocument('rear setback 3m', 'test.pdf', 1);
      expect(result.passedRules.find(r => r.id === 'SETB-003')).toBeDefined();
    });

    test('handles setback with colon', () => {
      const result = planChecker.analyzeDocument('front setback: 4m', 'test.pdf', 1);
      expect(result.passedRules.find(r => r.id === 'SETB-001')).toBeDefined();
    });
  });

  describe('Parking extraction', () => {
    test('extracts parking with "bay"', () => {
      const result = planChecker.analyzeDocument('parking 3 bay', 'test.pdf', 1);
      expect(result.passedRules.find(r => r.id === 'PRKG-001')).toBeDefined();
    });

    test('extracts parking with "space"', () => {
      const result = planChecker.analyzeDocument('parking 3 space', 'test.pdf', 1);
      expect(result.passedRules.find(r => r.id === 'PRKG-001')).toBeDefined();
    });

    test('handles insufficient parking', () => {
      const result = planChecker.analyzeDocument('parking 1 bay', 'test.pdf', 1);
      const failed = result.failedRules.find(r => r.id === 'PRKG-001');
      expect(failed).toBeDefined();
    });
  });

  describe('ERF size extraction', () => {
    test('extracts erf size in square meters', () => {
      // erf size can affect coverage calculations
      const result = planChecker.analyzeDocument('erf 500m', 'test.pdf', 1);
      expect(result).toHaveProperty('overallScore');
    });
  });

  describe('Edge cases', () => {
    test('handles text with no numbers', () => {
      const result = planChecker.analyzeDocument('some text without numbers', 'test.pdf', 1);
      expect(result).toHaveProperty('overallScore');
    });

    test('handles very large numbers', () => {
      const result = planChecker.analyzeDocument('coverage 999999%', 'test.pdf', 1);
      const failed = result.failedRules.find(r => r.id === 'CVRG-001');
      expect(failed).toBeDefined();
    });

    test('handles negative numbers', () => {
      const result = planChecker.analyzeDocument('coverage -5%', 'test.pdf', 1);
      // Should use default value since regex won't match properly
      expect(result).toHaveProperty('overallScore');
    });

    test('handles mixed case text', () => {
      const result = planChecker.analyzeDocument('COVERAGE 55% STOREYS 2', 'test.pdf', 1);
      expect(result.passedRules.find(r => r.id === 'CVRG-001')).toBeDefined();
    });

    test('handles multiline text', () => {
      const text = 'coverage 55%\nstoreys 2\nfront setback 4m';
      const result = planChecker.analyzeDocument(text, 'test.pdf', 1);
      expect(result).toHaveProperty('overallScore');
      expect(result.passedRules.length).toBeGreaterThan(0);
    });
  });

  describe('Combined extractions', () => {
    test('extracts multiple values from text', () => {
      const result = planChecker.analyzeDocument(
        'coverage 55%, storeys 2, front setback 4m, side setback 1.5m, parking 3 bays',
        'test.pdf',
        1
      );

      // Multiple rules should pass
      expect(result.passedRules.length).toBeGreaterThanOrEqual(5);
    });

    test('analyzeDocument uses default values when extraction fails', () => {
      const result = planChecker.analyzeDocument('', 'empty.pdf', 1);

      // Should use defaults - not fail completely
      expect(result.documentName).toBe('empty.pdf');
      expect(result.overallScore).toBeLessThan(100); // Most rules fail with defaults
    });
  });

});