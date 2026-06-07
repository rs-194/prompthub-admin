from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.prompts.schemas import (
    PromptTemplateCreate,
    PromptTemplateDeleteResponse,
    PromptTemplateDetail,
    PromptTemplateListResponse,
    PromptTemplateUpdate,
)
from app.modules.prompts.service import (
    create_prompt_template,
    delete_prompt_template,
    get_prompt_template,
    list_prompt_templates,
    update_prompt_template,
)

router = APIRouter(prefix="/prompt-templates", tags=["prompt-templates"])


@router.get("", response_model=PromptTemplateListResponse)
def get_prompt_templates(
    page: int = Query(default=1, ge=1),
    pageSize: int = Query(default=10, ge=1, le=100),
    keyword: str | None = None,
    category: str | None = None,
    enabled: bool | None = None,
    db: Session = Depends(get_db),
) -> PromptTemplateListResponse:
    return list_prompt_templates(
        db=db,
        page=page,
        page_size=pageSize,
        keyword=keyword,
        category=category,
        enabled=enabled,
    )


@router.get("/{template_id}", response_model=PromptTemplateDetail)
def get_prompt_template_detail(
    template_id: int,
    db: Session = Depends(get_db),
) -> PromptTemplateDetail:
    template = get_prompt_template(db=db, template_id=template_id)
    if template is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt template not found",
        )

    return template


@router.post(
    "",
    response_model=PromptTemplateDetail,
    status_code=status.HTTP_201_CREATED,
)
def post_prompt_template(
    data: PromptTemplateCreate,
    db: Session = Depends(get_db),
) -> PromptTemplateDetail:
    return create_prompt_template(db=db, data=data)


@router.put("/{template_id}", response_model=PromptTemplateDetail)
def put_prompt_template(
    template_id: int,
    data: PromptTemplateUpdate,
    db: Session = Depends(get_db),
) -> PromptTemplateDetail:
    template = update_prompt_template(
        db=db,
        template_id=template_id,
        data=data,
    )
    if template is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt template not found",
        )

    return template


@router.delete(
    "/{template_id}",
    response_model=PromptTemplateDeleteResponse,
)
def remove_prompt_template(
    template_id: int,
    db: Session = Depends(get_db),
) -> PromptTemplateDeleteResponse:
    deleted = delete_prompt_template(db=db, template_id=template_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt template not found",
        )

    return PromptTemplateDeleteResponse(success=True)
