from fastapi import APIRouter

from app.modules.model_config.schemas import ModelConfigStatus
from app.modules.model_config.service import get_model_config_status


router = APIRouter(prefix="/model-config", tags=["model-config"])


@router.get("", response_model=ModelConfigStatus)
def get_model_config() -> ModelConfigStatus:
    return get_model_config_status()
