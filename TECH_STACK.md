# TECH_STACK.md — TaskFlow Exact Technology Choices

> Every choice here was picked deliberately. This document explains what, which version, and why — so future maintainers understand the reasoning, not just the result.

---

## Frontend

### Next.js 14+ (App Router)
**Version:** `next@14.x` (latest stable 14)
**Why:** App Router is the modern Next.js architecture — React Server Components reduce client-side JS bundle size for the initial table render, and the file-based routing fits the three-page structure (home, client view, calendar, overview) cleanly. Version 14 is stable and well-supported by Vercel (the deployment target). The Pages Router would also work but App Router is the direction Next.js is investing in.

### TypeScript
**Version:** `typescript@5.x`
**Why:** The frontend makes many API calls with structured JSON. TypeScript catches type mismatches at build time — essential for fields like `status` (enum), `assignees` (string array), and dates (ISO strings that need parsing). Without it, silent type bugs would be common. All components, hooks, and API utilities are typed.

### Tailwind CSS
**Version:** `tailwindcss@3.x` (not v4 — shadcn/ui compatibility is most tested on v3)
**Why:** Utility-first CSS pairs well with the component-heavy structure. The five-theme token system is implemented as CSS custom properties (in `globals.css`) and mapped into Tailwind's `theme.extend` config — so components use token-aware class names like `bg-surface` rather than hardcoded colors. Tailwind also provides built-in responsive breakpoint utilities needed for the mobile/tablet pass in Phase 7.

