"""Application configuration loaded from environment variables."""

import os

from dotenv import load_dotenv

load_dotenv()


def _parse_email_set(raw: str) -> frozenset[str]:
    if not raw.strip():
        return frozenset()
    return frozenset(
        part.strip().lower() for part in raw.split(",") if part.strip()
    )


class Settings:
    """Centralised access to env-driven settings."""

    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    APP_NAME: str = os.getenv("APP_NAME", "Ike - Task Landscape API")

    # Supabase Auth — JWT secret from Dashboard → Settings → API → JWT Secret
    SUPABASE_JWT_SECRET: str = os.getenv("SUPABASE_JWT_SECRET", "")

    # Private beta: comma-separated allowlist and/or rows in `allowed_emails`.
    # Set BETA_OPEN=true only for local development.
    BETA_OPEN: bool = os.getenv("BETA_OPEN", "false").lower() in ("1", "true", "yes")
    BETA_ALLOWED_EMAILS: str = os.getenv("BETA_ALLOWED_EMAILS", "")

    def __init__(self) -> None:
        if not self.DATABASE_URL:
            raise RuntimeError(
                "DATABASE_URL is not set. Add it to your .env file."
            )

    @property
    def beta_allowed_email_set(self) -> frozenset[str]:
        return _parse_email_set(self.BETA_ALLOWED_EMAILS)


settings = Settings()
