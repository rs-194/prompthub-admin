from urllib.parse import urlparse

from app.core.config import settings
from app.modules.model_config.schemas import ModelConfigStatus


def _clean(value: str | None) -> str:
    return value.strip() if value else ""


def _extract_base_url_host(base_url: str) -> str:
    normalized_base_url = base_url.strip()
    if not normalized_base_url:
        return ""

    parsed_url = urlparse(normalized_base_url)
    if parsed_url.netloc:
        return parsed_url.netloc

    parsed_without_scheme = urlparse(f"https://{normalized_base_url}")
    return parsed_without_scheme.netloc


def _infer_provider(base_url_host: str) -> str:
    if "deepseek" in base_url_host.lower():
        return "DeepSeek"

    return "OpenAI-Compatible"


def get_model_config_status() -> ModelConfigStatus:
    base_url = _clean(settings.llm_base_url)
    api_key_configured = bool(_clean(settings.llm_api_key))
    model = _clean(settings.llm_model)
    base_url_host = _extract_base_url_host(base_url)

    return ModelConfigStatus(
        provider=_infer_provider(base_url_host),
        model=model,
        baseUrlHost=base_url_host,
        enabled=bool(base_url and api_key_configured and model),
        apiKeyConfigured=api_key_configured,
        temperature=settings.llm_temperature,
        maxTokens=settings.llm_max_tokens,
        timeoutSeconds=settings.llm_timeout_seconds,
    )
