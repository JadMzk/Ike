"""FastAPI application entry point."""

from fastapi import FastAPI

from app.config import settings
from app.database import Base, engine

# Importing the models is required so that Base.metadata knows about them
# before create_all() runs.
from app.models import task_model, user_model  # noqa: F401
from app.routers import task_router, user_router


app = FastAPI(title=settings.APP_NAME)


@app.on_event("startup")
def on_startup() -> None:
    # MVP-only: auto-create tables. For production, switch to Alembic migrations.
    Base.metadata.create_all(bind=engine)


@app.get("/health", tags=["meta"])
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(user_router.router)
app.include_router(task_router.router)
