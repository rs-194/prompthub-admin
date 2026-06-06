from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class KnowledgeDocumentCreate(BaseModel):
    title: str = Field(min_length=1)
    content: str = Field(min_length=1)
    summary: str | None = None
    sourceName: str | None = None
    tags: list[str] = Field(default_factory=list)
    enabled: bool = True

    @field_validator("title", "content")
    @classmethod
    def validate_required_text(cls, value: str) -> str:
        normalized_value = value.strip()
        if not normalized_value:
            raise ValueError("must not be blank")

        return normalized_value


class KnowledgeDocumentUpdate(KnowledgeDocumentCreate):
    pass


class KnowledgeDocumentListItem(BaseModel):
    id: int
    title: str
    summary: str | None
    contentPreview: str
    sourceName: str | None
    tags: list[str]
    enabled: bool
    createdAt: datetime
    updatedAt: datetime


class KnowledgeDocumentDetail(KnowledgeDocumentListItem):
    content: str


class KnowledgeDocumentListResponse(BaseModel):
    items: list[KnowledgeDocumentListItem]
    total: int
    page: int
    pageSize: int


class KnowledgeDocumentDeleteResponse(BaseModel):
    success: bool
