/**
 * Performance Tests
 * Tests for plan-checker.js performance under load
 */

const planChecker = require('../src/plan-checker');

describe('Performance Tests', () => {

  describe('analyzeDocument performance', () => {
    test('handles small text quickly (< 10ms)', () => {
      const start = Date.now();
      planChecker.analyzeDocument('coverage 55%', 'test.pdf', 1);
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(10);
    });

    test('handles medium text under 50ms', () => {
      const text = 'coverage 55% storeys 2 setbackFront 4m parking 3 bays'.repeat(10);
      const start = Date.now();
      planChecker.analyzeDocument(text, 'medium.pdf', 1);
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(50);
    });

    test('handles large text under 200ms', () => {
      const text = 'coverage 55% storeys 2 setbackFront 4m parking 3 bays'.repeat(100);
      const start = Date.now();
      planChecker.analyzeDocument(text, 'large.pdf', 1);
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(200);
    });

    test('handles repeated calls efficiently', () => {
      const start = Date.now();
      for (let i = 0; i < 100; i++) {
        planChecker.analyzeDocument('coverage 55%', `test-${i}.pdf`, 1);
      }
      const duration = Date.now() - start;
      // 100 documents should complete in under 1 second
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('getAllCategories performance', () => {
    test('returns categories quickly (< 5ms)', () => {
      const start = Date.now();
      planChecker.getAllCategories();
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(5);
    });
  });

  describe('getComplianceLevel performance', () => {
    test('returns level quickly (< 1ms)', () => {
      const start = Date.now();
      for (let i = 0; i < 1000; i++) {
        planChecker.getComplianceLevel(i % 100);
      }
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(10);
    });
  });

  describe('Memory usage', () => {
    test('no memory leak on repeated analyzeDocument calls', () => {
      const initialMemory = process.memoryUsage().heapUsed;

      for (let i = 0; i < 1000; i++) {
        planChecker.analyzeDocument('coverage 55%', 'test.pdf', 1);
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const increase = finalMemory - initialMemory;

      // Memory increase should be less than 10MB for 1000 calls
      expect(increase).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('Rule execution', () => {
    test('all 34 rules execute without error', () => {
      const data = {
        coverage: 55,
        impermeable: 50,
        storeys: 2,
        setbackFront: 4,
        setbackSide: 1.5,
        setbackRear: 3,
        parking: 3,
        visitorParking: 1,
        streetLine: 3,
        far: 0.4,
        wallHeight: 1.5,
        secondUnit: 50,
        ceilingHeight: 2.5,
        ceilingHeightNonHab: 2.2,
        habitableRoomArea: 12,
        bedroomArea: 9,
        stairWidth: 1000,
        riserHeight: 160,
        treadDepth: 280,
        windowAreaPct: 15,
        openableAreaPct: 8,
        safetyGlassRequired: true,
        occupancyClass: 'A1',
        fireDetector: true,
        fireExtinguisherCount: 3,
        disabledParking: 2,
        disabledToilet: true,
        rampGradient: 6,
        dpcRequired: true,
        foundationDepth: 800,
        refuseRoom: 6,
        stormwaterConnected: true
      };

      planChecker.nbrRules.forEach(rule => {
        expect(() => rule.check(data)).not.toThrow();
      });
    });
  });

});