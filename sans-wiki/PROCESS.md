# Building Plan Analysis Workflow

## How We Analyze Applications

### Step 1: Copy Documents to Wiki Raw Folder
```bash
cp "/path/to/application-docs/*" ~/sans-plan-examiner/sans-wiki/raw/ERF-XXX/
```

### Step 2: Run OCR to Extract Text
```bash
node extract-pdf-text.js "./sans-wiki/raw/ERF-XXX/main-plan.pdf"
```

### Step 3: Analyze OCR Output
- Search for title block data (AREA SCHEDULE)
- Find room names and dimensions
- Extract compliance data (energy, structural)
- Check for SANS clause references

### Step 4: Cross-Reference with Wiki
- Compare against relevant SANS clauses
- Check precedents for similar cases
- Pull interpretation pages for edge cases

### Step 5: Generate Analysis + Letter

---

## What OCR Extracts Successfully

| Data Type | Example | Status |
|-----------|---------|--------|
| Title Block | Owner, Architect, ERF number | ✅ Great |
| Area Schedule | Total floor, coverage % | ✅ Great |
| Energy Calc | R-values, kWh, solar | ✅ Great |
| Room Names | Bedroom, Kitchen, Lounge | ✅ OK |
| Measurements | 195.5m² additional | ✅ Good |
| Compliance Notes | SANS10400-XA | ✅ Good |

---

## What's Still Missing (Drawing-Dependent)

| Data Type | Why Hard | Solution |
|-----------|----------|----------|
| Individual room dimensions | Only in drawing, not text | Request room schedule in PDF |
| Window sizes | In drawing callouts | Use window schedule if present |
| North arrow | Usually graphic | Look for "North" in text |
| Specific measurements | Scattered in drawing | Manual extraction |

---

## Files Created

- `extract-pdf-text.js` - OCR tool
- `precedents/erf-XXX.md` - Analysis for each application
- `letters/XXX-approval.txt` - Formal letters

---

## To Make Me Better

1. **Standardize submissions** - Ask architects to include room schedule as text in PDF
2. **Use consistent forms** - SANS1-4 have structured fields
3. **Add to wiki** - New precedents improve future analysis