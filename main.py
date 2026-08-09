# Root entry point bridge for deployment platforms (Render/Vercel/Docker)
import sys
import os

# Add backend directory to Python module search path
backend_path = os.path.join(os.path.dirname(__file__), "backend")
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from backend.main import app  # noqa: E402

__all__ = ["app"]
