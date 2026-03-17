"""
Database Models - SQLAlchemy ORM Models
"""
import uuid
from datetime import datetime
from enum import Enum as PyEnum
from typing import Optional, List

from sqlalchemy import (
    Boolean, Column, DateTime, Enum, Float, ForeignKey, 
    Integer, String, Text, JSON, Index
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, relationship, Mapped, mapped_column


class Base(DeclarativeBase):
    """Base model class."""
    pass


class SubscriptionTier(str, PyEnum):
    """Subscription tier enumeration."""
    FREE = "free"
    PRO = "pro"


class ModelStatus(str, PyEnum):
    """Model training status enumeration."""
    PENDING = "pending"
    TRAINING = "training"
    COMPLETED = "completed"
    FAILED = "failed"


class ModelType(str, PyEnum):
    """ML model type enumeration."""
    CLASSIFICATION = "classification"
    REGRESSION = "regression"


class User(Base):
    """User model for authentication and authorization."""
    __tablename__ = "users"
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[Optional[str]] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    
    # Relationships
    datasets: Mapped[List["Dataset"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    models: Mapped[List["MLModel"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    predictions: Mapped[List["Prediction"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    subscription: Mapped[Optional["Subscription"]] = relationship(back_populates="user", uselist=False)
    
    __table_args__ = (
        Index("idx_users_email", "email"),
    )


class Subscription(Base):
    """User subscription model for billing."""
    __tablename__ = "subscriptions"
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True
    )
    tier: Mapped[SubscriptionTier] = mapped_column(
        Enum(SubscriptionTier), default=SubscriptionTier.FREE
    )
    stripe_customer_id: Mapped[Optional[str]] = mapped_column(String(255))
    stripe_subscription_id: Mapped[Optional[str]] = mapped_column(String(255))
    training_jobs_used: Mapped[int] = mapped_column(Integer, default=0)
    training_jobs_limit: Mapped[int] = mapped_column(Integer, default=5)  # Free tier limit
    current_period_start: Mapped[Optional[datetime]] = mapped_column(DateTime)
    current_period_end: Mapped[Optional[datetime]] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    
    # Relationships
    user: Mapped["User"] = relationship(back_populates="subscription")


class Dataset(Base):
    """Dataset model for uploaded data files."""
    __tablename__ = "datasets"
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer)  # in bytes
    file_type: Mapped[str] = mapped_column(String(50))  # csv, xlsx
    row_count: Mapped[Optional[int]] = mapped_column(Integer)
    column_count: Mapped[Optional[int]] = mapped_column(Integer)
    columns: Mapped[Optional[dict]] = mapped_column(JSON)  # Column names and dtypes
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user: Mapped["User"] = relationship(back_populates="datasets")
    models: Mapped[List["MLModel"]] = relationship(back_populates="dataset")
    
    __table_args__ = (
        Index("idx_datasets_user_id", "user_id"),
    )


class MLModel(Base):
    """Machine learning model metadata."""
    __tablename__ = "ml_models"
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )
    dataset_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("datasets.id", ondelete="SET NULL"), nullable=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    model_type: Mapped[ModelType] = mapped_column(Enum(ModelType), nullable=False)
    algorithm: Mapped[str] = mapped_column(String(100), nullable=False)
    target_column: Mapped[str] = mapped_column(String(255), nullable=False)
    feature_columns: Mapped[list] = mapped_column(JSON, nullable=False)
    hyperparameters: Mapped[Optional[dict]] = mapped_column(JSON)
    status: Mapped[ModelStatus] = mapped_column(
        Enum(ModelStatus), default=ModelStatus.PENDING
    )
    model_path: Mapped[Optional[str]] = mapped_column(String(500))
    metrics: Mapped[Optional[dict]] = mapped_column(JSON)
    feature_importance: Mapped[Optional[dict]] = mapped_column(JSON)
    confusion_matrix: Mapped[Optional[list]] = mapped_column(JSON)
    training_time_seconds: Mapped[Optional[float]] = mapped_column(Float)
    error_message: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    
    # Relationships
    user: Mapped["User"] = relationship(back_populates="models")
    dataset: Mapped[Optional["Dataset"]] = relationship(back_populates="models")
    predictions: Mapped[List["Prediction"]] = relationship(back_populates="model")
    
    __table_args__ = (
        Index("idx_ml_models_user_id", "user_id"),
        Index("idx_ml_models_status", "status"),
    )


class Prediction(Base):
    """Prediction records."""
    __tablename__ = "predictions"
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )
    model_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ml_models.id", ondelete="CASCADE")
    )
    input_data: Mapped[dict] = mapped_column(JSON, nullable=False)
    prediction: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user: Mapped["User"] = relationship(back_populates="predictions")
    model: Mapped["MLModel"] = relationship(back_populates="predictions")
    
    __table_args__ = (
        Index("idx_predictions_user_id", "user_id"),
        Index("idx_predictions_model_id", "model_id"),
    )
