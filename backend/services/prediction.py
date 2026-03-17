"""
Prediction Service - Run predictions using trained models
"""
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from database.models import MLModel, ModelStatus, ModelType, Prediction
from ml_pipeline.storage import ModelStorage
from services.schemas import PredictionResponse, BatchPredictionResponse, PredictionHistoryItem


class PredictionService:
    """Service for predictions."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.storage = ModelStorage()
    
    async def predict(
        self,
        model_id: uuid.UUID,
        user_id: uuid.UUID,
        features: Dict[str, Any]
    ) -> PredictionResponse:
        """Make a single prediction."""
        # Get model
        result = await self.db.execute(
            select(MLModel).where(
                MLModel.id == model_id,
                MLModel.user_id == user_id
            )
        )
        model_record = result.scalar_one_or_none()
        
        if not model_record:
            raise FileNotFoundError("Model not found")
        
        if model_record.status != ModelStatus.COMPLETED:
            raise ValueError("Model is not ready for predictions")
        
        # Validate features
        missing = [f for f in model_record.feature_columns if f not in features]
        if missing:
            raise ValueError(f"Missing features: {missing}")
        
        # Load model
        model = self.storage.load_model(model_record.model_path)
        
        # Prepare input
        feature_values = [features[col] for col in model_record.feature_columns]
        X = np.array(feature_values).reshape(1, -1)
        
        # Make prediction
        prediction_value = model.predict(X)[0]
        
        probability = None
        if model_record.model_type == ModelType.CLASSIFICATION:
            if hasattr(model, "predict_proba"):
                proba = model.predict_proba(X)[0]
                # Create probability dict if we have class names
                probability = {f"class_{i}": float(p) for i, p in enumerate(proba)}
        
        # Convert numpy types to Python types
        if isinstance(prediction_value, np.generic):
            prediction_value = prediction_value.item()
        
        # Save prediction record
        prediction_record = Prediction(
            user_id=user_id,
            model_id=model_id,
            input_data=features,
            prediction={
                "value": prediction_value,
                "probability": probability,
            },
        )
        self.db.add(prediction_record)
        await self.db.commit()
        
        return PredictionResponse(
            prediction=prediction_value,
            probability=probability,
            model_id=model_id,
            created_at=datetime.utcnow(),
        )
    
    async def batch_predict(
        self,
        model_id: uuid.UUID,
        user_id: uuid.UUID,
        samples: List[Dict[str, Any]]
    ) -> BatchPredictionResponse:
        """Make batch predictions."""
        # Get model
        result = await self.db.execute(
            select(MLModel).where(
                MLModel.id == model_id,
                MLModel.user_id == user_id
            )
        )
        model_record = result.scalar_one_or_none()
        
        if not model_record:
            raise FileNotFoundError("Model not found")
        
        if model_record.status != ModelStatus.COMPLETED:
            raise ValueError("Model is not ready for predictions")
        
        # Validate all samples
        for sample in samples:
            missing = [f for f in model_record.feature_columns if f not in sample]
            if missing:
                raise ValueError(f"Missing features in sample: {missing}")
        
        # Load model
        model = self.storage.load_model(model_record.model_path)
        
        # Prepare input matrix
        X = np.array([
            [sample[col] for col in model_record.feature_columns]
            for sample in samples
        ])
        
        # Make predictions
        predictions = model.predict(X).tolist()
        
        probabilities = None
        if model_record.model_type == ModelType.CLASSIFICATION:
            if hasattr(model, "predict_proba"):
                proba = model.predict_proba(X)
                probabilities = [
                    {f"class_{i}": float(p) for i, p in enumerate(row)}
                    for row in proba
                ]
        
        return BatchPredictionResponse(
            predictions=predictions,
            probabilities=probabilities,
            model_id=model_id,
            count=len(predictions),
        )
    
    async def get_history(
        self,
        user_id: uuid.UUID,
        skip: int = 0,
        limit: int = 50,
        model_id: Optional[uuid.UUID] = None
    ) -> Tuple[List[PredictionHistoryItem], int]:
        """Get prediction history."""
        query = (
            select(Prediction, MLModel.name)
            .join(MLModel, Prediction.model_id == MLModel.id)
            .where(Prediction.user_id == user_id)
        )
        
        if model_id:
            query = query.where(Prediction.model_id == model_id)
        
        # Count total
        count_query = select(func.count(Prediction.id)).where(
            Prediction.user_id == user_id
        )
        if model_id:
            count_query = count_query.where(Prediction.model_id == model_id)
        
        count_result = await self.db.execute(count_query)
        total = count_result.scalar() or 0
        
        # Get predictions
        result = await self.db.execute(
            query.order_by(Prediction.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        
        predictions = []
        for pred, model_name in result.all():
            predictions.append(PredictionHistoryItem(
                id=pred.id,
                model_id=pred.model_id,
                model_name=model_name,
                input_data=pred.input_data,
                prediction=pred.prediction,
                created_at=pred.created_at,
            ))
        
        return predictions, total
