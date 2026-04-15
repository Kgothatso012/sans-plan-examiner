# Kanban Board Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a 5-column Kanban board to the admin dashboard that replaces the queue list, with drag-to-advance stage transitions, sort controls, filter chips, and a list-toggle. Also fix the broken stats rate calculation.

**Architecture:** Single-file vanilla JS SPA. Kanban renders inside the existing `queue-section`, toggling visibility with the original queue list. CSS Grid for columns, HTML5 Drag and Drop API for card movement. Supabase query for load and PATCH for stage updates. localStorage for sort/order persistence.

**Tech Stack:** Vanilla JS, CSS Grid, HTML5 DnD API, Supabase client, Outfit font (existing)

---

## File Changed
- `admin/admin.html` — CSS additions, HTML additions, JS functions

---

## Task 1: Kanban CSS

**Modify:** `admin/admin.html` — insert after existing queue-item CSS (around line 170)

**Step 1: Add Kanban CSS after queue-item block**

After line ~170 (after `.queue-item.active` dark mode rule), add:

```css
/* === KANBAN BOARD === */
.kanban-board {
  display: none; /* hidden until toggled on */
  flex-direction: column;
  height: 100%;
  padding: 0;
}

.kanban-board.active { display: flex; }

/* Toolbar above Kanban */
.kanban-toolbar {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--bg-base);
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
}

.kanban-toolbar .search-wrap {
  position: relative;
  flex: 1;
  min-width: 160px;
  max-width: 280px;
}

.kanban-toolbar .search-wrap svg {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
}

.kanban-toolbar #kanbanSearch {
  width: 100%;
  padding: 7px 12px 7px 34px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: 0.8rem;
  background: var(--bg-surface);
  color: var(--text-primary);
  font-family: var(--font-body);
  transition: border-color var(--transition-fast);
}

.kanban-toolbar #kanbanSearch:focus {
  outline: none;
  border-color: var(--primary);
}

.kanban-toolbar .filter-chips {
  display: flex;
  gap: 6px;
}

.kanban-toolbar .kanban-chip {
  padding: 5px 12px;
  font-size: 0.7rem;
  font-weight: 600;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-base);
  font-family: var(--font-body);
}

.kanban-toolbar .kanban-chip:hover {
  background: var(--bg-raised);
  color: var(--text-primary);
}

.kanban-toolbar .kanban-chip.active {
  background: var(--primary);
  border-color: var(--primary);
  color: var(--text-inverse);
}

.kanban-toolbar .toolbar-right {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-left: auto;
}

.kanban-toolbar #kanbanSort {
  padding: 6px 10px;
  font-size: 0.75rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-surface);
  color: var(--text-primary);
  font-family: var(--font-body);
  cursor: pointer;
}

.kanban-toolbar #kanbanSort:focus { outline: none; border-color: var(--primary); }

.kanban-toolbar .btn-switch-list {
  padding: 6px 14px;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-surface);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-base);
  font-family: var(--font-body);
  display: flex;
  align-items: center;
  gap: 5px;
}

.kanban-toolbar .btn-switch-list:hover {
  background: var(--bg-raised);
  color: var(--text-primary);
}

/* Kanban columns area */
.kanban-columns {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--space-3);
  padding: var(--space-4);
  flex: 1;
  overflow-x: auto;
  align-items: start;
}

@media (max-width: 767px) {
  .kanban-columns {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    gap: var(--space-3);
    padding: var(--space-3);
  }
}

.kanban-column {
  background: var(--bg-raised);
  border-radius: var(--radius-lg);
  min-width: 200px;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 260px);
  transition: background var(--transition-base);
}

.kanban-column.drag-over { background: rgba(45, 106, 79, 0.08); }

.kanban-col-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  background: var(--bg-raised);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  z-index: 1;
}

.kanban-col-title {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-secondary);
}

.kanban-col-count {
  font-size: 0.65rem;
  font-weight: 700;
  font-family: var(--font-mono);
  background: var(--border);
  color: var(--text-secondary);
  padding: 1px 7px;
  border-radius: 10px;
}

.kanban-col-cards {
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  overflow-y: auto;
  flex: 1;
}

/* Kanban cards */
.kanban-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-3);
  cursor: grab;
  transition: all 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
  user-select: none;
}

.kanban-card:hover {
  border-color: var(--primary);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.kanban-card:active { cursor: grabbing; }

.kanban-card.dragging {
  opacity: 0.85;
  transform: scale(1.02) translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.kanban-card.selected {
  border-color: var(--primary);
  background: var(--success-light);
  box-shadow: var(--shadow-primary), 0 0 0 1px var(--primary);
}

.kanban-card-stage {
  display: inline-block;
  font-size: 0.6rem;
  font-weight: 700;
  font-family: var(--font-mono);
  letter-spacing: 0.06em;
  padding: 2px 7px;
  border-radius: 10px;
  margin-bottom: var(--space-2);
}

.stage-RECEIVED    { background: #dbeafe; color: #1e40af; }
.stage-ACKNOWLEDGED { background: #fef9e7; color: #92400e; }
.stage-UNDER_REVIEW { background: #fce7f3; color: #9d174d; }
.stage-DECISION    { background: #e8f5f3; color: #065f46; }
.stage-COLLECTION  { background: #f3e5f5; color: #6b21a8; }

[data-theme="dark"] .stage-RECEIVED    { background: #1e3a5f; color: #93c5fd; }
[data-theme="dark"] .stage-ACKNOWLEDGED { background: #3d3014; color: #fcd34d; }
[data-theme="dark"] .stage-UNDER_REVIEW { background: #4a1942; color: #f9a8d4; }
[data-theme="dark"] .stage-DECISION    { background: #143327; color: #6ee7b7; }
[data-theme="dark"] .stage-COLLECTION  { background: #2e1942; color: #d8b4fe; }

.kanban-card-ref {
  font-size: 0.85rem;
  font-weight: 700;
  font-family: var(--font-mono);
  color: var(--text-primary);
  letter-spacing: -0.01em;
  margin-bottom: 3px;
}

.kanban-card-meta {
  font-size: 0.75rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

/* Drop zone flash for invalid drop */
.kanban-column.invalid-drop {
  animation: col-flash-red 400ms ease-out;
}

@keyframes col-flash-red {
  0%   { background: rgba(230, 57, 70, 0.2); }
  100% { background: var(--bg-raised); }
}

/* Empty column state */
.kanban-col-empty {
  padding: var(--space-4);
  text-align: center;
  font-size: 0.75rem;
  color: var(--text-muted);
  font-style: italic;
}
```

