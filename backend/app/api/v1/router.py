from fastapi import APIRouter

from app.api.v1.chat_test import router as chat_test_router
from app.api.v1.health import router as health_router
from app.api.v1.knowledge import router as knowledge_router
from app.api.v1.model_config import router as model_config_router
from app.api.v1.prompt_templates import router as prompt_templates_router
from app.api.v1.test_records import router as test_records_router


api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(test_records_router)
api_router.include_router(chat_test_router)
api_router.include_router(model_config_router)
api_router.include_router(knowledge_router)
api_router.include_router(prompt_templates_router)
