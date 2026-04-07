# SANS Plan Examiner - Project Requirements Document

## 1. Project Overview

**Project Name:** SANS Plan Examiner
**Type:** Building Compliance Checking System for South African Municipalities
**Core Functionality:** Analyze building plans against SANS 10400 regulations and Tshwane Municipality bylaws, provide examiner decision support
**Target Users:** Building plan examiners (Joe), applicants (architects, property owners)

## 2. Technology Stack

- **Backend:** Node.js / Express.js
- **Database:** Supabase (PostgreSQL + Auth)
- **AI Analysis:** MiniMax API (for document analysis)
- **File Processing:** PDF parsing, OCR (Tesseract.js)
- **Frontend:** Vanilla HTML/CSS/JS (admin + client portals)
- **Testing:** Jest

## 3. Key Features

### 3.1 Document Processing
- Upload building plan PDFs
- OCR text extraction from scanned documents
- AI-powered compliance analysis

### 3.2 Compliance Checking
- 16 SANS 10400 rules in plan-checker.js:
  - Coverage rules (R1/R2 zones)
  - Height rules
  - Setback rules
  - Parking requirements
  - FAR rules
  - Boundary wall rules
  - Second dwelling rules
- Tshwane Land Use Scheme 2024 rules

### 3.3 Examiner Workflow
- Admin dashboard for reviewing applications
- Examiner checklist (60+ items across 12 sections)
- Decision letters (approve/reject/conditions)
- Precedent tracking

### 3.4 Knowledge Base (Wiki)
- SANS 10400 clause definitions (30+ clauses)
- Interpretations (stair-width, ceiling-height, site-coverage)
- Precedents (8 documented decisions)
- Query responses

### 3.5 Applicant Portal
- Submit applications with PDF uploads
- Track application status
- Receive decisions

## 4. System Architecture

```
client/              - Applicant portal (apply.html, track.html)
admin/               - Examiner dashboard (admin.html)
src/
  server.js          - Express API (authentication, file upload, AI analysis)
  plan-checker.js    - SANS compliance rule engine
  ai/
    sans-analyzer.js - AI document analysis
    document-verifier.js - Document validation
letters/             - Generated decision letters
uploads/             - Temporary file storage
```

## 5. API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/applicant-login` - Applicant login
- `POST /api/auth/verify-token` - JWT verification

### Applications
- `POST /api/applications/submit` - Submit new application
- `GET /api/applications/:id` - Get application details
- `PUT /api/applications/:id/decision` - Update decision

### Analysis
- `POST /api/analyze/plan` - Analyze building plan PDF
- `POST /api/analyze/checklist` - Run checklist compliance

### Wiki
- `GET /api/wiki/search` - Search wiki
- `GET /api/wiki/clauses/:id` - Get clause details

## 6. Database Schema

### applications
- id, erfNumber, address, ownerName, ownerEmail, ownerPhone
- pdfPath, status (pending/reviewing/approved/rejected/conditions)
- examinerComments, decision, createdAt, updatedAt

### users
- id, email, passwordHash, role (admin/examiner/applicant)
- name, createdAt

### letters
- id, applicationId, letterType, content, createdAt

## 7. Compliance Rules (SANS 10400)

### Coverage (SANS 10400-B)
- CVRG-001: Max 60% in R1 zone
- CVRG-002: Max 50% in R2 zone
- CVRG-003: Impermeable surfaces max 70%

### Height (SANS 10400-A)
- HEIT-001: Max 3 storeys (9m) in R1
- HEIT-002: Max 2 storeys (6m) in R2

### Setbacks
- SETB-001: Front setback min 3m
- SETB-002: Side setback min 1m
- SETB-003: Rear setback min 3m

### Parking (Tshwane Bylaws)
- PRKG-001: Min 2 parking bays per dwelling
- PRKG-002: 1 visitor parking per 5 dwellings

### Other
- BL-001: Street boundary line min 3m
- FAR-001: FAR max 0.6 in R1
- WALL-001: Boundary wall max 1.8m
- SEC-001: Second dwelling max 80m²

## 8. Examiner Checklist Sections

- Section A: ERF Details
- Section B: Site Development Plan
- Section C: Calculations
- SANS 10400-B: Fire Safety
- SANS 10400-C: Dimensions
- SANS 10400-D: Stairs
- SANS 10400-E: Disabled Access
- SANS 10400-G: Ventilation
- SANS 10400-H: Building Height
- SANS 10400-J: Structural
- SANS 10400-L: Energy
- SANS 10400-N: Glazing
- SANS 10400-P: Plumbing

## 9. Quality Requirements

### Testing
- Unit tests for plan-checker.js rules
- API endpoint tests
- Integration tests for document flow

### Security
- Input sanitization (XSS prevention)
- Rate limiting (100 req/15min general, 10/hour submit)
- JWT authentication
- Password hashing (bcrypt)
- Admin key authentication

### Performance
- Handle PDF uploads up to 10MB
- OCR processing timeout: 120 seconds
- API response time < 3 seconds (non-analysis)

## 10. Current Gaps

1. **NO UNIT TESTS** - Critical gap
2. plan-checker.js only has 16 rules (CHECKLIST has 60+ items)
3. server.js is 55KB - needs modularity review
4. No E2E tests
5. Wiki linting not automated
6. No regression test suite

## 11. Improvement Backlog

### High Priority
1. Add unit tests for plan-checker.js
2. Review server.js security
3. Add missing SANS rules

### Medium Priority
4. Add integration tests
5. Modularize server.js
6. Add E2E tests

### Low Priority
7. Automate wiki linting
8. Add performance tests
9. Add accessibility tests

---
*Generated: 2026-04-07*
*Status: DRAFT - Pending Implementation*