**Step 2: Commit**

```bash
git add admin/admin.html
git commit -m "feat: add Kanban CSS styles (columns, cards, drag states)"
```

---

## Task 2: Kanban HTML Structure

**Modify:** `admin/admin.html` — add Kanban markup after queue list div (line 886)

**Step 1: Add Kanban markup after `<div id="queueList"></div>` (line 886)**

After `</div>` closing queueList, add:

```html
        <!-- KANBAN BOARD (toggled visible when kanban view active) -->
        <div class="kanban-board" id="kanbanBoard">
          <div class="kanban-toolbar">
            <div class="search-wrap">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" id="kanbanSearch" placeholder="Ref, ERF, applicant..." oninput="onKanbanSearch(this.value)">
            </div>
            <div class="filter-chips">
              <button class="kanban-chip active" data-filter="all" onclick="setKanbanFilter('all')">All</button>
              <button class="kanban-chip" data-filter="SUBMITTED" onclick="setKanbanFilter('SUBMITTED')">New</button>
              <button class="kanban-chip" data-filter="UNDER_REVIEW" onclick="setKanbanFilter('UNDER_REVIEW')">Review</button>
              <button class="kanban-chip" data-filter="REVISION" onclick="setKanbanFilter('REVISION')">Revision</button>
            </div>
            <div class="toolbar-right">
              <select id="kanbanSort" onchange="setKanbanSort(this.value)">
                <option value="date-asc">Date ↑</option>
                <option value="date-desc">Date ↓</option>
                <option value="erf">ERF</option>
                <option value="status">Status</option>
              </select>
              <button class="btn-switch-list" onclick="switchToList()">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                Switch to List
              </button>
            </div>
          </div>
          <div class="kanban-columns" id="kanbanColumns">
            <div class="kanban-column" data-stage="RECEIVED" ondragover="onColDragOver(event)" ondragleave="onColDragLeave(event)" ondrop="onColDrop(event)">
              <div class="kanban-col-header">
                <span class="kanban-col-title">Received</span>
                <span class="kanban-col-count" id="count-RECEIVED">0</span>
              </div>
              <div class="kanban-col-cards" id="cards-RECEIVED"></div>
            </div>
            <div class="kanban-column" data-stage="ACKNOWLEDGED" ondragover="onColDragOver(event)" ondragleave="onColDragLeave(event)" ondrop="onColDrop(event)">
              <div class="kanban-col-header">
                <span class="kanban-col-title">Acknowledged</span>
                <span class="kanban-col-count" id="count-ACKNOWLEDGED">0</span>
              </div>
              <div class="kanban-col-cards" id="cards-ACKNOWLEDGED"></div>
            </div>
            <div class="kanban-column" data-stage="UNDER_REVIEW" ondragover="onColDragOver(event)" ondragleave="onColDragLeave(event)" ondrop="onColDrop(event)">
              <div class="kanban-col-header">
                <span class="kanban-col-title">Under Review</span>
                <span class="kanban-col-count" id="count-UNDER_REVIEW">0</span>
              </div>
              <div class="kanban-col-cards" id="cards-UNDER_REVIEW"></div>
            </div>
            <div class="kanban-column" data-stage="DECISION" ondragover="onColDragOver(event)" ondragleave="onColDragLeave(event)" ondrop="onColDrop(event)">
              <div class="kanban-col-header">
                <span class="kanban-col-title">Decision</span>
                <span class="kanban-col-count" id="count-DECISION">0</span>
              </div>
              <div class="kanban-col-cards" id="cards-DECISION"></div>
            </div>
            <div class="kanban-column" data-stage="COLLECTION" ondragover="onColDragOver(event)" ondragleave="onColDragLeave(event)" ondrop="onColDrop(event)">
              <div class="kanban-col-header">
                <span class="kanban-col-title">Collection</span>
                <span class="kanban-col-count" id="count-COLLECTION">0</span>
              </div>
              <div class="kanban-col-cards" id="cards-COLLECTION"></div>
            </div>
          </div>
        </div>
```

