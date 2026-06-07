from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text

from app.db.session import Base


class PromptTemplate(Base):
    __tablename__ = "prompt_templates"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String, nullable=True)
    tags = Column(Text, nullable=False, default="[]")
    scenario = Column(String, nullable=True)
    enabled = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=False)
