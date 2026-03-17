"""
Dataset Service - File upload and dataset management
"""
import os
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional

import pandas as pd
from fastapi import UploadFile
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database.models import Dataset
from services.storage import StorageService


class DatasetService:
    """Service for managing datasets."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.storage = StorageService()
    
    async def create_dataset(
        self,
        user_id: uuid.UUID,
        file: UploadFile,
        name: str,
        description: Optional[str] = None
    ) -> Dataset:
        """Create a new dataset from uploaded file."""
        # Read file content
        content = await file.read()
        file_size = len(content)
        
        # Check file size limit
        max_size = settings.MAX_DATASET_SIZE_MB * 1024 * 1024
        if file_size > max_size:
            raise ValueError(f"File size exceeds {settings.MAX_DATASET_SIZE_MB}MB limit")
        
        # Determine file type
        filename = file.filename or "data.csv"
        file_ext = filename.split(".")[-1].lower()
        
        if file_ext not in ["csv", "xlsx", "xls"]:
            raise ValueError("Unsupported file format. Use CSV or Excel files.")
        
        # Parse file to get metadata
        try:
            if file_ext == "csv":
                df = pd.read_csv(pd.io.common.BytesIO(content))
            else:
                df = pd.read_excel(pd.io.common.BytesIO(content))
        except Exception as e:
            raise ValueError(f"Failed to parse file: {str(e)}")
        
        # Extract metadata
        columns = {col: str(df[col].dtype) for col in df.columns}
        row_count = len(df)
        column_count = len(df.columns)
        
        # Store file
        file_path = await self.storage.save_file(
            content=content,
            filename=f"{uuid.uuid4()}.{file_ext}",
            folder=f"datasets/{user_id}"
        )
        
        # Create database record
        dataset = Dataset(
            user_id=user_id,
            name=name,
            description=description,
            file_path=file_path,
            file_size=file_size,
            file_type=file_ext,
            row_count=row_count,
            column_count=column_count,
            columns=columns,
        )
        
        self.db.add(dataset)
        await self.db.commit()
        await self.db.refresh(dataset)
        
        return dataset
    
    async def get_dataset(
        self, 
        dataset_id: uuid.UUID, 
        user_id: uuid.UUID
    ) -> Optional[Dataset]:
        """Get dataset by ID for a specific user."""
        result = await self.db.execute(
            select(Dataset).where(
                Dataset.id == dataset_id,
                Dataset.user_id == user_id
            )
        )
        return result.scalar_one_or_none()
    
    async def get_user_datasets(
        self,
        user_id: uuid.UUID,
        skip: int = 0,
        limit: int = 50
    ) -> List[Dataset]:
        """Get all datasets for a user."""
        result = await self.db.execute(
            select(Dataset)
            .where(Dataset.user_id == user_id)
            .order_by(Dataset.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())
    
    async def count_user_datasets(self, user_id: uuid.UUID) -> int:
        """Count datasets for a user."""
        result = await self.db.execute(
            select(func.count(Dataset.id)).where(Dataset.user_id == user_id)
        )
        return result.scalar() or 0
    
    async def preview_dataset(
        self,
        dataset_id: uuid.UUID,
        user_id: uuid.UUID,
        rows: int = 10
    ) -> Optional[Dict[str, Any]]:
        """Preview first N rows of a dataset."""
        dataset = await self.get_dataset(dataset_id, user_id)
        if not dataset:
            return None
        
        # Load file
        content = await self.storage.read_file(dataset.file_path)
        
        if dataset.file_type == "csv":
            df = pd.read_csv(pd.io.common.BytesIO(content), nrows=rows)
        else:
            df = pd.read_excel(pd.io.common.BytesIO(content), nrows=rows)
        
        return {
            "columns": list(df.columns),
            "data": df.to_dict(orient="records"),
            "total_rows": dataset.row_count,
        }
    
    async def load_dataframe(
        self,
        dataset_id: uuid.UUID,
        user_id: uuid.UUID
    ) -> Optional[pd.DataFrame]:
        """Load full dataset as DataFrame."""
        dataset = await self.get_dataset(dataset_id, user_id)
        if not dataset:
            return None
        
        content = await self.storage.read_file(dataset.file_path)
        
        if dataset.file_type == "csv":
            return pd.read_csv(pd.io.common.BytesIO(content))
        else:
            return pd.read_excel(pd.io.common.BytesIO(content))
    
    async def delete_dataset(
        self,
        dataset_id: uuid.UUID,
        user_id: uuid.UUID
    ) -> bool:
        """Delete a dataset."""
        dataset = await self.get_dataset(dataset_id, user_id)
        if not dataset:
            return False
        
        # Delete file
        await self.storage.delete_file(dataset.file_path)
        
        # Delete record
        await self.db.delete(dataset)
        await self.db.commit()
        
        return True
