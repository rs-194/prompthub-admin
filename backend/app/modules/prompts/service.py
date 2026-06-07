import json
import re
from datetime import datetime

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.modules.prompts.models import PromptTemplate
from app.modules.prompts.schemas import (
    PromptTemplateCreate,
    PromptTemplateDetail,
    PromptTemplateListItem,
    PromptTemplateListResponse,
    PromptTemplateUpdate,
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


def orm_to_list_item(template: PromptTemplate) -> PromptTemplateListItem:
    return PromptTemplateListItem(
        id=template.id,
        title=template.title,
        description=template.description,
        category=template.category,
        tags=_parse_tags(template.tags),
        scenario=template.scenario,
        enabled=template.enabled,
        contentPreview=build_content_preview(template.content),
        createdAt=template.created_at,
        updatedAt=template.updated_at,
    )


def orm_to_detail(template: PromptTemplate) -> PromptTemplateDetail:
    return PromptTemplateDetail(
        **orm_to_list_item(template).model_dump(),
        content=template.content,
    )


def create_prompt_template(
    db: Session,
    data: PromptTemplateCreate,
) -> PromptTemplateDetail:
    now = datetime.utcnow()
    template = PromptTemplate(
        title=data.title.strip(),
        content=data.content.strip(),
        description=_normalize_optional_text(data.description),
        category=_normalize_optional_text(data.category),
        tags=json.dumps(_normalize_tags(data.tags), ensure_ascii=False),
        scenario=_normalize_optional_text(data.scenario),
        enabled=data.enabled,
        created_at=now,
        updated_at=now,
    )

    db.add(template)
    db.commit()
    db.refresh(template)
    return orm_to_detail(template)


def list_prompt_templates(
    db: Session,
    page: int,
    page_size: int,
    keyword: str | None,
    category: str | None,
    enabled: bool | None,
) -> PromptTemplateListResponse:
    current_page = max(page, 1)
    current_page_size = min(max(page_size, 1), MAX_PAGE_SIZE)
    query = db.query(PromptTemplate)
    normalized_keyword = keyword.strip() if keyword else ""
    normalized_category = category.strip() if category else ""

    if normalized_keyword:
        pattern = f"%{normalized_keyword}%"
        query = query.filter(
            or_(
                PromptTemplate.title.like(pattern),
                PromptTemplate.description.like(pattern),
                PromptTemplate.category.like(pattern),
                PromptTemplate.scenario.like(pattern),
                PromptTemplate.content.like(pattern),
            )
        )

    if normalized_category:
        query = query.filter(PromptTemplate.category == normalized_category)

    if enabled is not None:
        query = query.filter(PromptTemplate.enabled == enabled)

    total = query.count()
    templates = (
        query.order_by(PromptTemplate.created_at.desc())
        .offset((current_page - 1) * current_page_size)
        .limit(current_page_size)
        .all()
    )

    return PromptTemplateListResponse(
        items=[orm_to_list_item(template) for template in templates],
        total=total,
        page=current_page,
        pageSize=current_page_size,
    )


def get_prompt_template(
    db: Session,
    template_id: int,
) -> PromptTemplateDetail | None:
    template = (
        db.query(PromptTemplate)
        .filter(PromptTemplate.id == template_id)
        .first()
    )
    if template is None:
        return None

    return orm_to_detail(template)


def update_prompt_template(
    db: Session,
    template_id: int,
    data: PromptTemplateUpdate,
) -> PromptTemplateDetail | None:
    template = (
        db.query(PromptTemplate)
        .filter(PromptTemplate.id == template_id)
        .first()
    )
    if template is None:
        return None

    template.title = data.title.strip()
    template.content = data.content.strip()
    template.description = _normalize_optional_text(data.description)
    template.category = _normalize_optional_text(data.category)
    template.tags = json.dumps(_normalize_tags(data.tags), ensure_ascii=False)
    template.scenario = _normalize_optional_text(data.scenario)
    template.enabled = data.enabled
    template.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(template)
    return orm_to_detail(template)


def delete_prompt_template(db: Session, template_id: int) -> bool:
    template = (
        db.query(PromptTemplate)
        .filter(PromptTemplate.id == template_id)
        .first()
    )
    if template is None:
        return False

    db.delete(template)
    db.commit()
    return True
