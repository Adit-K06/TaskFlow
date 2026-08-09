# PROCEDURE.md — TaskFlow Phase-by-Phase Build Plan

> Adapted from Section 2 of the build prompt. This is the authoritative sequence of work. Each phase ends at an **approval gate** — no next phase starts until the client explicitly approves.

---

## Why This Order?

The sequence moves from abstract (docs → visual mockup) to concrete (scaffolding → database → API → frontend) to polish (features → themes → deployment). Each phase validates the previous before adding more complexity. The backend is built and verified independently before the frontend is wired to it — this prevents the common failure mode of debugging both layers simultaneously.

---

## Phase 0 — Planning Docs + Static Mockup
**Status:** In progress → Approval gate

**What gets built:**
- `design.md` — full product + technical design document
- `AGENTS.md` — this agent's working instructions and conventions
- `PROCEDURE.md` — this file
- `TECH_STACK.md` — exact stack with rationale
- `mockup/` — static HTML/CSS mockup of three screens (no JS, no backend, file:// openable):
  - Screen 1: Home dashboard (banner + monthly-grouped task table)
  - Screen 2: Single client's task view (with subtask expansion example)
  - Screen 3: Sidebar detail (client list, color chips, nav links)

**Why only this:**
Everything downstream depends on the visual direction and data model being agreed on. Building these upfront prevents costly redesigns mid-build. The mockup is static so there's no risk of prematurely locking in code decisions.

**Approval gate criteria:**
- All four docs created and accurate
- Mockup opens in any browser via `file://` without errors
- Design direction approved by client

---

## Phase 1 — Project Scaffolding
**Status:** Not started — awaiting Phase 0 approval

**What gets built:**
- `/frontend`: `npx create-next-app@latest` with TypeScript, Tailwind, App Router, src/ disabled; shadcn/ui initialized; lucide-react installed; `date-fns` installed
- `/backend`: Python virtual environment; FastAPI, SQLAlchemy 2.0, Alembic, psycopg (psycopg3), python-dotenv installed; `requirements.txt` committed
- A `/health` GET route on the backend returning `{"status": "ok"}`
- CORS middleware on the backend (permissive in dev)
- `.env.local` stub in frontend; `.env` stub in backend (gitignored)
- Basic `README.md` with local setup instructions stub (to be filled in Phase 9)

**Why before features:**
Both projects need to be proven runnable and able to talk to each other before a single feature is wired up. Debugging a blank-screen install issue mid-feature is painful.

**Approval gate criteria:**
- `npm run dev` starts Next.js at `localhost:3000` with no errors
- `uvicorn main:app --reload` starts FastAPI at `localhost:8000` with no errors
- `GET /health` returns `{"status": "ok"}`
- Browser fetch from Next.js to FastAPI succeeds (CORS confirmed)

---

## Phase 2 — Database Design
**Status:** Not started — awaiting Phase 1 approval

**What gets built:**
- SQLAlchemy models in `/backend/app/models/` exactly matching `design.md` Section 2
- Alembic initialized; `alembic.ini` and `env.py` configured to use `DATABASE_URL` from `.env`
- Initial migration generated with `alembic revision --autogenerate`
- Migration applied to a local dev Postgres instance with `alembic upgrade head`
- DB-level `ON DELETE CASCADE` confirmed in the migration SQL

**Note on database choice for Phase 2:**
Development uses a local Postgres instance (Docker or native install). Neon is the production target (Phase 8). The connection string format is identical — switching is just changing `DATABASE_URL` in `.env`.

**Approval gate criteria:**
- `alembic upgrade head` runs without error
- Schema inspection (`\d` in psql) matches design.md exactly
- Inserting a Client and deleting it cascades to its Tasks and Subtasks

---

## Phase 3 — Backend API
**Status:** Not started — awaiting Phase 2 approval

**What gets built:**
- Pydantic v2 schemas in `/backend/app/schemas/` for Client, Task, Subtask (request create, request update, response)
- FastAPI routers: `clients.py`, `tasks.py`, `subtasks.py`
- All CRUD endpoints from AGENTS.md Section 3.1
- `GET /tasks` (all tasks, used by home view) with optional `?client_id=` filter
- Seed script `backend/app/seed.py` that creates the two example clients from design.md Section 10
- All endpoints tested via FastAPI's automatic `/docs` UI

**Why test backend before touching frontend:**
Isolating the backend at this stage means any bug found is definitely a backend bug — no need to chase it through two layers.

**Approval gate criteria:**
- All routes visible in `/docs`
- Full CRUD cycle tested for Client, Task, Subtask manually
- Seed script populates example data correctly
- Zero 500 errors on valid input

---

## Phase 4 — Core Frontend
**Status:** Not started — awaiting Phase 3 approval

**What gets built:**
- CSS custom properties for Midnight theme (default) in `globals.css`; Tailwind extended with token values
- `Sidebar.tsx`: real client list from `GET /clients`, "+ New Client" inline form, "⋯" menu (rename/delete with confirm dialog)
- `TaskTable.tsx` + `TaskRow.tsx`: renders task list from backend, monthly grouping, status badge, due-date colors
- Home page (`/`) wired to `GET /tasks`
- Client page (`/clients/[clientId]`) wired to `GET /clients/{id}/tasks`
- Add task (inline row at bottom of current month group)
- Edit task (inline edit on cell click, PATCH on blur)
- Delete task (confirm dialog, DELETE request)
- Loading skeletons on all data-fetching surfaces
- Zero console errors at 1280px viewport (verified via browser agent)

**Why not all features at once:**
Core CRUD must be solid before building features on top of it. Bugs in the table row are much cheaper to fix before subtasks, drag-and-drop, and calendar are added.

**Approval gate criteria:**
- Sidebar shows real clients with color chips
- Tasks load and display with correct grouping
- Add/edit/delete all work end-to-end
- Zero console errors at desktop viewport

---

## Phase 5 — Feature Build-Out
**Status:** Not started — awaiting Phase 4 approval

**What gets built:**
- Subtask expansion (chevron toggle, subtask rows, inline add)
- Progress bar computed from subtask completion, optimistic update
- Checkbox ↔ Status sync (both directions, Section 8)
- Due-date colors (all 6 cases, Section 9)
- Home page banner (dismissible, counts today/tomorrow tasks)
- Filter bar (Status multi-select, date ranges, clear button)
- Monthly collapsible group headers with task count
- Task drag-and-drop reorder within month group

**Approval gate criteria:**
- Subtask progress bar is accurate and live
- Checkbox↔status sync works both directions
- Due-date colors match spec exactly (test with seed data + manually set dates)
- Banner appears with correct counts, dismisses, returns next session
- Filters reduce table rows correctly, clear button resets

---

## Phase 6 — Calendar and Kanban Overview
**Status:** Not started — awaiting Phase 5 approval

**What gets built:**
- `/calendar` page: real month-view grid, prev/next, Today button, client filter dropdown
- Day cells with colored task dots per Section 9 rules
- Click-day panel listing tasks for that day
- `/overview` page: Kanban board, three status columns, drag-and-drop changes status (calls PATCH /tasks/{id})
- Client filter dropdown on Overview

**Approval gate criteria:**
- Calendar renders correctly for current month
- Day cells show dots for tasks with due dates
- Kanban drag-and-drop correctly updates task status (verify in backend)
- Client filter works on both pages

---

## Phase 7 — Theming + Responsive + PWA
**Status:** Not started — awaiting Phase 6 approval

**What gets built:**
- All 5 themes fully implemented as CSS custom property sets (design.md Section 8)
- Theme switcher in Settings accessible from sidebar gear icon
- Theme persisted in `localStorage`
- Full responsive pass:
  - Mobile (≤430px): task table → card layout, sidebar → bottom drawer or hamburger
  - Tablet (768–1024px): sidebar collapses to icon rail or overlay drawer
  - Desktop (1280px+): full layout as designed
- Verification at iPhone 375px and iPad 768px specifically
- PWA: `manifest.json` (name, icons, theme_color), service worker with basic cache-first strategy
- "Add to Home Screen" tested on iOS Safari simulator or device if available

**Approval gate criteria:**
- All 5 themes visually distinct and token-consistent
- Mobile (375px): usable one-handed, no horizontal scroll on main content
- iPad (768px): sidebar behaves correctly
- PWA manifest present; Lighthouse PWA score ≥ 90
- Zero console errors at all three viewports

---

## Phase 8 — Deployment
**Status:** Not started — awaiting Phase 7 approval

**What gets built:**
- Neon database created; production schema applied via `alembic upgrade head`; seed data loaded
- Backend deployed to Render Web Service: Dockerfile, `DATABASE_URL` env var, `ALLOWED_ORIGINS` env var
- Frontend deployed to Vercel: `NEXT_PUBLIC_API_URL` env var pointing at Render URL
- CORS verified in production
- Both live URLs confirmed working end-to-end

**Flag:** Will check Render free-tier cold-start (30–60s) and report to client whether Railway is a better alternative for daily use.

**Approval gate criteria:**
- Frontend live URL loads with real seed data
- Add a client/task on the live frontend — persists in Neon DB
- No CORS errors in browser console

---

## Phase 9 — End-to-End Verification + README + Handover
**Status:** Not started — awaiting Phase 8 approval

**What gets built:**
- Full pass through Definition of Done checklist (build prompt Section 15)
- Browser agent verification at desktop and mobile viewports on production URLs
- `README.md` covering: prerequisites, local setup, environment variables, running the app, deployment instructions, known limitations
- Any bugs found during verification are fixed before this phase is declared done

**No approval gate** — this is the final phase. However, any bugs found that require significant changes will be flagged before fixing.
