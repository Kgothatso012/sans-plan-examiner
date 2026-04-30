# Building Plan Analysis Workflow — Nelson Mandela Bay

## Step 1: Confirm Municipality
Verify erf falls under Nelson Mandela Bay (Gqeberha / Port Elizabeth).

## Step 2: Copy Documents to Wiki Raw Folder
```bash
cp "/path/to/application-docs/*" ~/nelson-mandela-bay/sans-wiki/raw/[ERF-XXX]/
```

## Step 3: Run OCR
```bash
node extract-pdf-text.js "./sans-wiki/raw/[ERF-XXX]/[plan-file].pdf"
```

## Step 4: Analyze
- Confirm erf address + zoning
- Apply CHECKLIST.md section by section
- Cite wiki clauses for every finding

## Step 5: Generate Letter
- Approval: cite compliance against SANS + scheme
- Refusal: cite specific clause violations with correction required

## Gqeberha / Port Elizabeth Submission Checklist
1. ✅ SANS 10400-A Form 1 (signed)
2. ✅ Zoning certificate (< 60 days)
3. ✅ SG Diagram
4. ✅ Title deed
5. ✅ Power of Attorney (if applicable)
6. ✅ Architectural drawings (scaled, named, revisioned)
7. ✅ Structural drawings + calculations
8. ✅ Site development plan
9. ✅ Energy certificate (SANS 10400-XA)
10. ✅ Storm water + drainage plan
11. ✅ Correct fees paid

## Nelson Mandela Bay-Specific Requirements
Baakens Valley corridor has special controls; coastal zone setbacks required; NMBM has adopted SPLUMA by-law 2019 — fully compliant
