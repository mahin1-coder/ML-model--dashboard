"""
ML Model Routes - Train, list, get models
"""
import uuid
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from database.connection import get_db
from database.models import User, ModelStatus
from services.auth import get_current_user
from services.model import ModelService
from services.billing import BillingService
from services.schemas import (
    ModelTrainRequest,
    ModelResponse,
    ModelListResponse,
    MessageResponse,
    ModelMetricsResponse,
)

router = APIRouter()


@router.post("/train", response_model=ModelResponse, status_code=status.HTTP_202_ACCEPTED)
async def train_model(
    train_request: ModelTrainRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> ModelResponse:
    """
    Train a new machine learning model.
    
    - Supports classification and regression
    - Algorithms: random_forest, xgboost, logistic_regression, linear_regression
    - Training runs in background
    """
    billing_service = BillingService(db)
    
    # Check subscription limits
    can_train = await billing_service.can_train_model(current_user.id)
    if not can_train:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Training limit reached. Upgrade to Pro for unlimited training."
        )
    
    model_service = ModelService(db)
    
    # Create model record
    model = await model_service.create_model(
        user_id=current_user.id,
        train_request=train_request
    )
    
    # Increment training counter
    await billing_service.increment_training_count(current_user.id)
    
    # Start training in background
    background_tasks.add_task(
        model_service.train_model_background,
        model.id,
        train_request
    )
    
    return ModelResponse.model_validate(model)


@router.get("", response_model=ModelListResponse)
async def list_models(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 50,
    status_filter: Optional[ModelStatus] = None
) -> ModelListResponse:
    """List all models for the current user."""
    model_service = ModelService(db)
    
    models = await model_service.get_user_models(
        user_id=current_user.id,
        skip=skip,
        limit=limit,
        status_filter=status_filter
    )
    total = await model_service.count_user_models(current_user.id, status_filter)
    
    return ModelListResponse(
        models=[ModelResponse.model_validate(m) for m in models],
        total=total
    )


@router.get("/{model_id}", response_model=ModelResponse)
async def get_model(
    model_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> ModelResponse:
    """Get model details by ID."""
    model_service = ModelService(db)
    
    model = await model_service.get_model(model_id, current_user.id)
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model not found"
        )
    
    return ModelResponse.model_validate(model)


@router.get("/{model_id}/metrics", response_model=ModelMetricsResponse)
async def get_model_metrics(
    model_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> ModelMetricsResponse:
    """Get detailed model metrics and visualizations."""
    model_service = ModelService(db)
    
    model = await model_service.get_model(model_id, current_user.id)
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model not found"
        )
    
    if model.status != ModelStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Model training not completed"
        )
    
    return ModelMetricsResponse(
        model_id=model.id,
        metrics=model.metrics or {},
        feature_importance=model.feature_importance or {},
        confusion_matrix=model.confusion_matrix,
        training_time_seconds=model.training_time_seconds
    )


@router.delete("/{model_id}", response_model=MessageResponse)
async def delete_model(
    model_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> MessageResponse:
    """Delete a model."""
    model_service = ModelService(db)
    
    success = await model_service.delete_model(model_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model not found"
        )
    
    return MessageResponse(message="Model deleted successfully")
