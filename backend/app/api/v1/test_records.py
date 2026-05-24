from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.test_records.schemas import (
    TestRecordCreate,
    TestRecordDeleteResponse,
    TestRecordDetail,
    TestRecordListResponse,
)
from app.modules.test_records.service import (
    create_test_record,
    delete_test_record,
    get_test_record,
    list_test_records,
)


router = APIRouter(prefix="/test-records", tags=["test-records"])


@router.get("", response_model=TestRecordListResponse)
def get_test_records(
    page: int = Query(default=1, ge=1),
    pageSize: int = Query(default=10, ge=1, le=100),
    keyword: str | None = None,
    db: Session = Depends(get_db),
) -> TestRecordListResponse:
    return list_test_records(db=db, page=page, page_size=pageSize, keyword=keyword)


@router.get("/{record_id}", response_model=TestRecordDetail)
def get_test_record_detail(
    record_id: int,
    db: Session = Depends(get_db),
) -> TestRecordDetail:
    record = get_test_record(db=db, record_id=record_id)
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Test record not found")

    return record


@router.post("", response_model=TestRecordDetail, status_code=status.HTTP_201_CREATED)
def post_test_record(
    data: TestRecordCreate,
    db: Session = Depends(get_db),
) -> TestRecordDetail:
    return create_test_record(db=db, data=data)


@router.delete("/{record_id}", response_model=TestRecordDeleteResponse)
def remove_test_record(
    record_id: int,
    db: Session = Depends(get_db),
) -> TestRecordDeleteResponse:
    deleted = delete_test_record(db=db, record_id=record_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Test record not found")

    return TestRecordDeleteResponse(success=True)
