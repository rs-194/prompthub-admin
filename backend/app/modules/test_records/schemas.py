from datetime import datetime
from typing import Literal

from pydantic import BaseModel


OutputFormat = Literal["text", "markdown", "json"]
RecordStatus = Literal["success", "failed", "stopped"]


class TestRecordCreate(BaseModel):
    promptTitle: str
    modelName: str
    userInput: str
    output: str
    knowledgeTitles: list[str]
    knowledgeCount: int
    temperature: float
    maxTokens: int
    outputFormat: OutputFormat
    durationMs: int
    status: RecordStatus


class TestRecordListItem(BaseModel):
    id: int
    promptTitle: str
    modelName: str
    userInput: str
    outputPreview: str
    knowledgeTitles: list[str]
    knowledgeCount: int
    temperature: float
    maxTokens: int
    outputFormat: OutputFormat
    durationMs: int
    status: RecordStatus
    createdAt: datetime


class TestRecordDetail(TestRecordListItem):
    output: str


class TestRecordListResponse(BaseModel):
    items: list[TestRecordListItem]
    total: int
    page: int
    pageSize: int


class TestRecordDeleteResponse(BaseModel):
    success: bool
