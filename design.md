# TaskFlow — Product & Technical Design Document

> **Audience:** Builders (Antigravity agent) and client (for visual reference). This is the single source of truth for product decisions, data shape, visual tokens, and interaction rules.

---

## 1. Product Summary

TaskFlow is a task management web application for an interior design company. The owner manages work across multiple named clients (e.g. "Skyline Residence — 3D Design", "Oak & Marble — 2D Drawings"). Each client has their own task list. The app replaces spreadsheets and provides a clean, fast, opinionated interface — not a general-purpose PM tool.

**Core principles:**
- Clarity over cleverness in every interaction
- A distinctive visual identity grounded in material/craft aesthetics — not a generic SaaS template
- Data stays simple (no multi-user auth, no complex permissions)
- Dense-but-readable information design — every column earns its place

---

## 2. Data Model

### 2.1 Client

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | Auto-generated |
| `name` | String (255) | Required, e.g. "Skyline Residence" |
| `category` | String (100), nullable | e.g. "3D Design", "2D Drawings" |
| `color` | String (7) | Hex color, e.g. `#B5502F` — the paint-swatch chip |
| `created_at` | DateTime | Auto server-side |
| `updated_at` | DateTime | Auto on every write |

**Relationships:** One Client → many Tasks (cascade delete all tasks and their subtasks on client delete).

### 2.2 Task

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `client_id` | UUID FK → Client | Not null |
| `sr_no` | Integer | Per-client sequential number; re-computed on reorder |
| `name` | String (500) | Required |
| `remarks` | Text, nullable | Long-form notes, truncated in table |
| `start_date` | Date, nullable | |
| `due_date` | Date, nullable | Drives grouping and color coding |
| `assignees` | JSON (array of strings) | e.g. `["Adit", "Riya"]` — initials chips in UI |
| `status` | Enum: `not_started` / `ongoing` / `completed` | Manual dropdown |
| `is_completed` | Boolean | Default false |
| `created_at` | DateTime | |
| `updated_at` | DateTime | |

**Relationships:** One Task → many Subtasks (cascade delete).

### 2.3 Subtask

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `task_id` | UUID FK → Task | Not null |
| `name` | String (500) | Required |
| `is_completed` | Boolean | Default false |
| `created_at` | DateTime | |

> **No `updated_at` on Subtask** — subtasks are lightweight; only `is_completed` changes, tracked by recency of parent task's `updated_at`.

---

## 3. Page-by-Page Feature Breakdown

### 3.1 Home (`/`)

**Purpose:** Combined view across all clients. Good for morning triage.

**Components:**
1. **Due-Today/Tomorrow Banner** (dismissible per session via localStorage): "You have **N tasks** due today and **M tasks** due tomorrow." Clicking either number smooth-scrolls to those rows in the table below. The banner is hidden when N=0 AND M=0.
2. **Task Table** — all tasks from all clients, grouped by month (Section 4), each row carries a client-color dot + client name chip.
3. **Filter Bar** — Status multi-select, Start Date range, Due Date range, AND logic between filters. Active filter count badge. One-click clear.

### 3.2 Client Task View (`/clients/[clientId]`)

**Purpose:** Single-client scoped view. The working surface for day-to-day tracking.

**Components:**
1. **Page header** — client name (in Fraunces/Newsreader serif) + category subtitle + color tab chip
2. **Filter Bar** — same as Home
3. **Task Table** — same structure as Home but scoped; no client-name column needed
4. **"+ New Task" button** — opens inline row at bottom of current month group (or floating row if no tasks yet)

### 3.3 Calendar (`/calendar`)

**Purpose:** Month-view overview of all due dates.

**Components:**
1. **Month grid** — current day highlighted, prev/next month navigation, "Today" button
2. **Client filter dropdown** — default all, single-select per view
3. **Day cells** — colored dot(s) per task using Section 9 color rules; multiple tasks = stacked dots, capped at 3 visible + count overflow
4. **Day panel** — clicking a day opens a right-side or bottom panel listing tasks due that day, each linking to its client view

### 3.4 Overview (`/overview`)

**Purpose:** Kanban board — status as swim lanes, for a drag-and-drop workflow check.

**Components:**
1. **Three columns:** Not Started · Ongoing · Completed
2. **Client filter dropdown** — default all
3. **Task cards** — name, client color chip, due date with color coding, progress bar if subtasks exist
4. **Drag-to-change-status** — dragging a card across columns updates its status (and `is_completed` if dragged to/from Completed)

### 3.5 Settings (modal or `/settings`)

**Purpose:** Theme switcher only (five themes, Section 7). No user management needed.

