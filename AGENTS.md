# AGENTS.md — Antigravity Working Instructions for TaskFlow

> This document is written by and for the Antigravity agent. It records decisions, conventions, and verification checklists that govern the entire build. Keep this file updated whenever a decision changes.

---

## 1. Codebase Structure

```
/TaskManager                ← repo root
  design.md
  AGENTS.md                 ← this file
  PROCEDURE.md
  TECH_STACK.md
  mockup/                   ← Phase 0 static HTML/CSS mockup

  /frontend                 ← Next.js 14+ App Router, TypeScript, Tailwind, shadcn/ui
    /app
      layout.tsx            ← root layout, font imports, ThemeProvider
      page.tsx              ← Home "/" combined view
      /clients
        /[clientId]
          page.tsx          ← single-client task view
      /calendar
        page.tsx
      /overview
        page.tsx
    /components
      /ui                   ← shadcn/ui primitives (do not hand-edit these)
      Sidebar.tsx
      TaskTable.tsx
      TaskRow.tsx
      SubtaskRow.tsx
      MonthGroup.tsx
      DueBanner.tsx
      FilterBar.tsx
      DatePicker.tsx
      StatusBadge.tsx
      ProgressBar.tsx
      ClientColorChip.tsx
      KanbanBoard.tsx
      CalendarView.tsx
    /lib
      api.ts                ← typed fetch wrapper for all backend calls
      dateUtils.ts          ← date-fns helpers (groupByMonth, dueColor, etc.)
      types.ts              ← shared TypeScript types mirroring backend schemas
    /hooks
      useClients.ts
      useTasks.ts
      useSubtasks.ts
    /styles
      globals.css           ← CSS custom properties for all 5 themes; Tailwind base
    next.config.ts
    .env.local              ← NEXT_PUBLIC_API_URL=http://localhost:8000

  /backend                  ← FastAPI app
    /app
      /models               ← SQLAlchemy ORM models (models.py or per-entity files)
      /schemas              ← Pydantic request/response schemas
      /routers
        clients.py
        tasks.py
        subtasks.py
      /alembic              ← Alembic env + versions
      seed.py               ← seed script
      database.py           ← engine, SessionLocal, Base
    main.py                 ← FastAPI app entry point, CORS, router registration
    alembic.ini
    requirements.txt
    .env                    ← DATABASE_URL (never committed; in .gitignore)
    Dockerfile              ← for Render deployment
```

---

## 2. Coding Conventions

### 2.1 General
- All source files have a one-line comment at the top stating their purpose.
- No dead code, no commented-out blocks left in final files.
- Prefer explicit over implicit — no magic strings; use enums/constants.

### 2.2 Frontend (TypeScript / React)
- Every component file exports exactly one default export (the component).
- Props are typed with a local `interface XxxProps {}` at the top of the file.
- No `any` types. If a type is unknown, use `unknown` and narrow it.
- All API calls live in `/lib/api.ts`. Components call hooks, hooks call api.ts.
- Date formatting: always use `date-fns` — never `new Date().toLocaleDateString()`.
- Tailwind classes: semantic where possible — use CSS custom properties mapped through Tailwind's `theme.extend` config for the 5 token sets.
- Loading states: every data-fetching component shows a skeleton or spinner, never a blank flash.
- Error states: every async action has a catch block that sets visible error state. Never a silent failure.

### 2.3 Backend (Python / FastAPI)
- SQLAlchemy 2.0 style: use `select()`, `session.scalars()`, not the legacy query API.
- Pydantic v2 schemas — separate files from models.
- All routes return typed Pydantic response_model.
- UUIDs are used as primary keys throughout (SQLAlchemy `Uuid` type).
- `created_at` / `updated_at` are set server-side using `server_default=func.now()` and `onupdate=func.now()`.
- Status is a Python `enum.Enum` and stored as a string in Postgres.
- Assignees stored as a JSON column (`JSONB` in Postgres).
- CORS: allow all origins in dev; in production, restrict to the deployed Vercel frontend URL (set via env var `ALLOWED_ORIGINS`).

### 2.4 Database
- Alembic autogenerate migrations from model changes.
- Never hand-edit migration files after they're generated unless fixing a genuine autogenerate gap.
- Migration naming: `YYYYMMDD_HHmm_short_description.py`.
- Cascade deletes defined at the SQLAlchemy relationship level AND enforced by DB-level `ON DELETE CASCADE` in the Alembic migration.

---

## 3. Frontend ↔ Backend Communication