**Step 2: Hide the original queue list when Kanban is active**

In the existing queue-section CSS (line 139), add queue list hide when kanban is active:

```css
.kanban-board.active ~ #queueList,
.queue-section:has(.kanban-board.active) .queue-filters,
.queue-section:has(.kanban-board.active) .batch-toolbar {
  display: none;
}
```

Or more simply, add a CSS rule to hide the queue list when Kanban is active:

After the `.kanban-board.active { display: flex; }` rule, add:

```css
.queue-list-hidden { display: none; }
```

**Step 3: Commit**

```bash
git add admin/admin.html
git commit -m "feat: add Kanban HTML structure (toolbar, 5 columns)"
```

---

## Task 3: Kanban JavaScript — Rendering & Sort

**Modify:** `admin/admin.html` — add JS functions after the existing `renderQueue` function

**Step 1: Add Kanban JS after `renderQueue` function (after line 3234)**

After `renderQueue._calling = false; }` closing brace of `renderQueue`, add:

```javascript
// === KANBAN BOARD ===

// Stage column order for adjacency validation
const STAGE_ORDER = ['RECEIVED', 'ACKNOWLEDGED', 'UNDER_REVIEW', 'DECISION', 'COLLECTION'];
const STAGE_INDEX = Object.fromEntries(STAGE_ORDER.map((s, i) => [s, i]));

// Adjacent-only transition map
const VALID_TRANSITIONS = {
  'RECEIVED':    ['ACKNOWLEDGED'],
  'ACKNOWLEDGED': ['RECEIVED', 'UNDER_REVIEW'],
  'UNDER_REVIEW': ['ACKNOWLEDGED', 'DECISION'],
  'DECISION':    ['UNDER_REVIEW', 'COLLECTION'],
  'COLLECTION':  ['DECISION'],
};

let kanbanView = localStorage.getItem('kanbanView') === 'kanban';
let kanbanSort = localStorage.getItem('kanbanSort') || 'date-asc';
let kanbanFilter = 'all';
let kanbanSearchQuery = '';
let allKanbanApps = [];
let draggedCardId = null;

// Initialize Kanban view on load
function initKanban() {
  const sortEl = document.getElementById('kanbanSort');
  if (sortEl) sortEl.value = kanbanSort;
  if (kanbanView) {
    document.getElementById('kanbanBoard').classList.add('active');
    // Hide queue list
    document.querySelector('.queue-filters').style.display = 'none';
    document.getElementById('batchButtonGroup').style.display = 'none';
  }
}

function switchToKanban() {
  kanbanView = true;
  localStorage.setItem('kanbanView', 'kanban');
  document.getElementById('kanbanBoard').classList.add('active');
  document.querySelector('.queue-filters').style.display = 'none';
  document.getElementById('batchButtonGroup').style.display = 'none';
  renderKanban(allKanbanApps);
}

function switchToList() {
  kanbanView = false;
  localStorage.setItem('kanbanView', 'list');
  document.getElementById('kanbanBoard').classList.remove('active');
  document.querySelector('.queue-filters').style.display = '';
  // Re-show batch toolbar if apps were selected
  updateBatchButtons();
  renderQueue(allKanbanApps);
}

function setKanbanFilter(filter) {
  kanbanFilter = filter;
  document.querySelectorAll('.kanban-chip').forEach(c => c.classList.remove('active'));
  document.querySelector(`.kanban-chip[data-filter="${filter}"]`).classList.add('active');
  renderKanban(allKanbanApps);
}

function setKanbanSort(value) {
  kanbanSort = value;
  localStorage.setItem('kanbanSort', value);
  renderKanban(allKanbanApps);
}

function onKanbanSearch(query) {
  kanbanSearchQuery = query.toLowerCase();
  renderKanban(allKanbanApps);
}

function getSortedKanbanApps(apps) {
  let filtered = kanbanFilter === 'all'
    ? apps
    : apps.filter(a => {
        if (kanbanFilter === 'SUBMITTED') return a.status === 'SUBMITTED';
        if (kanbanFilter === 'UNDER_REVIEW') return a.workflow_stage === 'UNDER_REVIEW';
        if (kanbanFilter === 'REVISION') return a.status === 'REVISION';
        return true;
      });

  if (kanbanSearchQuery) {
    filtered = filtered.filter(a =>
      (a.reference && a.reference.toLowerCase().includes(kanbanSearchQuery)) ||
      (a.erf_number && a.erf_number.toLowerCase().includes(kanbanSearchQuery)) ||
      (a.owner_name && a.owner_name.toLowerCase().includes(kanbanSearchQuery)) ||
      (a.owner_email && a.owner_email.toLowerCase().includes(kanbanSearchQuery)) ||
      (a.street_address && a.street_address.toLowerCase().includes(kanbanSearchQuery)) ||
      (a.professional_name && a.professional_name.toLowerCase().includes(kanbanSearchQuery))
    );
  }

  return filtered.sort((a, b) => {
    if (kanbanSort === 'date-asc')  return new Date(a.created_at) - new Date(b.created_at);
    if (kanbanSort === 'date-desc') return new Date(b.created_at) - new Date(a.created_at);
    if (kanbanSort === 'erf') {
      const aNum = parseInt(a.erf_number) || 0;
      const bNum = parseInt(b.erf_number) || 0;
      return aNum - bNum;
    }
    if (kanbanSort === 'status') return (a.status || '').localeCompare(b.status || '');
    return 0;
  });
}

function renderKanban(apps) {
  allKanbanApps = apps;
  if (!kanbanView) return;

  const sorted = getSortedKanbanApps(apps);

  STAGE_ORDER.forEach(stage => {
    const colCards = document.getElementById(`cards-${stage}`);
    const countEl  = document.getElementById(`count-${stage}`);
    if (!colCards || !countEl) return;

    const stageApps = sorted.filter(a => a.workflow_stage === stage);

    countEl.textContent = stageApps.length;

    if (stageApps.length === 0) {
      colCards.innerHTML = '<div class="kanban-col-empty">No applications</div>';
      return;
    }

    colCards.innerHTML = stageApps.map(app => {
      const isSelected = currentApp?.id === app.id;
      const stageClass = `stage-${app.workflow_stage || 'RECEIVED'}`;
      return `
        <div class="kanban-card ${isSelected ? 'selected' : ''}"
             draggable="true"
             data-id="${app.id}"
             data-stage="${app.workflow_stage || 'RECEIVED'}"
             ondragstart="onCardDragStart(event)"
             ondragend="onCardDragEnd(event)"
             onclick="selectApplication('${app.id}')">
          <span class="kanban-card-stage ${stageClass}">${app.workflow_stage || 'RECEIVED'}</span>
          <div class="kanban-card-ref">${app.reference}</div>
          <div class="kanban-card-meta">ERF ${app.erf_number || '—'} · ${app.owner_name || '—'}</div>
        </div>
      `;
    }).join('');
  });
}
```