---

## 4. Task Table — Detailed Spec

### Column Reference

| # | Column | Width hint | Notes |
|---|---|---|---|
| 1 | Sr. No | 3rem | Auto-numbered per client (or globally on Home); renumbers after reorder |
| 2 | ✓ (Done) | 2rem | Checkbox; drives `is_completed` + `status` sync (Section 8) |
| 3 | Task Name | flex-1 | Strikethrough + muted when completed; chevron for subtask expansion |
| 4 | Remarks | 12rem | Truncated with ellipsis; full text on tooltip or modal |
| 5 | Start Date | 7rem | Click → date picker |
| 6 | Due Date | 7rem | Click → date picker; color coded per Section 9 |
| 7 | Assignees | 8rem | Initials chips (max 3 visible + "+N" overflow) |
| 8 | Status | 8rem | Colored badge; click → dropdown |
| 9 | Progress | 6rem | Only rendered if task has ≥1 subtask: slim bar + "x/y" label |

### Monthly Grouping

Tasks are grouped by their **due date's calendar month** (e.g. "August 2026"). Order: chronological ascending by month. Tasks with no due date go into a trailing **"No Due Date"** group. Each month header row is collapsible (click to toggle). Group header shows count of tasks in that group.

### Subtask Expansion

Clicking the task name row (or the ▶ chevron) toggles an indented subtask section directly below:
- Each subtask: checkbox + name text
- "+ Add subtask" inline input at bottom of the expanded subtask list
- Checking/unchecking a subtask: recalculates progress bar fraction live (no server round-trip delay — optimistic update, then persist)
- Subtask completion never auto-changes parent status (see Section 8)

### Reordering

Within a month group, tasks are draggable to reorder. After drop, `sr_no` values are re-assigned sequentially across the client's full list and saved to backend.

---

## 5. Interaction Logic Rules

These are non-negotiable behavioral contracts:

### 5.1 Checkbox ↔ Status Sync

| Action | Effect |
|---|---|
| User checks ✓ | `is_completed = true`, `status = "completed"`, row gets strikethrough + muted styling |
| User unchecks ✓ | `is_completed = false`, `status = "ongoing"`, row styling restored |
| User sets Status dropdown → "Completed" | `is_completed = true`, checkbox gets checked, strikethrough applied |
| User sets Status dropdown → anything else | `is_completed = false`, checkbox unchecked |

### 5.2 Subtask Progress

- Progress = (count of `is_completed = true` subtasks) / (total subtasks)
- Shown as a slim horizontal bar + "x/y" text
- Only rendered when the task has at least 1 subtask
- **Does NOT auto-complete parent** when progress reaches 100% — parent completion is always manual

### 5.3 Inline Editing

All table cells (Name, Remarks, Dates, Assignees) are editable in place. Clicking a non-interactive cell activates an input. `Enter` or blur saves. `Escape` cancels. Changes persist via PATCH to the backend.

### 5.4 Destructive Actions

- Deleting a client: confirmation dialog — "Delete [Name]? This will permanently delete all [N] tasks and their subtasks."
- Deleting a task: single confirmation dialog.
- No undo — be clear in dialog copy.

---

## 6. Due-Date Color Rules

Applied to the **Due Date cell** and to **calendar day dots** and **Kanban card due-date text**:

| Condition | Label | Midnight hex | Daylight hex | Semantic name |
|---|---|---|---|---|
| Completed (any date) | — | `#A9A29B` | `#6B655A` | `--color-due-done` |
| No due date | — | `#A9A29B` | `#6B655A` | `--color-due-none` |
| Overdue (past, not completed) | Overdue | `#C44B3B` | `#B5342E` | `--color-due-overdue` |
| 0–2 days (due today or in 1–2 days) | Soon | `#C44B3B` | `#B5342E` | `--color-due-soon` |
| 3–6 days | Due soon | `#C9A227` | `#9E7C0A` | `--color-due-warning` |
| 7+ days | On track | `#6E7D5C` | `#516244` | `--color-due-ok` |

> Overdue and 0–2 days intentionally share the same visual urgency; the tooltip text distinguishes them ("Overdue" vs "Due in 1 day").

---

## 7. Home Banner — Full Spec

- **Visibility:** only when (today-count > 0 OR tomorrow-count > 0). Hidden when both are 0.
- **Persistence:** dismissed state stored in `sessionStorage` key `tf_banner_dismissed`. Reappears on next browser session (page refresh).
- **Copy:** "You have **{N} task{s}** due today and **{M} task{s}** due tomorrow across all clients."
- **Links:** the bold numbers are `<button>` elements that scroll to the relevant month group in the table and highlight those rows briefly (CSS flash animation, 1.5 s).
- **Dismiss:** ✕ icon top-right. Clicking hides it for the session.

