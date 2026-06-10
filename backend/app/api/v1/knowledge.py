from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.knowledge.schemas import (
    KnowledgeDocumentCreate,
    KnowledgeDocumentDeleteResponse,
    KnowledgeDocumentDetail,
    KnowledgeDocumentListResponse,
    KnowledgeSearchScope,
    KnowledgeDocumentUpdate,
)
from app.modules.knowledge.service import (
    create_knowledge_document,
    delete_knowledge_document,
    get_knowledge_document,
    list_knowledge_documents,
    update_knowledge_document,
)

router = APIRouter(prefix="/knowledge-documents", tags=["knowledge-documents"])


@router.get("", response_model=KnowledgeDocumentListResponse)
def get_knowledge_documents(
    page: int = Query(default=1, ge=1),
    pageSize: int = Query(default=10, ge=1, le=100),
    keyword: str | None = None,
    searchScope: KnowledgeSearchScope = Query(default="basic"),
    enabled: bool | None = None,
    db: Session = Depends(get_db),
) -> KnowledgeDocumentListResponse:
    return list_knowledge_documents(
        db=db,
        page=page,
        page_size=pageSize,
        keyword=keyword,
        enabled=enabled,
        search_scope=searchScope,
    )


@router.get("/{document_id}", response_model=KnowledgeDocumentDetail)
def get_knowledge_document_detail(
    document_id: int,
    db: Session = Depends(get_db),
) -> KnowledgeDocumentDetail:
    document = get_knowledge_document(db=db, document_id=document_id)
    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Knowledge document not found",
        )

    return document


@router.post(
    "",
    response_model=KnowledgeDocumentDetail,
    status_code=status.HTTP_201_CREATED,
)
def post_knowledge_document(
    data: KnowledgeDocumentCreate,
    db: Session = Depends(get_db),
) -> KnowledgeDocumentDetail:
    return create_knowledge_document(db=db, data=data)


@router.put("/{document_id}", response_model=KnowledgeDocumentDetail)
def put_knowledge_document(
    document_id: int,
    data: KnowledgeDocumentUpdate,
    db: Session = Depends(get_db),
) -> KnowledgeDocumentDetail:
    document = update_knowledge_document(
        db=db,
        document_id=document_id,
        data=data,
    )
    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Knowledge document not found",
        )

    return document


@router.delete(
    "/{document_id}",
    response_model=KnowledgeDocumentDeleteResponse,
)
def remove_knowledge_document(
    document_id: int,
    db: Session = Depends(get_db),
) -> KnowledgeDocumentDeleteResponse:
    deleted = delete_knowledge_document(db=db, document_id=document_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Knowledge document not found",
        )

    return KnowledgeDocumentDeleteResponse(success=True)
