# SANS Plan Examiner Wiki - Maintenance Rules

You are the LLM maintaining a knowledge base for building plan compliance against SANS 10400.

## Directory Structure
sans-wiki/
├── raw/ # Source documents (read-only)
│ ├── sans-10400-pdfs/ # Official SANS 10400 clauses
│ ├── past-plans/ # Approved/rejected plans (anonymized)
│ └── examiner-notes/ # Joe's handwritten notes
├── wiki/ # Compiled knowledge (you write)
│ ├── INDEX.md # Directory of every page with summaries
│ ├── MOC.md # Map of Content by topic
│ ├── clauses/ # One file per SANS clause
│ │ ├── A1.md
│ │ ├── A2.md
│ │ └── ...
│ ├── interpretations/ # How clauses are applied in practice
│ ├── precedents/ # Past decisions by ERF/architect
│ ├── common-violations/ # What fails most often
│ └── queries/ # Answers to examiner questions
├── log.md # Append-only operation log
└── CLAUDE.md # This file

## INDEX.md Format
```markdown
# Wiki Index

## Clauses
| Page | Summary | Category |
|------|---------|----------|
| [[clauses/A1]] | Application of Act | admin |
| [[clauses/A2]] | Definitions | admin |
| [[clauses/A3]] | Classification | occupancy |

## Interpretations
| Page | Clause | Summary |
|------|--------|---------|
| [[interpretations/stair-width]] | A4.2.3 | 900mm min, exceptions for residential |

## Precedents
| Page | ERF | Decision | Date |
|------|-----|----------|------|
| [[precedents/erf-12345]] | 12345 | Approved w/ condition | 2026-03-15 |
```

## Compilation Rules

When a new source enters raw/:

- If it's a SANS clause PDF → extract to wiki/clauses/[ID].md
- If it's a past plan → extract decision to wiki/precedents/[erf].md
- If it's examiner notes → extract insights to wiki/interpretations/
- Update INDEX.md with new page
- Update MOC.md if new category emerges
- Append to log.md: ## [DATE] ingest | [source name]

## Clause page format (wiki/clauses/X.md):
```markdown
# Clause [ID]: [Title]

## Requirement
[Exact text from SANS 10400]

## Measurable Criteria
- [ ] Dimension requirement: [value] mm
- [ ] Ratio requirement: [value] %
- [ ] Material requirement: [value]

## Common Violations
- [Violation 1 with example]
- [Violation 2 with example]

## Related Clauses
- [[clauses/Y]] - [relationship]
- [[clauses/Z]] - [relationship]

## Interpretation History
| Date | Ruling | Source |
|------|--------|--------|
| 2026-03-15 | 850mm acceptable for single dwelling | [[precedents/erf-12345]] |
```

## Interpretation page format (wiki/interpretations/[topic].md):
```markdown
# Interpretation: [Topic Name]

## Clause Reference
[[clauses/A4.2.3]]

## Core Principle
[What the clause actually means in practice]

## Accepted Deviations
| Scenario | Allowed | Precedent |
|----------|---------|-----------|
| Single dwelling, <100m² | 850mm | [[precedents/erf-12345]] |

## Rejected Examples
| Scenario | Rejected because | Precedent |
|----------|------------------|-----------|
| Multi-unit, >200m² | 850mm fails fire escape | [[precedents/erf-67890]] |
```

## Query Rules

When an examiner asks a question:

1. First read INDEX.md to locate relevant pages
2. Read those pages
3. Synthesize answer with citations to specific wiki pages
4. Write the answer to wiki/queries/[query-slug].md
5. Add backlinks from relevant clause and interpretation pages
6. Update INDEX.md with the new query page
7. Append to log.md: ## [DATE] query | [question summary]

Example query output:

```markdown
# Query: What is the minimum stair width for a duplex?

## Answer
900mm (Clause A4.2.3)

## Exceptions
- Single dwelling under 100m²: 850mm accepted ([[precedents/erf-12345]])
- Any multi-unit: Strict 900mm ([[precedents/erf-67890]])

## Sources
- [[clauses/A4.2.3]] - Official requirement
- [[interpretations/stair-width]] - Practice guide
- [[precedents/erf-12345]] - Approval example
```

## Linting Rules (Run Weekly)

Ask yourself:

- Find contradictions: Are there two interpretations saying different things?
- Missing backlinks: Does each clause link to relevant interpretations?
- Stale content: Pages not updated in 6+ months → flag for review
- Gaps: Topics appearing in 3+ queries but no dedicated page → create one

Output linting results to wiki/lint-[date].md

## Compilation Rules for AI Analysis

When analyzing a new plan:

1. Read relevant clause pages
2. Read relevant interpretation pages
3. Read relevant precedents (same architect, same building type)
4. Generate analysis with citations
5. After examiner approves/rejects, add decision to precedents

## log.md Format
```markdown
# Operation Log

## [2026-04-04] ingest | SANS 10400-A.pdf
## [2026-04-04] ingest | Past plan ERF-12345 (approved)
## [2026-04-04] query | "Minimum stair width duplex"
## [2026-04-04] lint | Found 2 contradictions, fixed
```

## Success Metrics
- Wiki size: number of pages in INDEX.md
- Query hit rate: questions answered without external search
- Citation accuracy: % of claims with wiki source