---

## 8. Design Token System

### 8.1 Midnight (Default)

```css
--bg:         #1B1A17;
--surface:    #252320;
--border:     #3A362F;
--text:       #F2EFE9;
--muted:      #A9A29B;
--accent:     #B5502F;   /* Fired Clay */
--success:    #6E7D5C;
--danger:     #B5342E;

--due-overdue: #C44B3B;
--due-soon:    #C44B3B;
--due-warning: #C9A227;
--due-ok:      #6E7D5C;
--due-done:    #A9A29B;
```

### 8.2 Daylight

```css
--bg:         #F7F3EC;
--surface:    #FFFFFF;
--border:     #DDD8CF;
--text:       #242119;
--muted:      #6B655A;
--accent:     #A6532C;   /* Fired Clay — lighter rendering */
--success:    #516244;
--danger:     #B5342E;

--due-overdue: #B5342E;
--due-soon:    #B5342E;
--due-warning: #9E7C0A;
--due-ok:      #516244;
--due-done:    #6B655A;
```

### 8.3 Terracotta

```css
--bg:         #2A1A14;
--surface:    #3A2218;
--border:     #5C3828;
--text:       #F5E8DF;
--muted:      #B89080;
--accent:     #E07040;   /* Burnt Sienna */
--success:    #7A8C5C;
--danger:     #C44040;
```

### 8.4 Sage & Linen

```css
--bg:         #F4F1EB;
--surface:    #FAFAF7;
--border:     #D6D3C8;
--text:       #2C2C28;
--muted:      #7A7A6A;
--accent:     #6A8C5C;   /* Dried Sage */
--success:    #6A8C5C;
--danger:     #B5342E;
```

### 8.5 Slate Blue

```css
--bg:         #1A1D2A;
--surface:    #252838;
--border:     #363A54;
--text:       #E8EAF4;
--muted:      #9094B4;
--accent:     #5B6FA8;   /* Indigo Slate */
--success:    #5C8A6E;
--danger:     #B84040;
```

### 8.6 Typography

| Usage | Font | Weight | Size |
|---|---|---|---|
| Page titles, client names | Fraunces (serif) | 600 | 1.5–2rem |
| Category subtitles | Fraunces | 400 italic | 1rem |
| Table headers | Inter / Public Sans | 600 | 0.75rem, uppercase, tracking |
| Table body | Inter / Public Sans | 400 | 0.875rem |
| Numbers/dates | Inter | 400 | 0.875rem, `font-variant-numeric: tabular-nums` |
| Badge text | Inter | 600 | 0.75rem |

### 8.7 Spacing & Radius

```
--radius-sm:  4px
--radius-md:  8px
--radius-lg:  16px
--spacing-xs: 4px
--spacing-sm: 8px
--spacing-md: 16px
--spacing-lg: 24px
--spacing-xl: 40px
```

### 8.8 Motion

All animations: `duration: 150ms`, `easing: ease-out`. Nothing exceeds 300ms except page transitions (200ms). No gratuitous motion. Respect `prefers-reduced-motion: reduce`.

---

## 9. Empty States

| Screen | Empty state copy |
|---|---|
| Home — no tasks | "No tasks yet. Pick a client from the sidebar, or create one with + New Client." |
| Client view — no tasks | "No tasks for [Client Name] yet. Add one with the + button below." |
| Calendar — no tasks | "No tasks with due dates in [Month Year]. Tasks need a due date to appear here." |
| Overview — column empty | "Nothing here — drag a card in or change status from the task list." |

All empty states include a subtle illustration or icon (from lucide-react), never raw whitespace.

---

## 10. Seed Data

Two example clients pre-loaded so the app is not empty on first run:

**Client 1: "Skyline Residence"** (category: "3D Design", color: `#B5502F`)
- Task 1: "Initial concept renders" — Ongoing, due next week, 2 subtasks (1 done)
- Task 2: "Client revision round 1" — Not Started, due in 10 days
- Task 3: "Final deliverable export" — Not Started, no due date

**Client 2: "Oak & Marble Studio"** (category: "2D Drawings", color: `#5B6FA8`)
- Task 1: "Floor plan draft" — Completed, due date in past
- Task 2: "Elevation drawings" — Ongoing, due in 3 days
- Task 3: "Material schedule" — Not Started, due in 14 days
- Task 4: "As-built documentation" — Not Started, no due date
