# Building Plan Analysis Template

## Standard Analysis Process

### 1. Document Collection
- [ ] Copy all PDFs to `sans-wiki/raw/ERF-XXX/`
- [ ] Run OCR: `node extract-pdf-text.js "./sans-wiki/raw/ERF-XXX/main-plan.pdf"`
- [ ] Check document checklist (SANS form, plans, SG diagram, title deed, zoning, payment, POA)

### 2. Property Extraction (from OCR Title Block)
- [ ] ERF number and address
- [ ] Owner name
- [ ] Architect name and SACAP number
- [ ] Site area (ERF size)
- [ ] Existing floor area
- [ ] Additional floor area
- [ ] Total floor area
- [ ] Site coverage percentage

### 3. Compliance Check - PASSING Items

| Clause | Item | Extract From | Verify |
|--------|------|--------------|--------|
| H2 | Site Coverage | Title block "ACTUAL COVERAGE" | Must be ≤60% |
| A2 | Ceiling Height | OCR notes or section | 2.4m habitable |
| G1 | Window Area | **Window Schedule + Fenestration Calc** | 10% of floor |
| G2 | Ventilation | OCR notes | 5% openable |
| XA1 | Energy | OCR calculations | R-values, solar |
| XA2 | Glazing | **Fenestration Schedule** | Check vs window schedule |
| E1 | Room Sizes | OCR room schedule | 6.5m² bed, 12m² living |
| B1 | Classification | Title block | A1, H4, etc |
| J1/J2 | Structural | OCR notes | Engineer specs |
| F1 | Parking | Site plan | 1 bay min |
| D1 | Stair Width | Floor plan | 900mm residential |

### 4. ⚠️ Issues to Flag

| Issue | Required Action |
|-------|-----------------|
| No north arrow | Request per A1 |
| No ceiling height | Request per A2 |
| No parking | Request per F1 |
| Coverage >60% | REJECT per H2 |
| No energy calc | Request per XA1 |
| Boundary walls | Request per H3 |

### 5. Window/Fenestration Verification ⚠️ CRITICAL

**Must compare:**
1. **Window Schedule** (from drawing) → sum of all window areas
2. **Fenestration Calculation** (from OCR) → total glazing area
3. **SANS Requirement** → 10% of habitable floor area

**Check for discrepancies:**
- If schedule ≠ calculation → flag for verification
- If calculation < 10% → FAIL per G1
- If calculation > calculation → possible error

**Formula:**
```
Floor Area × 10% = Minimum Glazing Required
Fenestration Calc must ≥ Minimum
```

**Checklist:**
- [ ] Extract Window Schedule from OCR
- [ ] Extract Fenestration Calculation from OCR
- [ ] Calculate 10% of floor area
- [ ] Compare: Schedule vs Calc vs Requirement
- [ ] Note any discrepancies in analysis

### 6. Generate Letter

- Use template from `letters/`
- Include all conditions
- Reference wiki clauses

---

## Analysis Output Template

```markdown
# Analysis: ERF [NUMBER]

## Property
- ERF: [number]
- Owner: [name]
- Architect: [name]

## Area
- ERF: [X] m²
- Coverage: [X]% (per [[clauses/H2]])

## Passing
| Clause | Item | Status |
|--------|------|--------|
| [[clauses/H2]] | Coverage: X% | OK |

## Issues
| Clause | Issue | Action |
|--------|-------|--------|
| [[clauses/A1]] | No north arrow | Request |

## Decision
[CONDITIONAL APPROVAL / APPROVED / REJECTED]

## Conditions
1. [condition]
```

---

## Wiki Citation Requirements

- ALWAYS use `[[clauses/XX]]` format
- Use `[[interpretations/xxx]]` for practical guides
- Use `[[precedents/erf-XXX]]` for similar cases
- NEVER cite raw SANS documents