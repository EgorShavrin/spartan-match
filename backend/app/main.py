"""
Application entrypoint.

Deliberately thin. This file only wires things together:

  * create the FastAPI app
  * allow the frontend to call it (CORS)
  * create tables and seed data on startup
  * register the routers

No business logic, no SQL, no scoring.

Run with:   uvicorn app.main:app --reload
"""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .database import create_db_and_tables
from .routers import matches, members, projects
from .seed import seed_database

# --------------------------------------------------------------------------
# CORS
#
# A browser will happily let a page on http://localhost:3000 call the API on
# http://localhost:8000, but it will then *hide the response* from our
# JavaScript unless the API replies with a header saying that origin is
# allowed. Different port means different origin, so this is required even
# though both run on the same machine.
#
# To add a deployed frontend later, set the environment variable:
#   FRONTEND_ORIGINS="https://spartan-match.vercel.app"
# --------------------------------------------------------------------------

DEFAULT_ORIGINS = "http://localhost:3000,http://127.0.0.1:3000"
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("FRONTEND_ORIGINS", DEFAULT_ORIGINS).split(",")
    if origin.strip()
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Runs once when the server starts, before it accepts any request."""
    create_db_and_tables()
    seed_database()
    yield
    # Nothing to tear down: SQLite connections close with the process.


app = FastAPI(
    title="SpartanMatch API",
    description="Ranks club members against project requirements and explains why.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    # Matches Vercel preview deployments, which get a new subdomain each push.
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(members.router)
app.include_router(projects.router)
app.include_router(matches.router)


@app.get("/health", tags=["health"])
def health():
    """Liveness check. The frontend uses this to tell 'backend is down' apart
    from 'there is simply no data yet'."""
    return {"status": "ok"}
