"""Application configuration loaded from environment variables."""

import os

from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Centralised access to env-driven settings."""

    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    APP_NAME: str = os.getenv("APP_NAME", "Ike - Task Landscape API")

    def __init__(self) -> None:
        if not self.DATABASE_URL:
            raise RuntimeError(
                "DATABASE_URL is not set. Add it to your .env file."
            )


settings = Settings()
