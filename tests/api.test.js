/**
 * API Integration Tests for SANS Plan Examiner
 * Tests key endpoints with mocked Supabase
 */

const express = require('express');
const request = require('supertest');

// Mock the modules before requiring server
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
      }))
    })),
    storage: jest.fn(() => ({
      upload: jest.fn(() => Promise.resolve({ error: null }))
    }))
  }))
}));

// We need to create a minimal test setup
describe('Server API Endpoints', () => {
  let app;

  beforeAll(() => {
    // Create a minimal express app for testing
    app = express();
    app.use(express.json());

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Rules endpoint (static)
    const planChecker = require('../src/plan-checker');
    app.get('/api/rules', (req, res) => {
      res.json({
        rules: planChecker.nbrRules,
        categories: planChecker.getAllCategories()
      });
    });

    // Compliance check endpoint
    app.post('/api/check/text', (req, res) => {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }
      const result = planChecker.analyzeDocument(text, 'text-input.pdf', 1);
      const level = planChecker.getComplianceLevel(result.overallScore);
      res.json({
        ...result,
        complianceLevel: level
      });
    });
  });

  describe('GET /health', () => {
    test('returns health status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/rules', () => {
    test('returns all compliance rules', async () => {
      const res = await request(app).get('/api/rules');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('rules');
      expect(res.body.rules).toHaveLength(14);
      expect(res.body).toHaveProperty('categories');
      expect(Array.isArray(res.body.categories)).toBe(true);
    });

    test('each rule has required fields', async () => {
      const res = await request(app).get('/api/rules');
      res.body.rules.forEach(rule => {
        expect(rule).toHaveProperty('id');
        expect(rule).toHaveProperty('category');
        expect(rule).toHaveProperty('title');
        expect(rule).toHaveProperty('description');
        expect(rule).toHaveProperty('required');
      });
    });

    test('coverage rules are present', async () => {
      const res = await request(app).get('/api/rules');
      const coverageRules = res.body.rules.filter(r => r.id.startsWith('CVRG'));
      expect(coverageRules.length).toBe(3);
    });

    test('height rules are present', async () => {
      const res = await request(app).get('/api/rules');
      const heightRules = res.body.rules.filter(r => r.id.startsWith('HEIT'));
      expect(heightRules.length).toBe(2);
    });
  });

  describe('POST /api/check/text', () => {
    test('analyzes coverage text correctly', async () => {
      const res = await request(app)
        .post('/api/check/text')
        .send({ text: 'coverage 55%' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('overallScore');
      expect(res.body).toHaveProperty('passedRules');
      expect(res.body).toHaveProperty('failedRules');
      expect(res.body.passedRules.some(r => r.id === 'CVRG-001')).toBe(true);
    });

    test('fails when coverage exceeds 60%', async () => {
      const res = await request(app)
        .post('/api/check/text')
        .send({ text: 'coverage 65%' });
      expect(res.status).toBe(200);
      const failed = res.body.failedRules.find(r => r.id === 'CVRG-001');
      expect(failed).toBeDefined();
      expect(failed.value).toBe(65);
    });

    test('returns error when text is missing', async () => {
      const res = await request(app)
        .post('/api/check/text')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    test('returns compliance level', async () => {
      const res = await request(app)
        .post('/api/check/text')
        .send({ text: 'coverage 55%' });
      expect(res.body).toHaveProperty('complianceLevel');
      expect(res.body.complianceLevel).toHaveProperty('level');
      expect(res.body.complianceLevel).toHaveProperty('color');
    });

    test('analyzes multi-rule text', async () => {
      const res = await request(app)
        .post('/api/check/text')
        .send({ text: 'coverage 55% storeys 2 setbackFront 4m' });
      expect(res.status).toBe(200);
      // Should pass coverage, height, and front setback
      const passedIds = res.body.passedRules.map(r => r.id);
      expect(passedIds).toContain('CVRG-001');
      expect(passedIds).toContain('HEIT-001');
      expect(passedIds).toContain('SETB-001');
    });

    test('rejects empty text', async () => {
      const res = await request(app)
        .post('/api/check/text')
        .send({ text: '' });
      // Empty string is falsy - server rejects
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('Plan Checker Module', () => {
    const { nbrRules, getAllCategories, analyzeDocument, getComplianceLevel } = require('../src/plan-checker');

    test('all 14 rules have unique IDs', () => {
      const ids = nbrRules.map(r => r.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    test('categories are correctly grouped', () => {
      const categories = getAllCategories();
      const categoryNames = categories.map(c => c.name);
      expect(categoryNames).toContain('Coverage');
      expect(categoryNames).toContain('Height');
      expect(categoryNames).toContain('Setbacks');
      expect(categoryNames).toContain('Parking');
    });

    test('analyzeDocument returns correct structure', () => {
      const result = analyzeDocument('test', 'test.pdf', 1);
      expect(result).toEqual(expect.objectContaining({
        documentName: 'test.pdf',
        pageCount: 1,
        totalRules: 14,
        passedRules: expect.any(Array),
        failedRules: expect.any(Array),
        missingInfo: expect.any(Array),
        overallScore: expect.any(Number),
        analyzedAt: expect.any(String)
      }));
    });

    test('getComplianceLevel returns correct levels', () => {
      expect(getComplianceLevel(100).level).toBe('PASS');
      expect(getComplianceLevel(90).level).toBe('PASS');
      expect(getComplianceLevel(85).level).toBe('CONDITIONS');
      expect(getComplianceLevel(70).level).toBe('CONDITIONS');
      expect(getComplianceLevel(55).level).toBe('REVIEW');
      expect(getComplianceLevel(49).level).toBe('REJECT');
    });
  });

});