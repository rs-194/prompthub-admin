from fastapi import APIRouter


router = APIRouter()


@router.get("/health")
def get_health() -> dict[str, str]:
    """健康检查接口，用于确认后端服务已启动。"""

    return {
        "status": "ok",
        "service": "prompthub-backend",
    }
