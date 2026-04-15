# SANS Plan Examiner — Dashboard Kanban & Polish Upgrade

## Status
Draft — awaiting spec review

## Context
Joe's Examiner is a municipal building plan compliance tool used by Tshwane's Building Control Division. Examiners receive PDF building plans via an applicant portal, review them against SANS 10400 regulations using a 78-item checklist, and issue approval/rejection decisions.

The current admin dashboard (`admin/admin.html`) has a linear queue list that doesn't surface workflow stage at a glance. The approval rate stat is broken. Queue sort is missing.

---

## Design Principles
- **Outfit** font family throughout (body + mono for data)
- Single accent color: municipal green `#2d6a4f`
- No emoji — SVG icons only (Phosphor-style inline SVG)
- Spring-physics transitions on all interactive elements
- Cards grouped by stage, not just listed

---

## Feature 1 — Kanban Board

### Layout
- **5 vertical columns** representing workflow stages, left to right:
  `Received → Acknowledged → Under Review → Decision → Collection`
- **All applications** are displayed — grouped by their current `workflow_stage`
- Column header: stage name + count badge (e.g. "Received (3)")
- Cards within each column are sorted by `created_at ASC` (oldest first)

### Card Anatomy
```
[Stage Badge]
TSH-2026-001
ERF 1234 • Jane Smith
```

Stage badge colors:
| Stage | Badge Color |
|-------|------------|
| RECEIVED | `#dbeafe` blue |
| ACKNOWLEDGED | `#fef9e7` amber |
| UNDER_REVIEW | `#fce7f3` rose |
| DECISION | `#e8f5f3` green |
| COLLECTION | `#f3e5f5` purple |

### Card States
| State | Appearance |
|-------|------------|
| Default | White card, 1px `--border`, `--shadow-sm`, `--radius-lg` |
| Hover | Lift `translateY(-2px)`, `--shadow-md`, border tints to `--primary` |
| Active (selected) | `--primary` border, `--success-light` background, `--shadow-primary` |
| Dragging | opacity 0.85, scale 1.02, `--shadow-lg`, cursor `grabbing` |
| Drop target column | Column background tints `--primary` at 6% opacity |

### Drag & Drop Rules
- Cards can be dragged to adjacent columns only:
  - RECEIVED → ACKNOWLEDGED
  - ACKNOWLEDGED → RECEIVED or UNDER_REVIEW
  - UNDER_REVIEW → ACKNOWLEDGED or DECISION
  - DECISION → UNDER_REVIEW or COLLECTION
  - COLLECTION → DECISION
- Attempting a non-adjacent drop: card snaps back, column flashes red briefly
- Valid drop: card animates into new column, PATCH to Supabase `applications.workflow_stage`
- Drop animation: spring physics (`stiffness: 200, damping: 20`)

### Mobile (< 768px)
- Horizontal scroll with snap
- Cards 85% column width
- Touch drag supported

### Toolbar (above Kanban)
```
[Search: "Ref, ERF, applicant..."] [All][New][Review][Revision] | [Sort: Date ↑][Switch to List]
```
- Search filters cards in all columns simultaneously
- Filter chips filter by status: `All` (no filter) | `New` (status=SUBMITTED) | `Review` (workflow_stage=UNDER_REVIEW) | `Revision` (status=REVISION)
- Sort dropdown: `Date ↑ (oldest first)` | `Date ↓ (newest first)` | `ERF number` | `Status`
- "Switch to List" toggles back to the current queue list view

---

## Feature 2 — Polish Pass

### 2a. Sort Controls
- Added to toolbar above Kanban/list view
- Default sort: **Date ↑ (oldest first)**
- Sort options:
  - `Date ↑` — `ORDER BY created_at ASC`
  - `Date ↓` — `ORDER BY created_at DESC`
  - `ERF` — `ORDER BY erf_number`
  - `Status` — `ORDER BY status`
- Sort persists across filter changes and page reloads (`localStorage.setItem('kanbanSort', value)`)
- Sort applied via Supabase query parameter

### 2b. Stats Rate Calculation Fix
**Bug:** `statRate` always shows `0%` because `statApproved` is hardcoded to `0`.

**Fix:** Calculate from Supabase counts:
```
statTotal   = count of all applications
statPending = count WHERE status IN ('PENDING', 'SUBMITTED')
statApproved = count WHERE status = 'APPROVED'
statRejected = count WHERE status = 'REJECTED'
statRate     = statApproved / statTotal * 100
```

### 2c. Queue Toggle
- Button labeled "Switch to List" in toolbar toggles between Kanban and original queue list
- Active view state persists in `localStorage`

---

## Feature 3 — Quick-View Accordion

**Implementation:** Deferred to a separate spec / phase. Not in scope for this spec.

---

## Technical Approach

### Stack
- Single `admin/admin.html` file — vanilla JS, no framework
- Existing Supabase client (`@supabase/supabase-js`)
- HTML5 Drag and Drop API (native, no library)
- CSS Grid for column layout
- CSS Flexbox for card internals

### Files Changed
- `admin/admin.html` — new Kanban CSS + JS, sort controls, stats fix

### Supabase Query for Kanban Load
```js
// Load all apps grouped by stage
const { data, error } = await supabase
  .from('applications')
  .select('id, reference, erf_number, owner_name, status, workflow_stage, created_at, application_analysis, application_documents')
  .order('created_at', { ascending: true });
```

### Supabase PATCH on Stage Change
```js
// On valid drag-drop
const { error } = await supabase
  .from('applications')
  .update({ workflow_stage: newStage })
  .eq('id', appId);
```

### API Endpoints Used
- `GET /api/applications` — load all apps
- `PATCH applications` via Supabase client — update stage

---

## Out of Scope
- PDF rendering improvements
- Checklist redesign (78-item structure unchanged)
- Multi-examiner conflict resolution (two examiners editing same app)
- Notification system changes
- Approval letter generation

---

## Success Criteria
- [ ] Kanban renders all 5 stage columns with correct application counts
- [ ] Dragging a card to an adjacent column advances the stage in Supabase
- [ ] Non-adjacent drag is rejected with visual feedback
- [ ] Sort dropdown correctly re-orders cards within columns
- [ ] Approval rate stat (`statRate`) displays correct percentage from Supabase counts
- [ ] Stats reflect real Supabase counts (rate calculation fixed)
- [ ] "Switch to List" toggle returns to original queue view
- [ ] No emoji anywhere — SVG icons only
- [ ] Dark mode continues to work throughout
