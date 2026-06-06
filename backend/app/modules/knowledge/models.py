from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text

from app.db.session import Base


class KnowledgeDocument(Base):
    __tablename__ = "knowledge_documents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    summary = Column(Text, nullable=True)
    source_name = Column(String, nullable=True)
    tags = Column(Text, nullable=False, default="[]")
    enabled = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=False)