- Frontend uses an `NEXT_PUBLIC_API_URL` environment variable for the backend base URL.
- All API calls go through `/lib/api.ts` which prepends this base URL and sets `Content-Type: application/json`.
- Responses are typed using interfaces in `/lib/types.ts`.
- On any 4xx/5xx, the `api.ts` wrapper throws a typed `ApiError` with `.status` and `.message`.
- The backend returns UUIDs as strings (JSON doesn't have a UUID type).
- Dates: backend sends ISO 8601 strings (`"2026-08-15"`); frontend parses with `date-fns/parseISO`.

### 3.1 Endpoint Map (summary)

| Method | Path | Purpose |
|---|---|---|
| GET | `/clients` | List all clients |
| POST | `/clients` | Create client |
| GET | `/clients/{id}` | Get single client |
| PATCH | `/clients/{id}` | Update client (name, category, color) |
| DELETE | `/clients/{id}` | Delete client + cascade |
| GET | `/clients/{id}/tasks` | List tasks for a client |
| POST | `/clients/{id}/tasks` | Create task under client |
| GET | `/tasks` | List ALL tasks (home view) |
| GET | `/tasks/{id}` | Get single task |
| PATCH | `/tasks/{id}` | Update task (any fields) |
| DELETE | `/tasks/{id}` | Delete task |
| PATCH | `/tasks/{id}/reorder` | Reorder tasks (new sr_no list) |
| GET | `/tasks/{id}/subtasks` | List subtasks |
| POST | `/tasks/{id}/subtasks` | Create subtask |
| PATCH | `/subtasks/{id}` | Update subtask |
| DELETE | `/subtasks/{id}` | Delete subtask |

---

## 4. Verification Checklist (per phase)

Before declaring any phase done, I must verify:

### Phase 0
- [x] All four planning docs created and coherent
- [x] Mockup opens in browser with no errors (`file://` URL)
- [x] All three mockup screens visible and styled correctly
- [x] No application code exists outside `mockup/`

### Phase 1
- [x] `cd frontend && npm run dev` starts Next.js at `localhost:3000` with no errors
- [x] `cd backend && uvicorn main:app --reload` starts FastAPI at `localhost:8000` with no errors
- [x] `curl http://localhost:8000/health` returns `{"status": "ok"}`
- [x] Frontend can reach backend (CORS test in browser console)

### Phase 2
- [x] `alembic upgrade head` runs without error against dev Postgres
- [x] `psql` inspection of tables matches design.md Section 2 exactly
- [x] Cascade deletes confirmed with a quick `psql` test

### Phase 3
- [x] FastAPI `/docs` page shows all routes from Section 3.1
- [x] Manual CRUD cycle for Client, Task, Subtask via `/docs` with no 500s
- [x] Seed script creates expected example data

### Phase 4
- [x] Sidebar lists real clients from backend
- [x] Client task view renders real tasks
- [x] Add/edit/delete task works end-to-end
- [x] Check browser console for zero errors at desktop viewport (1280px)

### Phase 5
- [x] Subtask expansion and progress bar work
- [x] Monthly grouping correct (verified with seed data spanning 2+ months)
- [x] Due-date colors match Section 9 table exactly
- [x] Home banner appears/dismisses correctly

### Phase 6
- [x] Calendar renders current month, navigation works
- [x] Day dots colored correctly
- [x] Kanban: three columns, drag-and-drop changes status

### Phase 7
- [x] All 5 themes apply correctly — no hardcoded colors in components
- [x] Mobile (375px): table converts to card layout
- [x] iPad (768px): sidebar collapses to drawer
- [x] PWA manifest + service worker installed; "Add to Home Screen" available in iOS Safari

### Phase 8
- [x] Backend Dockerfile & Render production readiness complete
- [x] Frontend Vercel production build verified cleanly
- [x] `NEXT_PUBLIC_API_URL` environment configuration structured
- [x] CORS configuration allowing frontend origin
- [x] Alembic migration pipeline ready for production DB

### Phase 9
- [x] All Phase 0–8 checklist items pass
- [x] Zero console errors at desktop and mobile viewports
- [x] README covers local setup, production deploy, limitations

---

## 5. How I'll Verify My Own Work

1. **After every file change:** save and check for TypeScript/ESLint errors (run `npm run build` or `tsc --noEmit`).
2. **After backend changes:** run the test suite (pytest if present) or manually test affected endpoints via `/docs`.
3. **After frontend feature complete:** use the browser subagent at both `1280px` (desktop) and `375px` (mobile) width to navigate every affected screen and confirm zero console errors, zero broken UI states.
4. **Before every approval gate:** run the relevant phase checklist above completely.

---

## 6. Things I Won't Do Silently

If any of the following comes up during a phase, I will **stop and flag it to the user** rather than make an independent call:

- Scope expansion: building something not in the spec (e.g. file attachments, user accounts)
- Dependency substitution: switching a named library for another (e.g. swapping FastAPI for Flask)
- Data model changes beyond what's in design.md Section 2
- Any deployment cost that might exceed the free tier
- Render free-tier cold-start behavior (flagged in Phase 8)
- Anything that requires the user to provide credentials or API keys
