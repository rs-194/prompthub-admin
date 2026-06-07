from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class PromptTemplateCreate(BaseModel):
    title: str = Field(min_length=1)
    content: str = Field(min_length=1)
    description: str | None = None
    category: str | None = None
    tags: list[str] = Field(default_factory=list)
    scenario: str | None = None
    enabled: bool = True

    @field_validator("title", "content")
    @classmethod
    def validate_required_text(cls, value: str) -> str:
        normalized_value = value.strip()
        if not normalized_value:
            raise ValueError("must not be blank")

        return normalized_value


class PromptTemplateUpdate(PromptTemplateCreate):
    pass


class PromptTemplateListItem(BaseModel):
    id: int
    title: str
    description: str | None
    category: str | None
    tags: list[str]
    scenario: str | None
    enabled: bool
    contentPreview: str
    createdAt: datetime
    updatedAt: datetime


class PromptTemplateDetail(PromptTemplateListItem):
    content: str


class PromptTemplateListResponse(BaseModel):
    items: list[PromptTemplateListItem]
    total: int
    page: int
    pageSize: int


class PromptTemplateDeleteResponse(BaseModel):
    success: bool
