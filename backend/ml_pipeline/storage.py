"""
Model Storage Module

Handles saving and loading trained models.
"""
import os
from pathlib import Path
from typing import Any, Optional

import joblib

from config import settings


class ModelStorage:
    """Handle model persistence."""
    
    def __init__(self, base_path: Optional[str] = None):
        """
        Initialize model storage.
        
        Args:
            base_path: Base directory for model storage
        """
        self.base_path = Path(base_path or settings.MODEL_STORAGE_PATH)
        self.base_path.mkdir(parents=True, exist_ok=True)
    
    def save_model(
        self,
        model: Any,
        model_id: str,
        user_id: str,
        metadata: Optional[dict] = None
    ) -> str:
        """
        Save trained model to storage.
        
        Args:
            model: Trained model object (sklearn pipeline)
            model_id: Unique model identifier
            user_id: User who owns the model
            metadata: Optional metadata to save with model
            
        Returns:
            Path where model was saved
        """
        # Create user directory
        user_dir = self.base_path / user_id
        user_dir.mkdir(parents=True, exist_ok=True)
        
        # Save model
        model_path = user_dir / f"{model_id}.joblib"
        
        save_data = {
            "model": model,
            "metadata": metadata or {},
        }
        
        joblib.dump(save_data, model_path)
        
        return str(model_path.relative_to(self.base_path))
    
    def load_model(self, model_path: str) -> Any:
        """
        Load model from storage.
        
        Args:
            model_path: Relative path to model file
            
        Returns:
            Loaded model object
        """
        full_path = self.base_path / model_path
        
        if not full_path.exists():
            raise FileNotFoundError(f"Model not found: {model_path}")
        
        save_data = joblib.load(full_path)
        
        # Handle both old and new format
        if isinstance(save_data, dict) and "model" in save_data:
            return save_data["model"]
        return save_data
    
    def load_model_with_metadata(self, model_path: str) -> tuple[Any, dict]:
        """
        Load model and its metadata.
        
        Args:
            model_path: Relative path to model file
            
        Returns:
            Tuple of (model, metadata)
        """
        full_path = self.base_path / model_path
        
        if not full_path.exists():
            raise FileNotFoundError(f"Model not found: {model_path}")
        
        save_data = joblib.load(full_path)
        
        if isinstance(save_data, dict) and "model" in save_data:
            return save_data["model"], save_data.get("metadata", {})
        return save_data, {}
    
    def delete_model(self, model_path: str) -> bool:
        """
        Delete model from storage.
        
        Args:
            model_path: Relative path to model file
            
        Returns:
            True if deleted, False if not found
        """
        full_path = self.base_path / model_path
        
        try:
            os.remove(full_path)
            return True
        except FileNotFoundError:
            return False
    
    def model_exists(self, model_path: str) -> bool:
        """Check if model exists."""
        full_path = self.base_path / model_path
        return full_path.exists()
    
    def get_model_size(self, model_path: str) -> int:
        """
        Get model file size in bytes.
        
        Args:
            model_path: Relative path to model file
            
        Returns:
            File size in bytes
        """
        full_path = self.base_path / model_path
        
        if not full_path.exists():
            return 0
        
        return full_path.stat().st_size
    
    def list_user_models(self, user_id: str) -> list[str]:
        """
        List all model files for a user.
        
        Args:
            user_id: User identifier
            
        Returns:
            List of model file paths
        """
        user_dir = self.base_path / user_id
        
        if not user_dir.exists():
            return []
        
        return [
            str(f.relative_to(self.base_path))
            for f in user_dir.glob("*.joblib")
        ]
