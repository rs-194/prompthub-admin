from sqlalchemy import func
from sqlalchemy.orm import Session

from app.modules.dashboard.schemas import (
    DashboardCountSummary,
    DashboardModelConfigSummary,
    DashboardRecentRecord,
    DashboardSummaryResponse,
    DashboardTestRecordSummary,
)
from app.modules.knowledge.models import KnowledgeDocument
from app.modules.model_config.service import get_model_config_status
from app.modules.prompts.models import PromptTemplate
from app.modules.test_records.models import TestRecord

RECENT_RECORD_LIMIT = 5


def _count_total_and_enabled(
    db: Session,
    model: type[PromptTemplate] | type[KnowledgeDocument],
) -> DashboardCountSummary:
    total = db.query(model).count()
    enabled = db.query(model).filter(model.enabled.is_(True)).count()

    return DashboardCountSummary(total=total, enabled=enabled)


def _get_test_record_summary(db: Session) -> DashboardTestRecordSummary:
    status_rows = (
        db.query(TestRecord.status, func.count(TestRecord.id))
        .group_by(TestRecord.status)
        .all()
    )
    status_counts = {status: count for status, count in status_rows}
    latest_created_at = db.query(func.max(TestRecord.created_at)).scalar()

    return DashboardTestRecordSummary(
        total=db.query(TestRecord).count(),
        success=status_counts.get("success", 0),
        failed=status_counts.get("failed", 0),
        stopped=status_counts.get("stopped", 0),
        latestCreatedAt=latest_created_at,
    )


def _get_recent_records(db: Session) -> list[DashboardRecentRecord]:
    records = (
        db.query(TestRecord)
        .order_by(TestRecord.created_at.desc())
        .limit(RECENT_RECORD_LIMIT)
        .all()
    )

    return [
        DashboardRecentRecord(
            id=record.id,
            promptTitle=record.prompt_title,
            modelName=record.model_name,
            outputPreview=record.output_preview,
            status=record.status,
            durationMs=record.duration_ms,
            createdAt=record.created_at,
        )
        for record in records
    ]


def _get_model_config_summary() -> DashboardModelConfigSummary:
    status = get_model_config_status()

    return DashboardModelConfigSummary(
        enabled=status.enabled,
        provider=status.provider,
        model=status.model,
        apiKeyConfigured=status.apiKeyConfigured,
    )


def get_dashboard_summary(db: Session) -> DashboardSummaryResponse:
    return DashboardSummaryResponse(
        prompt=_count_total_and_enabled(db, PromptTemplate),
        knowledge=_count_total_and_enabled(db, KnowledgeDocument),
        testRecord=_get_test_record_summary(db),
        modelConfig=_get_model_config_summary(),
        recentRecords=_get_recent_records(db),
    )
