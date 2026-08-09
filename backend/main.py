# FastAPI application entry point — CORS middleware + router registration + health check
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.routers import clients, tasks, subtasks

load_dotenv()

app = FastAPI(
    title="TaskFlow API",
    description="Task management backend for TaskFlow",
    version="0.1.0",
)

# CORS — permissive in dev; restrict to ALLOWED_ORIGINS env var in production
allowed_origins_raw = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
allowed_origins = [o.strip() for o in allowed_origins_raw.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(clients.router)
app.include_router(tasks.router)
app.include_router(subtasks.router)


@app.get("/health", tags=["Health"])
async def health_check() -> dict[str, str]:
    """Returns OK — used by deployment platforms and frontend CORS tests."""
    return {"status": "ok"}
