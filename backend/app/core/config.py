import os
from dataclasses import dataclass, field


@dataclass(frozen=True)
class Settings:
    """Backend settings kept lightweight for the current development phase."""

    app_name: str = "PromptHub Backend"
    api_v1_prefix: str = "/api/v1"
    database_url: str = "sqlite:///./prompthub.db"
    cors_origins: list[str] = field(
        default_factory=lambda: [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]
    )
    llm_base_url: str | None = None
    llm_api_key: str | None = None
    llm_model: str | None = None
    llm_temperature: float = 0.7
    llm_max_tokens: int = 1024
    llm_timeout_seconds: float = 60.0


def _get_float_env(name: str, default: float) -> float:
    raw_value = os.getenv(name)
    if raw_value is None:
        return default

    try:
        return float(raw_value)
    except ValueError:
        return default


def _get_int_env(name: str, default: int) -> int:
    raw_value = os.getenv(name)
    if raw_value is None:
        return default

    try:
        return int(raw_value)
    except ValueError:
        return default


settings = Settings(
    llm_base_url=os.getenv("LLM_BASE_URL"),
    llm_api_key=os.getenv("LLM_API_KEY"),
    llm_model=os.getenv("LLM_MODEL"),
    llm_temperature=_get_float_env("LLM_TEMPERATURE", 0.7),
    llm_max_tokens=_get_int_env("LLM_MAX_TOKENS", 1024),
    llm_timeout_seconds=_get_float_env("LLM_TIMEOUT_SECONDS", 60.0),
)
