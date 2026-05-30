import json
import time

from fastapi.encoders import jsonable_encoder
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.modules.chat_test.schemas import ChatTestRunRequest, ChatTestRunResponse
from app.modules.llm_provider.schemas import ChatMessage
from app.modules.llm_provider.service import (
    LLMConfigError,
    LLMHTTPError,
    LLMResponseError,
    LLMTimeoutError,
    call_chat_completion,
    stream_chat_completion,
)
from app.modules.test_records.schemas import TestRecordCreate
from app.modules.test_records.service import create_test_record


DEFAULT_SYSTEM_PROMPT = "You are a helpful AI assistant for a prompt testing console."
KNOWLEDGE_CONTEXT_LIMIT = 7000
MAX_TEMPERATURE = 2.0
MIN_TEMPERATURE = 0.0
MAX_TOKENS_LIMIT = 4096
MIN_MAX_TOKENS = 1


def _clamp_temperature(value: float | None) -> float:
    temperature = settings.llm_temperature if value is None else value
    return min(max(temperature, MIN_TEMPERATURE), MAX_TEMPERATURE)


def _clamp_max_tokens(value: int | None) -> int:
    max_tokens = settings.llm_max_tokens if value is None else value
    return min(max(max_tokens, MIN_MAX_TOKENS), MAX_TOKENS_LIMIT)


def _build_output_format_instruction(output_format: str) -> str:
    if output_format == "json":
        return "Output JSON only when possible. Do not add extra explanation outside the JSON."

    if output_format == "markdown":
        return "Use Markdown formatting when it helps readability."

    return "Use plain text unless the user explicitly asks for another format."


def _build_system_content(data: ChatTestRunRequest) -> str:
    system_prompt = data.systemPrompt.strip() or DEFAULT_SYSTEM_PROMPT
    parts = [
        system_prompt,
        "",
        "[Output format requirement]",
        _build_output_format_instruction(data.params.outputFormat),
    ]

    knowledge_content = data.knowledgeContext.content.strip()
    if knowledge_content:
        truncated_content = knowledge_content[:KNOWLEDGE_CONTEXT_LIMIT]
        titles = "、".join(data.knowledgeContext.titles) if data.knowledgeContext.titles else "Untitled context"
        parts.extend(
            [
                "",
                "[Reference context]",
                "The following content is user-selected reference context, not real RAG retrieval.",
                f"Titles: {titles}",
                f"Content: {truncated_content}",
            ]
        )

    return "\n".join(parts)


def build_messages(data: ChatTestRunRequest) -> list[ChatMessage]:
    return [
        ChatMessage(role="system", content=_build_system_content(data)),
        ChatMessage(role="user", content=data.userInput.strip()),
    ]


def run_chat_test(db: Session, data: ChatTestRunRequest) -> ChatTestRunResponse:
    if not data.userInput.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="userInput cannot be empty",
        )

    temperature = _clamp_temperature(data.params.temperature)
    max_tokens = _clamp_max_tokens(data.params.maxTokens)
    messages = build_messages(data)

    started_at = time.perf_counter()
    output = call_chat_completion(
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    duration_ms = int((time.perf_counter() - started_at) * 1000)

    record = create_test_record(
        db=db,
        data=TestRecordCreate(
            promptTitle=data.promptTitle,
            modelName=data.modelName,
            userInput=data.userInput.strip(),
            output=output,
            knowledgeTitles=data.knowledgeContext.titles,
            knowledgeCount=len(data.knowledgeContext.titles),
            temperature=temperature,
            maxTokens=max_tokens,
            outputFormat=data.params.outputFormat,
            durationMs=duration_ms,
            status="success",
        ),
    )

    return ChatTestRunResponse(output=output, record=record, durationMs=duration_ms)


def _build_stream_line(payload: dict) -> str:
    return f"{json.dumps(jsonable_encoder(payload), ensure_ascii=False)}\n"


def _build_stream_error_message(error: Exception) -> str:
    if isinstance(error, LLMConfigError):
        return "LLM 服务未配置完整，请先配置后端环境变量"

    if isinstance(error, LLMTimeoutError):
        return "模型调用超时，请稍后重试或缩短输入内容"

    if isinstance(error, LLMHTTPError):
        return "模型服务暂时不可用，请稍后重试"

    if isinstance(error, LLMResponseError):
        return "模型服务返回结构异常，请稍后重试"

    return "LLM 调用失败，请稍后重试"


def stream_chat_test(db: Session, data: ChatTestRunRequest):
    temperature = _clamp_temperature(data.params.temperature)
    max_tokens = _clamp_max_tokens(data.params.maxTokens)
    messages = build_messages(data)
    output_parts: list[str] = []
    started_at = time.perf_counter()

    try:
        for content in stream_chat_completion(
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        ):
            output_parts.append(content)
            yield _build_stream_line({"type": "chunk", "content": content})

        duration_ms = int((time.perf_counter() - started_at) * 1000)
        output = "".join(output_parts)
        record = create_test_record(
            db=db,
            data=TestRecordCreate(
                promptTitle=data.promptTitle,
                modelName=data.modelName,
                userInput=data.userInput.strip(),
                output=output,
                knowledgeTitles=data.knowledgeContext.titles,
                knowledgeCount=len(data.knowledgeContext.titles),
                temperature=temperature,
                maxTokens=max_tokens,
                outputFormat=data.params.outputFormat,
                durationMs=duration_ms,
                status="success",
            ),
        )

        yield _build_stream_line(
            {
                "type": "done",
                "record": record,
                "durationMs": duration_ms,
            }
        )
    except (LLMConfigError, LLMTimeoutError, LLMHTTPError, LLMResponseError) as exc:
        yield _build_stream_line({"type": "error", "message": _build_stream_error_message(exc)})
