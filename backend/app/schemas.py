from typing import Dict, List

from pydantic import BaseModel, Field


class PredictionRequest(BaseModel):
    features: Dict[str, float] = Field(..., description="Feature values keyed by feature name")


class RegressionPrediction(BaseModel):
    prediction: float


class ClassificationPrediction(BaseModel):
    label: str
    probability: float
    class_probabilities: Dict[str, float]


class MetricsResponse(BaseModel):
    regression: Dict[str, float]
    classification: Dict[str, float]


class MetadataResponse(BaseModel):
    regression_features: List[str]
    classification_features: List[str]
    regression_target: str
    classification_targets: List[str]
