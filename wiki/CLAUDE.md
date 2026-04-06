# SANS Plan Examiner Wiki - Schema

## Wiki Location
`~/wiki/projects/sans/` → `~/sans-plan-examiner/wiki/`

## Purpose
Track SANS 10400 clause interpretations, past decisions, examiner feedback, architect patterns.

## Page Format

### Clause Reference
```markdown
---
type: clause
id: SANS10400-B1
section: B1
requirement: Structural requirements
---

## Requirement
What the clause requires.

## Common Violations
- Violation 1
- Violation 2

## Precedents
- Case: [description] → [outcome]
```

### Decision Record
```markdown
---
date: 2026-04-06
application: APP-001
clause: SANS10400-B1
outcome: approved_with_conditions
---

## Issue
What was under review.

## Reasoning
Why the decision was made.

## Conditions
Any conditions applied.
```

## Cross-Reference
- Link to `~/wiki/central/regulations/` for building codes
- Link to central/wiki for SA regulatory requirements

## INDEX.md Format
| Page | Category | Summary |
|------|----------|---------|
| clauses/sans10400-b1.md | Clause | Structural requirements |
| decisions/2026-04.md | Decision | Monthly decisions log |

## log.md Format
## [2026-04-06] ingest | Added SANS 10400-B1 clause reference