# Building Plan Analysis Workflow — Sedibeng District

## Step 1: Confirm Municipality
Verify erf falls under Sedibeng District (Vaal / Emfuleni).

## Step 2: Copy Documents to Wiki Raw Folder
```bash
cp "/path/to/application-docs/*" ~/sedibeng/sans-wiki/raw/[ERF-XXX]/
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

## Vaal / Emfuleni Submission Checklist
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

## Sedibeng District-Specific Requirements
Emfuleni — verify scheme is SPLUMA-compliant (legacy schemes common). Midvaal is fastest for approvals. Emfuleni historically slow. Chokoe Mansion falls here.
