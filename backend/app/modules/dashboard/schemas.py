from datetime import datetime

from pydantic import BaseModel

from app.modules.test_records.schemas import RecordStatus


class DashboardCountSummary(BaseModel):
    total: int
    enabled: int


class DashboardTestRecordSummary(BaseModel):
    total: int
    success: int
    failed: int
    stopped: int
    latestCreatedAt: datetime | None


class DashboardModelConfigSummary(BaseModel):
    enabled: bool
    provider: str
    model: str
    apiKeyConfigured: bool


class DashboardRecentRecord(BaseModel):
    id: int
    promptTitle: str
    modelName: str
    outputPreview: str
    status: RecordStatus
    durationMs: int
    createdAt: datetime


class DashboardSummaryResponse(BaseModel):
    prompt: DashboardCountSummary
    knowledge: DashboardCountSummary
    testRecord: DashboardTestRecordSummary
    modelConfig: DashboardModelConfigSummary
    recentRecords: list[DashboardRecentRecord]
