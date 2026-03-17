"""
Model Service - ML model training and management
"""
import time
import uuid
from typing import Any, Dict, List, Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database.models import MLModel, ModelStatus, ModelType, Dataset
from services.schemas import ModelTrainRequest
from services.dataset import DatasetService
from ml_pipeline.training import ModelTrainer
from ml_pipeline.storage import ModelStorage


class ModelService:
    """Service for managing ML models."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_model(
        self,
        user_id: uuid.UUID,
        train_request: ModelTrainRequest
    ) -> MLModel:
        """Create a new model record (pending training)."""
        model = MLModel(
            user_id=user_id,
            dataset_id=train_request.dataset_id,
            name=train_request.name,
            description=train_request.description,
            model_type=ModelType(train_request.model_type),
            algorithm=train_request.algorithm,
            target_column=train_request.target_column,
            feature_columns=train_request.feature_columns,
            hyperparameters=train_request.hyperparameters,
            status=ModelStatus.PENDING,
        )
        
        self.db.add(model)
        await self.db.commit()
        await self.db.refresh(model)
        
        return model
    
    async def train_model_background(
        self,
        model_id: uuid.UUID,
        train_request: ModelTrainRequest
    ):
        """
        Train model in background.
        
        This method is called by background task.
        """
        from database.connection import AsyncSessionLocal
        
        async with AsyncSessionLocal() as db:
            # Get model
            result = await db.execute(
                select(MLModel).where(MLModel.id == model_id)
            )
            model = result.scalar_one_or_none()
            if not model:
                return
            
            # Update status to training
            model.status = ModelStatus.TRAINING
            await db.commit()
            
            try:
                start_time = time.time()
                
                # Load dataset
                dataset_service = DatasetService(db)
                df = await dataset_service.load_dataframe(
                    train_request.dataset_id,
                    model.user_id
                )
                
                if df is None:
                    raise ValueError("Dataset not found")
                
                # Train model
                trainer = ModelTrainer(
                    model_type=train_request.model_type,
                    algorithm=train_request.algorithm,
                    hyperparameters=train_request.hyperparameters,
                )
                
                result = trainer.train(
                    df=df,
                    target_column=train_request.target_column,
                    feature_columns=train_request.feature_columns,
                    test_size=train_request.test_size,
                    cross_validation=train_request.cross_validation,
                    cv_folds=train_request.cv_folds,
                )
                
                training_time = time.time() - start_time
                
                # Save trained model
                storage = ModelStorage()
                model_path = storage.save_model(
                    model=result["model"],
                    model_id=str(model_id),
                    user_id=str(model.user_id),
                )
                
                # Update model record
                model.status = ModelStatus.COMPLETED
                model.model_path = model_path
                model.metrics = result["metrics"]
                model.feature_importance = result.get("feature_importance")
                model.confusion_matrix = result.get("confusion_matrix")
                model.training_time_seconds = training_time
                
                await db.commit()
                
            except Exception as e:
                model.status = ModelStatus.FAILED
                model.error_message = str(e)
                await db.commit()
    
    async def get_model(
        self,
        model_id: uuid.UUID,
        user_id: uuid.UUID
    ) -> Optional[MLModel]:
        """Get model by ID for a specific user."""
        result = await self.db.execute(
            select(MLModel).where(
                MLModel.id == model_id,
                MLModel.user_id == user_id
            )
        )
        return result.scalar_one_or_none()
    
    async def get_user_models(
        self,
        user_id: uuid.UUID,
        skip: int = 0,
        limit: int = 50,
        status_filter: Optional[ModelStatus] = None
    ) -> List[MLModel]:
        """Get all models for a user."""
        query = select(MLModel).where(MLModel.user_id == user_id)
        
        if status_filter:
            query = query.where(MLModel.status == status_filter)
        
        result = await self.db.execute(
            query.order_by(MLModel.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())
    
    async def count_user_models(
        self,
        user_id: uuid.UUID,
        status_filter: Optional[ModelStatus] = None
    ) -> int:
        """Count models for a user."""
        query = select(func.count(MLModel.id)).where(MLModel.user_id == user_id)
        
        if status_filter:
            query = query.where(MLModel.status == status_filter)
        
        result = await self.db.execute(query)
        return result.scalar() or 0
    
    async def delete_model(
        self,
        model_id: uuid.UUID,
        user_id: uuid.UUID
    ) -> bool:
        """Delete a model."""
        model = await self.get_model(model_id, user_id)
        if not model:
            return False
        
        # Delete model file if exists
        if model.model_path:
            storage = ModelStorage()
            storage.delete_model(model.model_path)
        
        # Delete record
        await self.db.delete(model)
        await self.db.commit()
        
        return True
