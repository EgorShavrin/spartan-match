"""
Database setup: one SQLite file, one engine, one session helper.

SQLite is a single file on disk, so there is nothing to install and the whole
database can be deleted by removing `backend/spartanmatch.db`.
"""

from pathlib import Path

from sqlmodel import Session, SQLModel, create_engine

# Store the database next to the `app` package (backend/spartanmatch.db) so it
# does not matter which directory uvicorn is started from.
DB_PATH = Path(__file__).resolve().parent.parent / "spartanmatch.db"
DATABASE_URL = f"sqlite:///{DB_PATH}"

# check_same_thread=False is required because FastAPI may serve requests from
# different threads while SQLite defaults to refusing cross-thread use.
engine = create_engine(
    DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False},
)


def create_db_and_tables() -> None:
    """Create any tables that do not exist yet. Safe to call on every startup."""
    # Importing models registers them on SQLModel.metadata before create_all.
    from . import models  # noqa: F401

    SQLModel.metadata.create_all(engine)


def get_session():
    """
    FastAPI dependency that hands each request its own database session.

    The `yield` gives the session to the route function; the surrounding
    `with` block closes it afterwards, even if the route raised.
    """
    with Session(engine) as session:
        yield session
