import httpx

from app.core.config import settings
from app.modules.llm_provider.schemas import ChatMessage


class LLMConfigError(Exception):
    pass


class LLMTimeoutError(Exception):
    pass


class LLMHTTPError(Exception):
    pass


class LLMResponseError(Exception):
    pass


def _get_chat_completions_url() -> str:
    if not settings.llm_base_url or not settings.llm_api_key or not settings.llm_model:
        raise LLMConfigError

    return f"{settings.llm_base_url.rstrip('/')}/chat/completions"


def _dump_message(message: ChatMessage) -> dict[str, str]:
    if hasattr(message, "model_dump"):
        return message.model_dump()

    return message.dict()


def call_chat_completion(
    messages: list[ChatMessage],
    temperature: float,
    max_tokens: int,
) -> str:
    url = _get_chat_completions_url()
    payload = {
        "model": settings.llm_model,
        "messages": [_dump_message(message) for message in messages],
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    headers = {
        "Authorization": f"Bearer {settings.llm_api_key}",
        "Content-Type": "application/json",
    }

    try:
        with httpx.Client(timeout=settings.llm_timeout_seconds) as client:
            response = client.post(url, json=payload, headers=headers)
    except httpx.TimeoutException as exc:
        raise LLMTimeoutError from exc
    except httpx.HTTPError as exc:
        raise LLMHTTPError from exc

    if response.status_code < 200 or response.status_code >= 300:
        raise LLMHTTPError

    try:
        data = response.json()
        output = data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError, ValueError) as exc:
        raise LLMResponseError from exc

    if not isinstance(output, str):
        raise LLMResponseError

    return output