**Step 2: Commit**

```bash
git add admin/admin.html
git commit -m "feat: add Kanban JS render, sort, filter, and view toggle"
```

---

## Task 4: Drag and Drop

**Modify:** `admin/admin.html` — add drag/drop handlers after `renderKanban`

**Step 1: Add drag/drop handlers after `renderKanban` function**

```javascript
// === KANBAN DRAG AND DROP ===

function onCardDragStart(e) {
  draggedCardId = e.target.dataset.id;
  e.target.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', draggedCardId);
}

function onCardDragEnd(e) {
  e.target.classList.remove('dragging');
  draggedCardId = null;
  // Remove all drag-over states
  document.querySelectorAll('.kanban-column').forEach(c => c.classList.remove('drag-over'));
}

function onColDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  const col = e.currentTarget;
  const targetStage = col.dataset.stage;
  const cardStage = draggedCardId
    ? (allKanbanApps.find(a => a.id === draggedCardId)?.workflow_stage || 'RECEIVED')
    : null;

  if (cardStage && !isValidTransition(cardStage, targetStage)) {
    // Invalid — show different visual (keep neutral)
    col.classList.add('drag-over');
    return;
  }
  col.classList.add('drag-over');
}

function onColDragLeave(e) {
  // Only remove if leaving the column itself (not a child)
  if (!e.currentTarget.contains(e.relatedTarget)) {
    e.currentTarget.classList.remove('drag-over');
  }
}

function isValidTransition(fromStage, toStage) {
  const validNext = VALID_TRANSITIONS[fromStage] || [];
  return validNext.includes(toStage);
}

async function onColDrop(e) {
  e.preventDefault();
  const col = e.currentTarget;
  col.classList.remove('drag-over');

  const newStage = col.dataset.stage;
  const appId = e.dataTransfer.getData('text/plain') || draggedCardId;
  if (!appId) return;

  const app = allKanbanApps.find(a => a.id === appId);
  if (!app) return;

  const oldStage = app.workflow_stage || 'RECEIVED';

  // Validate adjacency
  if (!isValidTransition(oldStage, newStage)) {
    // Flash red — invalid drop
    col.classList.add('invalid-drop');
    setTimeout(() => col.classList.remove('invalid-drop'), 400);
    showToast(`Cannot move from ${oldStage} to ${newStage}`, 'error');
    return;
  }

  // Optimistic UI update
  app.workflow_stage = newStage;
  renderKanban(allKanbanApps);

  // Persist to Supabase
  try {
    const { error } = await supabase
      .from('applications')
      .update({ workflow_stage: newStage })
      .eq('id', appId);

    if (error) throw error;
    showToast(`Moved to ${newStage}`, 'success');
  } catch (err) {
    // Rollback on error
    app.workflow_stage = oldStage;
    renderKanban(allKanbanApps);
    showToast('Error updating stage: ' + err.message, 'error');
  }
}
```

