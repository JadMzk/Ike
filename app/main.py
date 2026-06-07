"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.config import settings
from app.database import Base, engine

# Importing the models is required so that Base.metadata knows about them
# before create_all() runs.
from app.models import (  # noqa: F401
    allowed_email_model,
    profile_model,
    task_model,
    user_category_resistance_model,
    user_model,
)
from app.routers import auth_router, me_router, task_router, user_router


app = FastAPI(title=settings.APP_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# Idempotent column additions for fields introduced after the initial
# create_all() runs. SQLAlchemy's create_all only creates *missing tables*,
# never alters existing ones, so we do these by hand for the MVP.
# `ADD COLUMN IF NOT EXISTS` requires Postgres 9.6+.
#
# TODO(prod): replace with Alembic migrations.
_MVP_ALTERS = (
    "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed BOOLEAN NOT NULL DEFAULT FALSE",
    "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ",
    "CREATE INDEX IF NOT EXISTS ix_tasks_completed ON tasks (completed)",
    "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS category VARCHAR(64) NOT NULL DEFAULT 'personal'",
    "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS initial_effort DOUBLE PRECISION NOT NULL DEFAULT 5.0",
    "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS resistance_factor DOUBLE PRECISION NOT NULL DEFAULT 0.5",
    "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS profile_id UUID",
    "ALTER TABLE tasks ALTER COLUMN user_id DROP NOT NULL",
    "CREATE INDEX IF NOT EXISTS ix_tasks_profile_id ON tasks (profile_id)",
)


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    with engine.begin() as conn:
        for stmt in _MVP_ALTERS:
            conn.execute(text(stmt))


@app.get("/health", tags=["meta"])
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(auth_router.router)
app.include_router(me_router.router)
app.include_router(task_router.router)
app.include_router(user_router.router)
