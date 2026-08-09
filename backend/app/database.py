# Database engine, session factory, and declarative Base for all ORM models
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")

engine = create_engine(DATABASE_URL, echo=False)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """All ORM models inherit from this Base."""
    pass


def get_db():
    """FastAPI dependency — yields a DB session and ensures it is closed."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
