# Sedibeng District Plan Examiner — Maintenance Rules

You are the LLM maintaining a knowledge base for building plan compliance against SANS 10400 and the **Sedibeng District Municipality — Emfuleni, Lesedi, Midvaal** framework.

> **Jurisdiction:** Vereeniging, Vanderbijlpark, Meyerton, Heidelberg, Walkerville, Sasolburg

---

## Key Jurisdictional Note

All building plans in South Africa must comply with:
- **SANS 10400-A through Z** — National building standard (applies everywhere)
- **National Building Regulations (NBR)** — SABS X2001
- **SPLUMA, 2013** — Spatial Planning and Land Use Management Act

**This municipality:** Emfuleni Spatial Planning and Land Use Management By-Law (aligned to SPLUMA)

---

## Applicable Regulatory Framework

### National (Applies everywhere)
- **SANS 10400-A through Z** — National building standard
- **National Building Regulations (NBR)** — SABS X2001
- **SPLUMA, 2013** — Spatial Planning and Land Use Management Act

### Sedibeng District (Vaal / Emfuleni)
- **Emfuleni Spatial Planning and Land Use Management By-Law (aligned to SPLUMA)**
- **Emfuleni Land Use Scheme — verify currency (may not be SPLUMA-compliant)**
- Development controls: Coverage 60% (Res 1) | Height 2 storeys / 8m (Res 1) | FAR Verify current scheme — may follow Gauteng provincial model
- Parking: 1 bay/dwelling
- Building lines: Street 3m | Sides 1m | Rear 3m

### Walkerville falls here (Emfuleni Local Municipality). Emfuleni has historically had slower processing. Midvaal is more development-friendly. Chokoe Mansion project area.

---

## Key Exemptions / Special Controls

Emfuleni: legacy pre-SPLUMA schemes still in use — always verify against erf-specific controls. Midvaal follows Gauteng model by-laws.

---

## Directory Structure
```
sedibeng-wiki/
├── raw/                      # Source documents (read-only)
│   ├── vaal / emfuleni-scheme/   # Municipal scheme docs
│   ├── sans-10400-pdfs/      # Official SANS 10400 clauses
│   └── past-plans/           # Approved/rejected plans
├── wiki/                     # Compiled knowledge (you write)
│   ├── INDEX.md              # Directory of every page
│   ├── MOC.md                # Map of Content by topic
│   ├── clauses/              # SANS 10400 clause pages
│   ├── interpretations/       # How clauses are applied in practice
│   ├── precedents/           # Past decisions
│   └── queries/              # Answers to examiner questions
├── CHECKLIST.md              # Sedibeng District building plan checklist
├── SCHEME-SUMMARY.md         # Vaal / Emfuleni land use scheme quick reference
├── PROCESS.md                # Analysis workflow
└── CLAUDE.md                 # This file
```

---

## Key Documents for Analysis

When analyzing any application, use these sources in priority order:

1. **Emfuleni Land Use Scheme — verify currency (may not be SPLUMA-compliant)** (`SCHEME-SUMMARY.md`)
   - Official zoning requirements
   - Coverage: 60% (Res 1) | Height: 2 storeys / 8m (Res 1) | FAR: Verify current scheme — may follow Gauteng provincial model
   - Building lines: Street 3m | Sides 1m | Rear 3m

2. **Examiner Checklist** (`CHECKLIST.md`)
   - Sedibeng District's standard review process
   - **ALWAYS add examiner comments** to each section

3. **SANS 10400** (via wiki clauses)
   - Technical building standards
   - Room sizes, stairs, windows, energy, etc.

4. **Wiki Clauses & Precedents**
   - Interpretation of SANS in practice
   - Past decisions for reference

---

## Citation Format

When analyzing, ALWAYS cite the wiki:
- ✅ "Stair width is 900mm per [[clauses/D1]]"
- ✅ "Site coverage is 60% (Res 1) max per [[clauses/H2]]"
- ✅ "Follows precedent [[precedents/erf-XXXX]]"

---

## Checklist Workflow

When analyzing any application:

1. Run OCR on PDF: `node extract-pdf-text.js`
2. Go through CHECKLIST page by section
3. Mark PASS/FAIL/N/A for each item
4. **Add examiner comments** to each section
5. Use wiki clauses to justify decisions
6. Generate approval/rejection letter

---

## log.md

Append to `log.md`:
```
## [2026-04-30] ingest | [source name]
## [2026-04-30] query | [question summary]
## [2026-04-30] analyze | [ERF] — [decision]
```