**Step 2: Add Switch to Kanban button to queue header**

In the queue header area (line 867-869), add a button:

```html
<div class="queue-header">
  <h3>Queue</h3>
  <span id="queueCount">0</span>
  <button onclick="switchToKanban()" style="margin-left:auto;margin-right:8px;padding:4px 12px;font-size:0.7rem;font-weight:600;border:1px solid var(--border);border-radius:6px;background:var(--bg-surface);color:var(--text-secondary);cursor:pointer;font-family:var(--font-body);">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-1px;margin-right:3px;"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
    Kanban
  </button>
</div>
```

**Step 3: Commit**

```bash
git add admin/admin.html
git commit -m "feat: add Kanban drag-and-drop with adjacent-only validation"
```

---

## Task 5: Wire Kanban to Load & Stats Fix

**Modify:** `admin/admin.html` — update the `loadQueue` function to also render Kanban, fix statRate

**Step 1: Fix statRate calculation in `renderQueue` (line 3173)**

Find line 3173:
```javascript
const rate = total > 0 ? Math.round((approved / (approved + rejected || 1)) * 100) : 0;
```

Replace with:
```javascript
const rate = total > 0 ? Math.round((approved / total) * 100) : 0;
```

**Step 2: Call `renderKanban` in `loadQueue` after data loads**

