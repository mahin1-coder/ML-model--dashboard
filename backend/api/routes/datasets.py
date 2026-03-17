"""
Dataset Management Routes - Upload, list, delete datasets
"""
import uuid
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from database.connection import get_db
from database.models import User
from services.auth import get_current_user
from services.dataset import DatasetService
from services.schemas import DatasetResponse, DatasetListResponse, MessageResponse

router = APIRouter()


@router.post("/upload", response_model=DatasetResponse, status_code=status.HTTP_201_CREATED)
async def upload_dataset(
    file: UploadFile = File(...),
    name: str = Form(...),
    description: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> DatasetResponse:
    """
    Upload a dataset file (CSV or Excel).
    
    - Validates file format and size
    - Stores file securely linked to user
    - Extracts metadata (columns, row count)
    """
    dataset_service = DatasetService(db)
    
    # Validate file type
    allowed_types = ["text/csv", "application/vnd.ms-excel", 
                     "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]
    
    if file.content_type not in allowed_types and not file.filename.endswith(('.csv', '.xlsx', '.xls')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only CSV and Excel files are allowed."
        )
    
    try:
        dataset = await dataset_service.create_dataset(
            user_id=current_user.id,
            file=file,
            name=name,
            description=description
        )
        return DatasetResponse.model_validate(dataset)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("", response_model=DatasetListResponse)
async def list_datasets(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 50
) -> DatasetListResponse:
    """List all datasets for the current user."""
    dataset_service = DatasetService(db)
    
    datasets = await dataset_service.get_user_datasets(
        user_id=current_user.id,
        skip=skip,
        limit=limit
    )
    total = await dataset_service.count_user_datasets(current_user.id)
    
    return DatasetListResponse(
        datasets=[DatasetResponse.model_validate(d) for d in datasets],
        total=total
    )


@router.get("/{dataset_id}", response_model=DatasetResponse)
async def get_dataset(
    dataset_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> DatasetResponse:
    """Get dataset details by ID."""
    dataset_service = DatasetService(db)
    
    dataset = await dataset_service.get_dataset(dataset_id, current_user.id)
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found"
        )
    
    return DatasetResponse.model_validate(dataset)


@router.get("/{dataset_id}/preview")
async def preview_dataset(
    dataset_id: uuid.UUID,
    rows: int = 10,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Preview first N rows of a dataset."""
    dataset_service = DatasetService(db)
    
    preview = await dataset_service.preview_dataset(dataset_id, current_user.id, rows)
    if preview is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found"
        )
    
    return preview


@router.delete("/{dataset_id}", response_model=MessageResponse)
async def delete_dataset(
    dataset_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> MessageResponse:
    """Delete a dataset."""
    dataset_service = DatasetService(db)
    
    success = await dataset_service.delete_dataset(dataset_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found"
        )
    
    return MessageResponse(message="Dataset deleted successfully")
