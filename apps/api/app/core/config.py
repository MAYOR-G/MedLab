"""Application configuration using Pydantic Settings."""

from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # General API Configuration
    APP_ENV: str = "development"
    APP_NAME: str = "MedLab API"
    API_V1_PREFIX: str = "/api/v1"
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"

    # Database
    DATABASE_URL: str = Field(
        default="postgresql+psycopg://postgres:postgres@127.0.0.1:54322/postgres",
        description="PostgreSQL database connection URL",
    )

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def normalize_database_url(cls, v: str) -> str:
        if isinstance(v, str):
            if v.startswith("postgres://"):
                return "postgresql+psycopg://" + v[len("postgres://"):]
            if v.startswith("postgresql://") and not v.startswith("postgresql+"):
                return "postgresql+psycopg://" + v[len("postgresql://"):]
        return v

    # Supabase Auth & Storage
    SUPABASE_URL: str = "https://your-project.supabase.co"
    SUPABASE_ANON_KEY: str = "anon-key-placeholder"
    SUPABASE_JWT_SECRET: str = "jwt-secret-placeholder"
    SUPABASE_JWKS_URL: str = (
        "https://your-project.supabase.co/auth/v1/.well-known/jwks.json"
    )
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_STORAGE_BUCKET: str = "medical-documents"

    # CORS
    FRONTEND_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"
    FRONTEND_ORIGIN_REGEX: str | None = None

    # OpenRouter AI Gateway
    OPENROUTER_API_KEY: str = "openrouter-placeholder"
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENROUTER_DEFAULT_MODEL: str = "anthropic/claude-3.5-sonnet"
    OPENROUTER_FALLBACK_MODEL: str = "openai/gpt-4o-mini"
    OPENROUTER_TIMEOUT_SECONDS: int = 45
    AI_MAX_INPUT_TOKENS: int = 8000
    AI_MAX_OUTPUT_TOKENS: int = 2000
    AI_MAX_RETRIES: int = 2

    # Uploads & Limits
    UPLOAD_MAX_BYTES: int = 26214440  # 25 MB
    UPLOAD_ALLOWED_MIME_TYPES: str = "application/pdf,image/png,image/jpeg"
    SHARE_TOKEN_TTL_DEFAULT: int = 86400  # 24 hours

    # Background Worker
    WORKER_POLL_INTERVAL_SECONDS: int = 2
    WORKER_CONCURRENCY: int = 2
    WORKER_HEARTBEAT_TIMEOUT_SECONDS: int = 120

    @property
    def allowed_origins_list(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.FRONTEND_ORIGINS.split(",")
            if origin.strip()
        ]

    @property
    def allowed_mime_types_list(self) -> list[str]:
        return [
            m.strip() for m in self.UPLOAD_ALLOWED_MIME_TYPES.split(",") if m.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()
