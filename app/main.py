"""FastAPI application entry point."""

from fastapi import FastAPI
from sqlalchemy import text

from app.config import settings
from app.database import Base, engine

# Importing the models is required so that Base.metadata knows about them
# before create_all() runs.
from app.models import task_model, user_model  # noqa: F401
from app.routers import task_router, user_router


app = FastAPI(title=settings.APP_NAME)


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


app.include_router(user_router.router)
app.include_router(task_router.router)
