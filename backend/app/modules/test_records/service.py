import json
import re
from datetime import datetime

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.modules.test_records.models import TestRecord
from app.modules.test_records.schemas import (
    TestRecordCreate,
    TestRecordDetail,
    TestRecordListItem,
    TestRecordListResponse,
)

OUTPUT_PREVIEW_LIMIT = 80
MAX_PAGE_SIZE = 100


def build_output_preview(output: str) -> str:
    normalized_output = re.sub(r"\s+", " ", output.strip())
    if not normalized_output:
        return ""

    if len(normalized_output) <= OUTPUT_PREVIEW_LIMIT:
        return normalized_output

    return f"{normalized_output[:OUTPUT_PREVIEW_LIMIT]}..."


def _parse_knowledge_titles(raw_titles: str) -> list[str]:
    try:
        parsed = json.loads(raw_titles)
    except json.JSONDecodeError:
        return []

    if not isinstance(parsed, list):
        return []

    return [item for item in parsed if isinstance(item, str)]


def orm_to_list_item(record: TestRecord) -> TestRecordListItem:
    return TestRecordListItem(
        id=record.id,
        promptTitle=record.prompt_title,
        modelName=record.model_name,
        userInput=record.user_input,
        outputPreview=record.output_preview,
        knowledgeTitles=_parse_knowledge_titles(record.knowledge_titles),
        knowledgeCount=record.knowledge_count,
        temperature=record.temperature,
        maxTokens=record.max_tokens,
        outputFormat=record.output_format,
        durationMs=record.duration_ms,
        status=record.status,
        createdAt=record.created_at,
    )


def orm_to_detail(record: TestRecord) -> TestRecordDetail:
    return TestRecordDetail(
        id=record.id,
        promptTitle=record.prompt_title,
        modelName=record.model_name,
        userInput=record.user_input,
        outputPreview=record.output_preview,
        knowledgeTitles=_parse_knowledge_titles(record.knowledge_titles),
        knowledgeCount=record.knowledge_count,
        temperature=record.temperature,
        maxTokens=record.max_tokens,
        outputFormat=record.output_format,
        durationMs=record.duration_ms,
        status=record.status,
        createdAt=record.created_at,
        output=record.output,
    )


def create_test_record(db: Session, data: TestRecordCreate) -> TestRecordDetail:
    knowledge_titles = list(data.knowledgeTitles)
    record = TestRecord(
        prompt_title=data.promptTitle,
        model_name=data.modelName,
        user_input=data.userInput,
        output=data.output,
        output_preview=build_output_preview(data.output),
        knowledge_titles=json.dumps(knowledge_titles, ensure_ascii=False),
        knowledge_count=len(knowledge_titles),
        temperature=data.temperature,
        max_tokens=data.maxTokens,
        output_format=data.outputFormat,
        duration_ms=data.durationMs,
        status=data.status,
        created_at=datetime.utcnow(),
    )

    db.add(record)
    db.commit()
    db.refresh(record)
    return orm_to_detail(record)


def list_test_records(
    db: Session,
    page: int,
    page_size: int,
    keyword: str | None,
) -> TestRecordListResponse:
    current_page = max(page, 1)
    current_page_size = min(max(page_size, 1), MAX_PAGE_SIZE)

    query = db.query(TestRecord)
    normalized_keyword = keyword.strip() if keyword else ""

    if normalized_keyword:
        pattern = f"%{normalized_keyword}%"
        query = query.filter(
            or_(
                TestRecord.prompt_title.like(pattern),
                TestRecord.model_name.like(pattern),
                TestRecord.user_input.like(pattern),
                TestRecord.output_preview.like(pattern),
            )
        )

    total = query.count()
    records = (
        query.order_by(TestRecord.created_at.desc())
        .offset((current_page - 1) * current_page_size)
        .limit(current_page_size)
        .all()
    )

    return TestRecordListResponse(
        items=[orm_to_list_item(record) for record in records],
        total=total,
        page=current_page,
        pageSize=current_page_size,
    )


def get_test_record(db: Session, record_id: int) -> TestRecordDetail | None:
    record = db.query(TestRecord).filter(TestRecord.id == record_id).first()
    if record is None:
        return None

    return orm_to_detail(record)


def delete_test_record(db: Session, record_id: int) -> bool:
    record = db.query(TestRecord).filter(TestRecord.id == record_id).first()
    if record is None:
        return False

    db.delete(record)
    db.commit()
    return True
