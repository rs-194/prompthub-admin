from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

from app.core.config import settings


# 数据库连接基础设施：只提供 engine、SessionLocal、Base 和 get_db 依赖。
connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}

engine = create_engine(settings.database_url, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """FastAPI 依赖函数，用于在请求生命周期内获取数据库会话。"""

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
