# Building Plan Analysis Workflow — Jozi / COJ

## How We Analyze Applications

### Step 1: Confirm Municipal Authority
Before anything else, confirm:
- Which municipality the property falls under
- Which land use scheme applies
- Whether it's COJ, Emfuleni, Rand West, Midvaal, or another

### Step 2: Copy Documents to Wiki Raw Folder
```bash
cp "/path/to/application-docs/*" ~/jozi-plan-examiner/sans-wiki/raw/ERF-XXX/
```

### Step 3: Run OCR to Extract Text
```bash
node extract-pdf-text.js "./sans-wiki/raw/ERF-XXX/main-plan.pdf"
```

### Step 4: Analyze OCR Output
- Search for title block data (ERF, zoning, floor areas)
- Find room names and dimensions
- Extract compliance data (energy, structural)
- Check for SANS clause references

### Step 5: Cross-Reference with Wiki
- Compare against relevant SANS clauses
- Check precedents for similar cases
- Pull interpretation pages for edge cases

### Step 6: Generate Analysis + Letter

---

## COJ Submission Checklist (Priority Order)

1. ✅ SANS 10400-A Form 1 (signed)
2. ✅ Zoning certificate (< 60 days)
3. ✅ SG Diagram
4. ✅ Title deed
5. ✅ Power of Attorney (if applicable)
6. ✅ Architectural drawings (scaled, named, revisioned)
7. ✅ Structural drawings + calculations
8. ✅ Site development plan
9. ✅ Fire installation schedule
10. ✅ Energy certificate (SANS 10400-XA)
11. ✅ Storm water + drainage plan
12. ✅ Correct fees paid

---

## Files Created

- `extract-pdf-text.js` — OCR tool
- `precedents/erf-XXX.md` — Analysis for each application
- `letters/XXX-approval.txt` — Formal letters