### shadcn/ui
**Version:** latest (shadcn/ui is not a versioned npm package — it's a CLI that copies component source files)
**Why:** Provides accessible, headless UI primitives — Dialog, DropdownMenu, Popover (for the date picker), Badge — that would take significant time to build accessibly from scratch. Importantly, shadcn copies the component source into the repo, so it's fully customizable to match the design tokens. It is NOT a component library with a conflicting design system imposed on top of our tokens.
**Note:** shadcn/ui components will be edited to use CSS custom properties for colors rather than their default Tailwind color palette.

### lucide-react
**Version:** `lucide-react@latest`
**Why:** Consistent, well-maintained icon set. Clean SVG output with tree-shaking. Used throughout: chevrons, dots, calendar icons, drag handles, settings gear. No alternative needed.

### date-fns
**Version:** `date-fns@3.x`
**Why:** Lightweight, tree-shakeable date utility library. Used for: parsing ISO date strings, computing relative days (for due-date color rules), formatting month group headers, calendar grid generation. Not moment.js (too heavy), not Day.js (less TypeScript-native), not native `Intl` (too verbose for this volume of date work).

---

## Backend

### Python
**Version:** `3.11+`
**Why:** Stable, well-supported. FastAPI and SQLAlchemy 2.0 both require 3.9+; 3.11 gives better performance and cleaner error messages than 3.10. 3.12 is also fine; 3.11 is used for compatibility with Render's default runtime.

### FastAPI
**Version:** `fastapi@0.111.x` (latest stable)
**Why:** Native async support, automatic OpenAPI docs (`/docs`), Pydantic v2 integration, and excellent DX. The `/docs` page is the primary manual testing tool during Phase 3. Flask would also work but FastAPI's automatic schema validation and docs generation make the Phase 3 gate significantly easier to verify. Alternatives considered: Django REST Framework (too heavy), Flask (no automatic docs/validation), Litestar (less community adoption).

### SQLAlchemy 2.0
**Version:** `sqlalchemy@2.0.x`
**Why:** 2.0 "style" (using `select()` and `session.scalars()`) is the modern, type-safe way to write ORM queries — it integrates well with async (if needed later) and produces cleaner code than the 1.x `session.query()` API. The 1.x legacy query API is explicitly avoided per AGENTS.md conventions.

### Alembic
**Version:** `alembic@1.x` (latest)
**Why:** The official migration tool for SQLAlchemy. `alembic revision --autogenerate` diffs the SQLAlchemy models against the live database and generates migration files. This is the only safe way to evolve the schema over the app's life — especially important since Phase 8 runs migrations against a production Neon database.

### psycopg (psycopg3)
**Version:** `psycopg@3.x` (`pip install psycopg[binary]`)
**Why:** The modern PostgreSQL driver for Python. Neon's documentation explicitly supports `postgresql+psycopg` as the connection string driver prefix. psycopg2 is the classic alternative but psycopg3 has better async support and is the future-facing choice. The `[binary]` extra avoids needing to compile C extensions on Render.

### Pydantic v2
**Version:** `pydantic@2.x` (bundled with FastAPI 0.111+)
**Why:** Pydantic v2 (Rust-core rewrite) is significantly faster than v1 and is the default for FastAPI 0.100+. Schemas are defined separately from SQLAlchemy models — the ORM models handle persistence, the Pydantic schemas handle serialization and validation. The two layers are intentionally kept separate (see AGENTS.md Section 2.3).

### python-dotenv
**Version:** `python-dotenv@1.x`
**Why:** Loads `DATABASE_URL` and `ALLOWED_ORIGINS` from `.env` in local development. Simple and standard. No secrets are ever committed to git.

---

## Database

### PostgreSQL via Neon
**Why Postgres:** SQLAlchemy and Alembic are most mature with Postgres. The `JSONB` column type (used for `assignees`) is a first-class Postgres feature. All the array/JSON ORM patterns in design.md are tested and documented against Postgres.

**Why Neon specifically:** Free tier with no credit card required — matches the client's budget constraint. Neon provides a standard `postgresql://` connection string that works directly with `sqlalchemy+psycopg`. Neon also provides connection pooling (the pooled connection string) which is important because Render's free tier may have many cold-start connections. Alternative considered: Supabase (also free, also Postgres) — either works; Neon is slightly simpler to set up without needing their full platform features.

**Connection string format:**
```
postgresql+psycopg://user:password@host/dbname?sslmode=require
```

---

## Deployment

### Vercel (Frontend)
**Tier:** Free Hobby
**Why:** Next.js is built by Vercel — zero-config deployment. `NEXT_PUBLIC_API_URL` set as an environment variable in the Vercel project dashboard. Free tier is sufficient for this client's usage volume. Automatic preview deployments on every git push are a bonus for iteration.

### Render (Backend)
**Tier:** Free Web Service
**Why:** Free tier supports Python/FastAPI. Docker-based deploy gives full control over runtime. Environment variables set in the Render dashboard (no secrets in git).
**Known limitation:** Free tier instances spin down after 15 minutes of inactivity. Cold start time is approximately 30–60 seconds. This will be flagged to the client during Phase 8 with Railway as an alternative if this is unacceptable for daily use. Railway's free tier ($5/month credit) keeps instances warm.

### Dockerfile (Backend)
Simple `python:3.11-slim` base image:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## PWA

### web-app manifest + Service Worker
**Why:** The client runs an interior design company and may want to "install" the app on their iPad or iPhone for quick access without opening a browser. The PWA manifest enables "Add to Home Screen" on iOS Safari. The service worker uses a basic cache-first strategy for static assets so the app loads fast on repeat visits. No complex offline sync — tasks require a backend connection to be useful.

---

## Version Summary Table

| Package | Version | Layer |
|---|---|---|
| next | ^14.2.0 | Frontend |
| typescript | ^5.4.0 | Frontend |
| tailwindcss | ^3.4.0 | Frontend |
| shadcn/ui | latest (CLI) | Frontend |
| lucide-react | ^0.400.0 | Frontend |
| date-fns | ^3.6.0 | Frontend |
| fastapi | ^0.111.0 | Backend |
| sqlalchemy | ^2.0.30 | Backend |
| alembic | ^1.13.0 | Backend |
| psycopg[binary] | ^3.1.19 | Backend |
| pydantic | ^2.7.0 | Backend |
| python-dotenv | ^1.0.1 | Backend |
| Python runtime | 3.11+ | Backend |
| PostgreSQL | 16 (Neon) | Database |
