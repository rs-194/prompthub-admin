from sqlalchemy import Column, DateTime, Float, Integer, String, Text

from app.db.session import Base


class TestRecord(Base):
    __tablename__ = "test_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    prompt_title = Column(String, nullable=False)
    model_name = Column(String, nullable=False)
    user_input = Column(Text, nullable=False)
    output = Column(Text, nullable=False)
    output_preview = Column(Text, nullable=False)
    knowledge_titles = Column(Text, nullable=False)
    knowledge_count = Column(Integer, nullable=False)
    temperature = Column(Float, nullable=False)
    max_tokens = Column(Integer, nullable=False)
    output_format = Column(String, nullable=False)
    duration_ms = Column(Integer, nullable=False)
    status = Column(String, nullable=False)
    created_at = Column(DateTime, nullable=False)
