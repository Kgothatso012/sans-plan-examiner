# JOZI Plan Examiner Wiki - Maintenance Rules

You are the LLM maintaining a knowledge base for building plan compliance against SANS 10400 and the City of Johannesburg Metropolitan Municipality (COJ) framework.

> **Note:** This is the **Johannesburg/Gauteng South** variant of the Plan Examiner. For the Tshwane framework, see `~/sans-plan-examiner/CLAUDE.md`.

---

## Key Jurisdictional Note

City of Johannesburg Metropolitan Municipality (COJ) governs building control in:
- Johannesburg CBD, Sandton, Randburg, Rosebank, Midrand (northern areas)
- Soweto, Lenasia, Ennerdale (southern areas)
- Roodepoort, Dobsonville

**Walkerville / Emfuleni** falls under **Emfuleni Local Municipality (ELM)** — part of the Sedibeng District Municipality, NOT COJ. Development controls may follow the **Gauteng Provincial model by-laws** or Emfuleni's own scheme. Always confirm the specific municipality and applicable scheme before analysis.

---

## Directory Structure
```
jozi-wiki/
├── raw/                      # Source documents (read-only)
│   ├── coj-scheme/           # City of Johannesburg scheme docs
│   ├── emfuleni-scheme/      # Emfuleni/Vaal scheme docs
│   ├── sans-10400-pdfs/      # Official SANS 10400 clauses
│   └── past-plans/           # Approved/rejected plans
├── wiki/                     # Compiled knowledge (you write)
│   ├── INDEX.md              # Directory of every page
│   ├── MOC.md                # Map of Content by topic
│   ├── clauses/              # SANS 10400 clause pages
│   ├── interpretations/      # How clauses are applied in practice
│   ├── precedents/           # Past decisions
│   └── queries/              # Answers to examiner questions
├── CHECKLIST.md              # COJ/ELM building plan checklist
├── JOZI-SCHEME-SUMMARY.md    # COJ land use scheme quick reference
├── PROCESS.md                # Analysis workflow
└── CLAUDE.md                 # This file
```

---

## Applicable Regulatory Framework

### National (Applies everywhere)
- **SANS 10400-A through Z** — National building standard
- **National Building Regulations (NBR)** — SABS X2001
- **SPLUMA, 2013** — Spatial Planning and Land Use Management Act

### Gauteng Province
- **Gauteng Land Use Scheme Guidelines** — Provincial model

### City of Johannesburg (COJ)
- **City of Johannesburg Metropolitan Municipality Spatial Planning and Land Use Management By-Law, 2016**
- **Johannesburg Town Planning Scheme, 2018** (primary scheme)
- **Johannesburg Municipal Sector Act**

### Emfuleni Local Municipality (Vaal/Walkerville area)
- **Emfuleni Spatial Planning and Land Use Management By-Law** (aligned to SPLUMA)
- **Emfuleni Land Use Scheme** — confirm current version
- Controls may differ significantly from COJ — verify all erf-specific controls

---

## Key Documents for Analysis

When analyzing any application, use these sources in priority order:

1. **Applicable Municipal Land Use Scheme** (`JOZI-SCHEME-SUMMARY.md` or Emfuleni equivalent)
   - Official zoning requirements
   - Coverage, height, FAR limits
   - Building lines

2. **Municipal Checklist** (`CHECKLIST.md`)
   - Examiner's standard review process
   - 60+ items across sections
   - **ALWAYS add examiner comments** to each section

3. **SANS 10400** (via wiki clauses)
   - Technical building standards
   - Room sizes, stairs, windows, energy, etc.

4. **Wiki Clauses & Precedents**
   - Interpretation of SANS in practice
   - Past decisions for reference

---

## Checklist Workflow

When analyzing any application:

1. Run OCR on PDF: `node extract-pdf-text.js`
2. Go through CHECKLIST page by section
3. Mark PASS/FAIL/N/A for each item
4. **Add comments** to each section with findings
5. Use wiki clauses to justify decisions
6. Generate approval/rejection letter

---

## Citation Format

When analyzing, ALWAYS cite the wiki:

- ✅ "Stair width is 900mm per [[clauses/D1]]"
- ✅ "Site coverage is 60% max per [[clauses/H2]]"
- ✅ "Follows precedent [[precedents/erf-4521]]"

**NEVER cite raw SANS documents — always use the wiki as the source.**

---

## Operation Log

Append to `log.md`:
```
## [DATE] ingest | [source name]
## [DATE] query | [question summary]
## [DATE] lint | [findings]
```
