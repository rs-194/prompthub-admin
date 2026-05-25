from typing import Literal

from pydantic import BaseModel, Field

from app.modules.test_records.schemas import TestRecordDetail


OutputFormat = Literal["text", "markdown", "json"]


class KnowledgeContextPayload(BaseModel):
    titles: list[str] = Field(default_factory=list)
    content: str = ""


class ChatTestParams(BaseModel):
    temperature: float | None = None
    maxTokens: int | None = None
    outputFormat: OutputFormat = "text"


class ChatTestRunRequest(BaseModel):
    promptTitle: str
    systemPrompt: str = ""
    userInput: str
    modelName: str
    knowledgeContext: KnowledgeContextPayload = Field(default_factory=KnowledgeContextPayload)
    params: ChatTestParams = Field(default_factory=ChatTestParams)


class ChatTestRunResponse(BaseModel):
    output: str
    record: TestRecordDetail
    durationMs: int
