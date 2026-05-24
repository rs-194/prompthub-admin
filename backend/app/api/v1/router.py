from fastapi import APIRouter

from app.api.v1.health import router as health_router
from app.api.v1.test_records import router as test_records_router


api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(test_records_router)