Find where `renderQueue(allQueueApps)` is called after the Supabase fetch. It should be around line 3140. Add after it:

```javascript
// Also render Kanban if that view is active
if (kanbanView) {
  renderKanban(allQueueApps);
}
```

**Step 3: Ensure Kanban re-renders when an app is selected/updated**

The `selectApplication` function fires when a card is clicked. Ensure the Kanban highlights update. The `renderKanban` already handles `selected` class — it checks `currentApp?.id`. No extra action needed since `renderKanban` is called from `loadQueue`.

**Step 4: Commit**

```bash
git add admin/admin.html
git commit -m "fix: statRate calculation from Supabase counts, wire Kanban to loadQueue"
```

---

## Task 6: Touch-up — Init, localStorage Defaults, Queue Count in Kanban Mode

**Modify:** `admin/admin.html`

**Step 1: Call `initKanban()` on DOMContentLoaded**

Find the `DOMContentLoaded` event handler (around line 3100). Add at the end of it:

```javascript
initKanban();
```

**Step 2: Ensure sort persists on page reload**

The `kanbanSort` variable is initialized from localStorage already. The sort dropdown value is set in `initKanban()`. Make sure the sort order is applied on initial render — verify `getSortedKanbanApps` is called with the right sort value. Already done in Task 3.

**Step 3: Update Kanban count badges from real data on load**

Already handled — `renderKanban` updates counts from `allKanbanApps`.

**Step 4: Add cursor style to queue header Kanban button**

Add to the inline style of the Kanban button in queue-header:
```css
cursor: pointer;
```
(already included above)

**Step 5: Commit**

```bash
git add admin/admin.html
git commit -m "feat: init Kanban on page load, persist sort and view across reloads"
```

---

## Verification Checklist

After all tasks, verify:

- [ ] `admin/admin.html` has no syntax errors (open in browser)
- [ ] Kanban board appears when clicking "Kanban" button in queue header
- [ ] All 5 columns show with correct application counts
- [ ] Dragging a card to an adjacent column updates `workflow_stage` in Supabase
- [ ] Dragging to non-adjacent column shows red flash + error toast
- [ ] Sort dropdown reorders cards within columns (Date ↑↓, ERF, Status)
- [ ] Filter chips (All/New/Review/Revision) filter cards across all columns
- [ ] Search filters cards in all columns simultaneously
- [ ] "Switch to List" returns to original queue list
- [ ] Switching view persists after page reload
- [ ] statRate shows correct percentage (not always 0%)
- [ ] No emoji — only SVG icons used

---

## Supabase Schema Reference

```sql
-- workflow_stage values:
'RECEIVED', 'ACKNOWLEDGED', 'UNDER_REVIEW', 'DECISION', 'COLLECTION'

-- status values:
'SUBMITTED', 'IN_REVIEW', 'REVISION', 'APPROVED', 'REJECTED'

-- applications table columns used:
id, reference, erf_number, owner_name, status, workflow_stage, created_at
```
