import json
import re
from datetime import datetime

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.modules.knowledge.models import KnowledgeDocument
from app.modules.knowledge.schemas import (
    KnowledgeDocumentCreate,
    KnowledgeDocumentDetail,
    KnowledgeDocumentListItem,
    KnowledgeDocumentListResponse,
    KnowledgeDocumentUpdate,
)

CONTENT_PREVIEW_LIMIT = 120
MAX_PAGE_SIZE = 100


def build_content_preview(content: str) -> str:
    normalized_content = re.sub(r"\s+", " ", content.strip())
    if len(normalized_content) <= CONTENT_PREVIEW_LIMIT:
        return normalized_content

    return f"{normalized_content[:CONTENT_PREVIEW_LIMIT]}..."


def _parse_tags(raw_tags: str) -> list[str]:
    try:
        parsed = json.loads(raw_tags)
    except (json.JSONDecodeError, TypeError):
        return []

    if not isinstance(parsed, list):
        return []

    return [tag for tag in parsed if isinstance(tag, str)]


def _normalize_optional_text(value: str | None) -> str | None:
    if value is None:
        return None

    normalized_value = value.strip()
    return normalized_value or None


def _normalize_tags(tags: list[str]) -> list[str]:
    normalized_tags: list[str] = []

    for tag in tags:
        normalized_tag = tag.strip()
        if normalized_tag and normalized_tag not in normalized_tags:
            normalized_tags.append(normalized_tag)

    return normalized_tags


def orm_to_list_item(document: KnowledgeDocument) -> KnowledgeDocumentListItem:
    return KnowledgeDocumentListItem(
        id=document.id,
        title=document.title,
        summary=document.summary,
        contentPreview=build_content_preview(document.content),
        sourceName=document.source_name,
        tags=_parse_tags(document.tags),
        enabled=document.enabled,
        createdAt=document.created_at,
        updatedAt=document.updated_at,
    )


def orm_to_detail(document: KnowledgeDocument) -> KnowledgeDocumentDetail:
    return KnowledgeDocumentDetail(
        **orm_to_list_item(document).model_dump(),
        content=document.content,
    )


def create_knowledge_document(
    db: Session,
    data: KnowledgeDocumentCreate,
) -> KnowledgeDocumentDetail:
    now = datetime.utcnow()
    document = KnowledgeDocument(
        title=data.title.strip(),
        content=data.content.strip(),
        summary=_normalize_optional_text(data.summary),
        source_name=_normalize_optional_text(data.sourceName),
        tags=json.dumps(_normalize_tags(data.tags), ensure_ascii=False),
        enabled=data.enabled,
        created_at=now,
        updated_at=now,
    )

    db.add(document)
    db.commit()
    db.refresh(document)
    return orm_to_detail(document)


def list_knowledge_documents(
    db: Session,
    page: int,
    page_size: int,
    keyword: str | None,
    enabled: bool | None,
) -> KnowledgeDocumentListResponse:
    current_page = max(page, 1)
    current_page_size = min(max(page_size, 1), MAX_PAGE_SIZE)
    query = db.query(KnowledgeDocument)
    normalized_keyword = keyword.strip() if keyword else ""

    if normalized_keyword:
        pattern = f"%{normalized_keyword}%"
        query = query.filter(
            or_(
                KnowledgeDocument.title.like(pattern),
                KnowledgeDocument.summary.like(pattern),
                KnowledgeDocument.source_name.like(pattern),
                KnowledgeDocument.content.like(pattern),
            )
        )

    if enabled is not None:
        query = query.filter(KnowledgeDocument.enabled == enabled)

    total = query.count()
    documents = (
        query.order_by(KnowledgeDocument.created_at.desc())
        .offset((current_page - 1) * current_page_size)
        .limit(current_page_size)
        .all()
    )

    return KnowledgeDocumentListResponse(
        items=[orm_to_list_item(document) for document in documents],
        total=total,
        page=current_page,
        pageSize=current_page_size,
    )


def get_knowledge_document(
    db: Session,
    document_id: int,
) -> KnowledgeDocumentDetail | None:
    document = (
        db.query(KnowledgeDocument)
        .filter(KnowledgeDocument.id == document_id)
        .first()
    )
    if document is None:
        return None

    return orm_to_detail(document)


def update_knowledge_document(
    db: Session,
    document_id: int,
    data: KnowledgeDocumentUpdate,
) -> KnowledgeDocumentDetail | None:
    document = (
        db.query(KnowledgeDocument)
        .filter(KnowledgeDocument.id == document_id)
        .first()
    )
    if document is None:
        return None

    document.title = data.title.strip()
    document.content = data.content.strip()
    document.summary = _normalize_optional_text(data.summary)
    document.source_name = _normalize_optional_text(data.sourceName)
    document.tags = json.dumps(_normalize_tags(data.tags), ensure_ascii=False)
    document.enabled = data.enabled
    document.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(document)
    return orm_to_detail(document)


def delete_knowledge_document(db: Session, document_id: int) -> bool:
    document = (
        db.query(KnowledgeDocument)
        .filter(KnowledgeDocument.id == document_id)
        .first()
    )
    if document is None:
        return False

    db.delete(document)
    db.commit()
    return True
