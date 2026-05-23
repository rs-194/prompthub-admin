from dataclasses import dataclass, field


@dataclass(frozen=True)
class Settings:
    """后端基础配置，Phase 2.1 仅保留启动和连接所需字段。"""

    app_name: str = "PromptHub Backend"
    api_v1_prefix: str = "/api/v1"
    database_url: str = "sqlite:///./prompthub.db"
    cors_origins: list[str] = field(
        default_factory=lambda: [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]
    )


settings = Settings()
