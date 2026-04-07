/**
 * Integration Tests for Application Flow
 * Tests the complete application submission and review flow
 */

const express = require('express');
const request = require('supertest');

// Mock plan-checker for integration testing
const planChecker = require('../src/plan-checker');

describe('Application Flow Integration Tests', () => {

  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    // Mock application store (in-memory for testing)
    const applications = new Map();
    let appIdCounter = 1;

    // Application submission endpoint
    app.post('/api/applications/submit', (req, res) => {
      const { erfNumber, address, ownerName, ownerEmail, ownerPhone } = req.body;

      if (!erfNumber || !address || !ownerName || !ownerEmail) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const id = appIdCounter++;
      const application = {
        id,
        erfNumber,
        address,
        ownerName,
        ownerEmail,
        ownerPhone: ownerPhone || '',
        status: 'pending',
        reference: `TC${Math.floor(Math.random() * 900000) + 100000}`,
        createdAt: new Date().toISOString(),
        comments: []
      };

      applications.set(id, application);

      res.status(201).json({
        success: true,
        applicationId: id,
        reference: application.reference
      });
    });

    // Get application by ID or reference
    app.get('/api/applications/:identifier', (req, res) => {
      const identifier = req.params.identifier;
      // Try to parse as number first (ID), otherwise search by reference
      const id = parseInt(identifier);
      let app = null;

      if (!isNaN(id) && id > 0) {
        app = applications.get(id);
      } else {
        app = Array.from(applications.values()).find(a => a.reference === identifier);
      }

      if (!app) {
        return res.status(404).json({ error: 'Application not found' });
      }

      res.json(app);
    });

    // Update application status
    app.put('/api/applications/:id/status', (req, res) => {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const app = applications.get(id);

      if (!app) {
        return res.status(404).json({ error: 'Application not found' });
      }

      const validStatuses = ['pending', 'in_review', 'approved', 'rejected', 'revision'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      app.status = status;
      res.json({ success: true, application: app });
    });

    // Add comment to application
    app.post('/api/applications/:id/comments', (req, res) => {
      const id = parseInt(req.params.id);
      const { text, author } = req.body;
      const app = applications.get(id);

      if (!app) {
        return res.status(404).json({ error: 'Application not found' });
      }

      if (!text) {
        return res.status(400).json({ error: 'Comment text is required' });
      }

      const comment = {
        id: app.comments.length + 1,
        text,
        author: author || 'Examiner',
        createdAt: new Date().toISOString()
      };

      app.comments.push(comment);
      res.status(201).json({ success: true, comment });
    });

    // Analyze application
    app.post('/api/applications/:id/analyze', (req, res) => {
      const id = parseInt(req.params.id);
      const app = applications.get(id);

      if (!app) {
        return res.status(404).json({ error: 'Application not found' });
      }

      // Use plan-checker to analyze
      const { text } = req.body;
      const analysis = planChecker.analyzeDocument(
        text || `ERF ${app.erfNumber}, coverage 55%, storeys 2`,
        `application-${id}.pdf`,
        1
      );

      const level = planChecker.getComplianceLevel(analysis.overallScore);

      res.json({
        success: true,
        analysis,
        complianceLevel: level
      });
    });
  });

  describe('Application Submission', () => {
    test('submit application with all required fields succeeds', async () => {
      const res = await request(app)
        .post('/api/applications/submit')
        .send({
          erfNumber: 'TC123456',
          address: '123 Main Street, Pretoria',
          ownerName: 'John Doe',
          ownerEmail: 'john@example.com',
          ownerPhone: '0123456789'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('applicationId');
      expect(res.body).toHaveProperty('reference');
      expect(res.body.reference).toMatch(/^TC\d{6}$/);
    });

    test('submit application without required fields fails', async () => {
      const res = await request(app)
        .post('/api/applications/submit')
        .send({
          erfNumber: 'TC123456'
          // Missing address, ownerName, ownerEmail
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    test('submit application without email fails', async () => {
      const res = await request(app)
        .post('/api/applications/submit')
        .send({
          erfNumber: 'TC123456',
          address: '123 Main Street',
          ownerName: 'John Doe'
          // Missing ownerEmail
        });

      expect(res.status).toBe(400);
    });

    test('submit application generates unique reference', async () => {
      const res1 = await request(app)
        .post('/api/applications/submit')
        .send({
          erfNumber: 'TC111111',
          address: 'Address 1',
          ownerName: 'Owner 1',
          ownerEmail: 'owner1@example.com'
        });

      const res2 = await request(app)
        .post('/api/applications/submit')
        .send({
          erfNumber: 'TC222222',
          address: 'Address 2',
          ownerName: 'Owner 2',
          ownerEmail: 'owner2@example.com'
        });

      expect(res1.body.reference).not.toBe(res2.body.reference);
    });
  });

  describe('Application Retrieval', () => {
    let testAppId;
    let testReference;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/applications/submit')
        .send({
          erfNumber: 'TC999999',
          address: '456 Test Street',
          ownerName: 'Test User',
          ownerEmail: 'test@example.com'
        });

      testAppId = res.body.applicationId;
      testReference = res.body.reference;
    });

    test('get application by ID', async () => {
      const res = await request(app).get(`/api/applications/${testAppId}`);

      expect(res.status).toBe(200);
      expect(res.body.erfNumber).toBe('TC999999');
      expect(res.body.status).toBe('pending');
    });

    test('get application by reference', async () => {
      const res = await request(app).get(`/api/applications/${testReference}`);

      expect(res.status).toBe(200);
      expect(res.body.erfNumber).toBe('TC999999');
    });

    test('get non-existent application returns 404', async () => {
      const res = await request(app).get('/api/applications/99999');
      expect(res.status).toBe(404);
    });
  });

  describe('Application Status Updates', () => {
    let testAppId;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/applications/submit')
        .send({
          erfNumber: 'TC777777',
          address: '789 Status Street',
          ownerName: 'Status User',
          ownerEmail: 'status@example.com'
        });

      testAppId = res.body.applicationId;
    });

    test('update status to in_review', async () => {
      const res = await request(app)
        .put(`/api/applications/${testAppId}/status`)
        .send({ status: 'in_review' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.application.status).toBe('in_review');
    });

    test('update status to approved', async () => {
      const res = await request(app)
        .put(`/api/applications/${testAppId}/status`)
        .send({ status: 'approved' });

      expect(res.status).toBe(200);
      expect(res.body.application.status).toBe('approved');
    });

    test('update status to invalid value fails', async () => {
      const res = await request(app)
        .put(`/api/applications/${testAppId}/status`)
        .send({ status: 'invalid_status' });

      expect(res.status).toBe(400);
    });

    test('update status of non-existent application fails', async () => {
      const res = await request(app)
        .put('/api/applications/99999/status')
        .send({ status: 'approved' });

      expect(res.status).toBe(404);
    });
  });

  describe('Application Comments', () => {
    let testAppId;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/applications/submit')
        .send({
          erfNumber: 'TC666666',
          address: '101 Comment Street',
          ownerName: 'Comment User',
          ownerEmail: 'comment@example.com'
        });

      testAppId = res.body.applicationId;
    });

    test('add comment to application', async () => {
      const res = await request(app)
        .post(`/api/applications/${testAppId}/comments`)
        .send({ text: 'Coverage exceeds 60% - revision required', author: 'Joe' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.comment.text).toBe('Coverage exceeds 60% - revision required');
      expect(res.body.comment.author).toBe('Joe');
    });

    test('add comment without text fails', async () => {
      const res = await request(app)
        .post(`/api/applications/${testAppId}/comments`)
        .send({});

      expect(res.status).toBe(400);
    });

    test('multiple comments are stored', async () => {
      await request(app)
        .post(`/api/applications/${testAppId}/comments`)
        .send({ text: 'Second comment', author: 'Joe' });

      const appRes = await request(app).get(`/api/applications/${testAppId}`);
      expect(appRes.body.comments.length).toBe(2);
    });
  });

  describe('Application Analysis', () => {
    let testAppId;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/applications/submit')
        .send({
          erfNumber: 'TC555555',
          address: '222 Analyze Street',
          ownerName: 'Analyze User',
          ownerEmail: 'analyze@example.com'
        });

      testAppId = res.body.applicationId;
    });

    test('analyze application with plan text', async () => {
      const res = await request(app)
        .post(`/api/applications/${testAppId}/analyze`)
        .send({ text: 'coverage 55%, storeys 2, setbackFront 4m' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.analysis).toHaveProperty('overallScore');
      expect(res.body.analysis).toHaveProperty('passedRules');
      expect(res.body.analysis).toHaveProperty('failedRules');
      expect(res.body.complianceLevel).toHaveProperty('level');
    });

    test('analyze application without text uses defaults', async () => {
      const res = await request(app)
        .post(`/api/applications/${testAppId}/analyze`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.analysis).toHaveProperty('totalRules', 34);
    });

    test('analyze non-existent application fails', async () => {
      const res = await request(app)
        .post('/api/applications/99999/analyze')
        .send({ text: 'coverage 50%' });

      expect(res.status).toBe(404);
    });
  });

  describe('Plan Checker Integration', () => {
    test('plan-checker rules are correctly loaded', () => {
      const rules = planChecker.nbrRules;
      expect(rules.length).toBe(34);
    });

    test('plan-checker categories are correct', () => {
      const categories = planChecker.getAllCategories();
      const categoryNames = categories.map(c => c.name);

      expect(categoryNames).toContain('Coverage');
      expect(categoryNames).toContain('Height');
      expect(categoryNames).toContain('Fire Safety');
      expect(categoryNames).toContain('Disabled Access');
      expect(categoryNames).toContain('Structural');
    });

    test('plan-checker compliance levels work', () => {
      expect(planChecker.getComplianceLevel(100).level).toBe('PASS');
      expect(planChecker.getComplianceLevel(75).level).toBe('CONDITIONS');
      expect(planChecker.getComplianceLevel(55).level).toBe('REVIEW');
      expect(planChecker.getComplianceLevel(40).level).toBe('REJECT');
    });
  });

});