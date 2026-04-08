# Semantic Memory - Patterns & Anti-Patterns

## Project Patterns

### Department Routing Pattern
```
Application Type → Required Departments (array)
↓
Each department has its own status in the array
↓
Overall status = combination of all dept statuses
```

### Workflow Stage Pattern
```
RECEIVED → ACKNOWLEDGED → UNDER_REVIEW → DECISION → COLLECTION
   ↓            ↓               ↓           ↓
 App submitted  Docs validated  Depts reviewing  Final outcome
```

### AI Analysis Pattern
```
Plan text → MiniMax API → Results with:
  - clause_id
  - status (PASS/FAIL/WARNING/NEED_INFO)
  - severity (CRITICAL/HIGH/MEDIUM/LOW)
  - department_code
  - suggestion
```

## Anti-Patterns Avoided

1. **Don't skip quality gates** - Always commit separately after each phase
2. **Don't edit files while server running** - Can cause corruption
3. **Don't use wrong path** - Double-check path before edit

## User Patterns

- Prefers comprehensive ("Option C") over incremental
- Likes when AI examination is kept as core differentiator
- Wants to match Tshwane branding, not create new design

## Code Patterns

### QP Registration Fields
- full_name, registration_number, professional_body, email, company

### Department Codes (Tshwane)
- BC, RSP, FS, GEO, MH, TI, RSW, WS, WM, EPO, WP, TRES

---
*Updated: 2026-04-08T11:49Z*