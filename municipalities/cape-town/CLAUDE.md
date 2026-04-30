# City of Cape Town Plan Examiner — Maintenance Rules

You are the LLM maintaining a knowledge base for building plan compliance against SANS 10400 and the **City of Cape Town Municipality** framework.

> **Jurisdiction:** Cape Town CBD, Stellenbosch, Paarl, Franschhoek, Milnerton, Bellville, Constantia, Southern Suburbs, Helderberg

---

## Key Jurisdictional Note

All building plans in South Africa must comply with:
- **SANS 10400-A through Z** — National building standard (applies everywhere)
- **National Building Regulations (NBR)** — SABS X2001
- **SPLUMA, 2013** — Spatial Planning and Land Use Management Act

**This municipality:** Cape Town Municipal Spatial Development Framework (MSDF) + District Zoning Schemes By-Law, 2015

---

## Applicable Regulatory Framework

### National (Applies everywhere)
- **SANS 10400-A through Z** — National building standard
- **National Building Regulations (NBR)** — SABS X2001
- **SPLUMA, 2013** — Spatial Planning and Land Use Management Act

### City of Cape Town (Cape Town)
- **Cape Town Municipal Spatial Development Framework (MSDF) + District Zoning Schemes By-Law, 2015**
- **Cape Town Zoning Scheme By-Law (2015)**
- Development controls: Coverage 60% (Res 1) | Height 2 storeys / 8m (Res 1) | FAR 0.4 (Res 1)
- Parking: 1 bay/dwelling (Res 1)
- Building lines: Street 3m | Sides 1m | Rear 2m

### Cape Town has unique heritage overlay (NHBRC + Heritage Western Cape); water restrictions zone; coastal management controls

---

## Key Exemptions / Special Controls

Heritage overlay — must obtain HWC permit before/during building plan process; NHBRC scope may differ for historic structures

---

## Directory Structure
```
cape/town-wiki/
├── raw/                      # Source documents (read-only)
│   ├── cape town-scheme/   # Municipal scheme docs
│   ├── sans-10400-pdfs/      # Official SANS 10400 clauses
│   └── past-plans/           # Approved/rejected plans
├── wiki/                     # Compiled knowledge (you write)
│   ├── INDEX.md              # Directory of every page
│   ├── MOC.md                # Map of Content by topic
│   ├── clauses/              # SANS 10400 clause pages
│   ├── interpretations/       # How clauses are applied in practice
│   ├── precedents/           # Past decisions
│   └── queries/              # Answers to examiner questions
├── CHECKLIST.md              # City of Cape Town building plan checklist
├── SCHEME-SUMMARY.md         # Cape Town land use scheme quick reference
├── PROCESS.md                # Analysis workflow
└── CLAUDE.md                 # This file
```

---

## Key Documents for Analysis

When analyzing any application, use these sources in priority order:

1. **Cape Town Zoning Scheme By-Law (2015)** (`SCHEME-SUMMARY.md`)
   - Official zoning requirements
   - Coverage: 60% (Res 1) | Height: 2 storeys / 8m (Res 1) | FAR: 0.4 (Res 1)
   - Building lines: Street 3m | Sides 1m | Rear 2m

2. **Examiner Checklist** (`CHECKLIST.md`)
   - City of Cape Town's standard review process
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
