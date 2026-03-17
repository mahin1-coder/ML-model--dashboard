"""
Prediction Routes - Run predictions using trained models
"""
import uuid
from typing import Dict, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from database.connection import get_db
from database.models import User, ModelStatus
from services.auth import get_current_user
from services.prediction import PredictionService
from services.schemas import (
    PredictionRequest,
    PredictionResponse,
    BatchPredictionRequest,
    BatchPredictionResponse,
    PredictionHistoryResponse,
)

router = APIRouter()


@router.post("/{model_id}", response_model=PredictionResponse)
async def make_prediction(
    model_id: uuid.UUID,
    prediction_request: PredictionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> PredictionResponse:
    """
    Make a prediction using a trained model.
    
    - Validates input features match model requirements
    - Returns prediction with confidence/probability
    """
    prediction_service = PredictionService(db)
    
    try:
        result = await prediction_service.predict(
            model_id=model_id,
            user_id=current_user.id,
            features=prediction_request.features
        )
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model not found or not ready"
        )


@router.post("/{model_id}/batch", response_model=BatchPredictionResponse)
async def batch_prediction(
    model_id: uuid.UUID,
    batch_request: BatchPredictionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> BatchPredictionResponse:
    """
    Make batch predictions using a trained model.
    
    - Process multiple samples in one request
    - More efficient than individual predictions
    """
    prediction_service = PredictionService(db)
    
    try:
        results = await prediction_service.batch_predict(
            model_id=model_id,
            user_id=current_user.id,
            samples=batch_request.samples
        )
        return results
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model not found or not ready"
        )


@router.get("/history", response_model=PredictionHistoryResponse)
async def get_prediction_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 50,
    model_id: uuid.UUID = None
) -> PredictionHistoryResponse:
    """Get prediction history for the current user."""
    prediction_service = PredictionService(db)
    
    predictions, total = await prediction_service.get_history(
        user_id=current_user.id,
        skip=skip,
        limit=limit,
        model_id=model_id
    )
    
    return PredictionHistoryResponse(
        predictions=predictions,
        total=total
    )
