"""
Pydantic Schemas for API Request/Response Validation
"""
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, EmailStr, Field, ConfigDict


# ============== Auth Schemas ==============

class UserCreate(BaseModel):
    """User registration schema."""
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: Optional[str] = None


class UserUpdate(BaseModel):
    """User update schema."""
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None


class UserResponse(BaseModel):
    """User response schema."""
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    email: str
    full_name: Optional[str]
    is_active: bool
    is_verified: bool
    created_at: datetime


class Token(BaseModel):
    """JWT token response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefresh(BaseModel):
    """Token refresh request."""
    refresh_token: str


class PasswordReset(BaseModel):
    """Password reset request."""
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Password reset confirmation."""
    token: str
    new_password: str = Field(..., min_length=8)


class MessageResponse(BaseModel):
    """Generic message response."""
    message: str


# ============== Dataset Schemas ==============

class DatasetResponse(BaseModel):
    """Dataset response schema."""
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    name: str
    description: Optional[str]
    file_type: str
    file_size: int
    row_count: Optional[int]
    column_count: Optional[int]
    columns: Optional[Dict[str, str]]  # column_name: dtype
    created_at: datetime


class DatasetListResponse(BaseModel):
    """Dataset list response."""
    datasets: List[DatasetResponse]
    total: int


class DatasetPreview(BaseModel):
    """Dataset preview response."""
    columns: List[str]
    data: List[Dict[str, Any]]
    total_rows: int


# ============== Model Schemas ==============

class ModelTrainRequest(BaseModel):
    """Model training request."""
    dataset_id: uuid.UUID
    name: str
    description: Optional[str] = None
    model_type: str = Field(..., pattern="^(classification|regression)$")
    algorithm: str = Field(
        ..., 
        pattern="^(random_forest|xgboost|logistic_regression|linear_regression|gradient_boosting|svm)$"
    )
    target_column: str
    feature_columns: List[str]
    hyperparameters: Optional[Dict[str, Any]] = None
    test_size: float = Field(default=0.2, ge=0.1, le=0.5)
    cross_validation: bool = True
    cv_folds: int = Field(default=5, ge=2, le=10)


class ModelResponse(BaseModel):
    """Model response schema."""
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    name: str
    description: Optional[str]
    model_type: str
    algorithm: str
    target_column: str
    feature_columns: List[str]
    status: str
    metrics: Optional[Dict[str, float]]
    training_time_seconds: Optional[float]
    error_message: Optional[str]
    created_at: datetime
    updated_at: datetime


class ModelListResponse(BaseModel):
    """Model list response."""
    models: List[ModelResponse]
    total: int


class ModelMetricsResponse(BaseModel):
    """Detailed model metrics response."""
    model_id: uuid.UUID
    metrics: Dict[str, float]
    feature_importance: Dict[str, float]
    confusion_matrix: Optional[List[List[int]]]
    training_time_seconds: Optional[float]


# ============== Prediction Schemas ==============

class PredictionRequest(BaseModel):
    """Single prediction request."""
    features: Dict[str, Any]


class PredictionResponse(BaseModel):
    """Prediction response."""
    prediction: Any
    probability: Optional[Dict[str, float]] = None
    model_id: uuid.UUID
    created_at: datetime


class BatchPredictionRequest(BaseModel):
    """Batch prediction request."""
    samples: List[Dict[str, Any]]


class BatchPredictionResponse(BaseModel):
    """Batch prediction response."""
    predictions: List[Any]
    probabilities: Optional[List[Dict[str, float]]] = None
    model_id: uuid.UUID
    count: int


class PredictionHistoryItem(BaseModel):
    """Prediction history item."""
    id: uuid.UUID
    model_id: uuid.UUID
    model_name: str
    input_data: Dict[str, Any]
    prediction: Dict[str, Any]
    created_at: datetime


class PredictionHistoryResponse(BaseModel):
    """Prediction history response."""
    predictions: List[PredictionHistoryItem]
    total: int


# ============== Billing Schemas ==============

class SubscriptionResponse(BaseModel):
    """Subscription details response."""
    tier: str
    training_jobs_used: int
    training_jobs_limit: int
    is_unlimited: bool
    current_period_end: Optional[datetime]


class CheckoutSessionResponse(BaseModel):
    """Stripe checkout session response."""
    checkout_url: str
    session_id: str
