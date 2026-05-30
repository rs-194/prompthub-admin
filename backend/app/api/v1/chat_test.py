from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.chat_test.schemas import ChatTestRunRequest, ChatTestRunResponse
from app.modules.chat_test.service import run_chat_test, stream_chat_test
from app.modules.llm_provider.service import (
    LLMConfigError,
    LLMHTTPError,
    LLMResponseError,
    LLMTimeoutError,
    validate_llm_config,
)


router = APIRouter(prefix="/chat-test", tags=["chat-test"])


@router.post("/run", response_model=ChatTestRunResponse)
def post_chat_test_run(
    data: ChatTestRunRequest,
    db: Session = Depends(get_db),
) -> ChatTestRunResponse:
    try:
        return run_chat_test(db=db, data=data)
    except LLMConfigError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="LLM service is not configured completely",
        ) from exc
    except LLMTimeoutError as exc:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="LLM service request timed out",
        ) from exc
    except LLMHTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="LLM service request failed",
        ) from exc
    except LLMResponseError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="LLM service returned an invalid response",
        ) from exc


@router.post("/stream")
def post_chat_test_stream(
    data: ChatTestRunRequest,
    db: Session = Depends(get_db),
) -> StreamingResponse:
    if not data.userInput.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="userInput cannot be empty",
        )

    try:
        validate_llm_config()
    except LLMConfigError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="LLM service is not configured completely",
        ) from exc

    return StreamingResponse(
        stream_chat_test(db=db, data=data),
        media_type="application/x-ndjson",
    )
