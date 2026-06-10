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
    KnowledgeSearchScope,
    KnowledgeDocumentUpdate,
)

CONTENT_PREVIEW_LIMIT = 120
MATCH_SNIPPET_LIMIT = 100
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


def _document_response_data(document: KnowledgeDocument) -> dict[str, object]:
    return {
        "id": document.id,
        "title": document.title,
        "summary": document.summary,
        "contentPreview": build_content_preview(document.content),
        "sourceName": document.source_name,
        "tags": _parse_tags(document.tags),
        "enabled": document.enabled,
        "createdAt": document.created_at,
        "updatedAt": document.updated_at,
    }


def orm_to_list_item(
    document: KnowledgeDocument,
    match_snippet: str = "",
) -> KnowledgeDocumentListItem:
    return KnowledgeDocumentListItem(
        **_document_response_data(document),
        matchSnippet=match_snippet,
    )


def orm_to_detail(document: KnowledgeDocument) -> KnowledgeDocumentDetail:
    return KnowledgeDocumentDetail(
        **_document_response_data(document),
        content=document.content,
    )


def _contains_keyword(value: str | None, keyword: str) -> bool:
    return bool(value and keyword.lower() in value.lower())


def _build_text_match_snippet(
    label: str,
    value: str | None,
    keyword: str,
) -> str:
    if not value:
        return ""

    normalized_value = re.sub(r"\s+", " ", value.strip())
    match_index = normalized_value.lower().find(keyword.lower())
    if match_index < 0:
        return ""

    start = max(match_index - 35, 0)
    end = min(start + MATCH_SNIPPET_LIMIT, len(normalized_value))
    if end - start < MATCH_SNIPPET_LIMIT:
        start = max(end - MATCH_SNIPPET_LIMIT, 0)

    snippet = normalized_value[start:end]
    prefix = "..." if start > 0 else ""
    suffix = "..." if end < len(normalized_value) else ""
    return f"{label}：{prefix}{snippet}{suffix}"


def _get_match_priority_and_snippet(
    document: KnowledgeDocument,
    keyword: str,
    search_scope: KnowledgeSearchScope,
) -> tuple[int, str]:
    if _contains_keyword(document.title, keyword):
        return 0, f"标题匹配：{document.title}"

    tags = _parse_tags(document.tags)
    matched_tag = next(
        (tag for tag in tags if _contains_keyword(tag, keyword)),
        None,
    )
    if matched_tag is not None:
        return 1, f"标签匹配：{matched_tag}"

    summary_snippet = _build_text_match_snippet(
        "摘要匹配",
        document.summary,
        keyword,
    )
    if summary_snippet:
        return 2, summary_snippet

    if _contains_keyword(document.source_name, keyword):
        return 2, f"来源匹配：{document.source_name}"

    if search_scope == "fullText":
        content_snippet = _build_text_match_snippet(
            "正文匹配",
            document.content,
            keyword,
        )
        if content_snippet:
            return 3, content_snippet

    return 4, ""


def _build_list_item_with_match(
    document: KnowledgeDocument,
    keyword: str,
    search_scope: KnowledgeSearchScope,
) -> tuple[int, KnowledgeDocumentListItem]:
    priority, match_snippet = _get_match_priority_and_snippet(
        document,
        keyword,
        search_scope,
    )
    return priority, orm_to_list_item(document, match_snippet)


def _sort_document_matches(
    documents: list[KnowledgeDocument],
    keyword: str,
    search_scope: KnowledgeSearchScope,
) -> list[KnowledgeDocumentListItem]:
    ranked_items = [
        (
            *_build_list_item_with_match(document, keyword, search_scope),
            document.created_at,
        )
        for document in documents
    ]
    ranked_items.sort(
        key=lambda item: (item[0], -item[2].timestamp()),
    )
    return [item[1] for item in ranked_items]


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
    search_scope: KnowledgeSearchScope = "basic",
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
                KnowledgeDocument.tags.like(pattern),
                *(
                    [KnowledgeDocument.content.like(pattern)]
                    if search_scope == "fullText"
                    else []
                ),
            )
        )

    if enabled is not None:
        query = query.filter(KnowledgeDocument.enabled == enabled)

    if normalized_keyword:
        matched_items = _sort_document_matches(
            query.all(),
            normalized_keyword,
            search_scope,
        )
        total = len(matched_items)
        offset = (current_page - 1) * current_page_size
        items = matched_items[offset : offset + current_page_size]
    else:
        total = query.count()
        documents = (
            query.order_by(KnowledgeDocument.created_at.desc())
            .offset((current_page - 1) * current_page_size)
            .limit(current_page_size)
            .all()
        )
        items = [orm_to_list_item(document) for document in documents]

    return KnowledgeDocumentListResponse(
        items=items,
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
