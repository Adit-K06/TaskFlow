# TaskFlow — Interior Design Task Manager

> A bespoke, material-inspired task management web application designed for interior design studios to track client projects, tasks, deadlines, and granular subtask progress.

---

## 🎨 Key Features

- **Client-Centric Workspace**: Organize tasks by clients with custom color chips and categories.
- **Dynamic Views**:
  - **Home (`/`)**: Combined list across all clients, featuring an intelligent Due Date banner (Overdue, Due Today, Due Tomorrow).
  - **Overview (`/overview`)**: 3-column drag-and-drop Kanban Board (Not Started, Ongoing, Completed).
  - **Calendar (`/calendar`)**: Interactive month view with day cells and client-colored task due pills.
- **On-Spot Inline Editing**: Click to edit task names, remarks, start/due dates, assignees, and status directly in the list.
- **Progress Tracking**: Real-time percentage progress bar driven by backend subtask completion stats.
- **Themed UI**: 5 curated theme options (*Midnight*, *Daylight*, *Terracotta*, *Sage*, *Slate*) with custom surface tokens and themed confirmation dialogs.
- **PWA & Mobile Support**: Responsive mobile drawer navigation, card stack layout on small viewports, service worker caching, and installable PWA manifest.

---

## 🛠️ Prerequisites

- **Node.js**: 18.x or higher
- **Python**: 3.11 or higher
- **PostgreSQL**: 16+ (local dev) or Neon PostgreSQL (production)

---

## 🚀 Local Development

### 1. Backend (FastAPI)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start FastAPI server
uvicorn main:app --reload
# → API: http://localhost:8000
# → Docs: http://localhost:8000/docs
```

### 2. Frontend (Next.js 14)

```bash
cd frontend
npm install

# Start development server
npm run dev
# → Web App: http://localhost:3000
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+psycopg://user:pass@localhost:5432/taskflow` |
| `ALLOWED_ORIGINS` | CORS origins allowed to access backend | `http://localhost:3000,https://taskflow.vercel.app` |

### Frontend (`frontend/.env.local`)

| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend base URL for API requests | `http://localhost:8000` |

---

## 🌐 Production Deployment Guide

### 1. Database (Neon PostgreSQL)
1. Create a PostgreSQL database on [Neon.tech](https://neon.tech).
2. Copy the database connection string (`DATABASE_URL`).
3. Run Alembic migrations against production DB:
   ```bash
   DATABASE_URL="postgresql+psycopg://user:pass@ep-xyz.neon.tech/neondb?sslmode=require" alembic upgrade head
   ```

### 2. Backend Deployment (Render)
1. Create a new **Web Service** on [Render.com](https://render.com) connected to your GitHub repository.
2. Select **Docker** environment (uses `backend/Dockerfile`).
3. Set environment variables in Render:
   - `DATABASE_URL`: Your Neon database URL.
   - `ALLOWED_ORIGINS`: `https://your-app.vercel.app`
4. Deploy service and copy the live Render service URL (`https://taskflow-api.onrender.com`).

### 3. Frontend Deployment (Vercel)
1. Import the `frontend` folder into [Vercel](https://vercel.com).
2. Configure Environment Variable:
   - `NEXT_PUBLIC_API_URL`: `https://taskflow-api.onrender.com`
3. Deploy!

---

## 📋 Verification Checklist

- [x] All 5 themes apply correctly using CSS custom properties (`[data-theme]`)
- [x] Inline editing for task attributes (name, remarks, dates, assignees, status)
- [x] Server-calculated subtask progress bars render on creation
- [x] Themed modal confirmation for destructive actions (task/client deletion)
- [x] Interactive Kanban board drag-and-drop
- [x] Interactive Calendar month view with day task popovers
- [x] Responsive layout with mobile top navbar and drawer
- [x] Progressive Web App (PWA) manifest and Service Worker installation
