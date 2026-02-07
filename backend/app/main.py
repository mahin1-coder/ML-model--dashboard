from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Dict

import numpy as np
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response

from app.schemas import (
    ClassificationPrediction,
    MetadataResponse,
    MetricsResponse,
    PredictionRequest,
    RegressionPrediction,
)
from app.service import (
    ClassificationBundle,
    RegressionBundle,
    build_export_frame,
    load_or_train_models,
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    regression, classification = load_or_train_models()
    app.state.regression = regression
    app.state.classification = classification
    yield


app = FastAPI(
    title="ML Model Deployment Dashboard",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"] ,
    allow_headers=["*"],
)


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.get("/metadata", response_model=MetadataResponse)
def metadata() -> MetadataResponse:
    regression: RegressionBundle = app.state.regression
    classification: ClassificationBundle = app.state.classification

    return MetadataResponse(
        regression_features=regression.feature_names,
        classification_features=classification.feature_names,
        regression_target=regression.target_name,
        classification_targets=classification.target_names,
    )


@app.get("/metrics", response_model=MetricsResponse)
def metrics() -> MetricsResponse:
    regression: RegressionBundle = app.state.regression
    classification: ClassificationBundle = app.state.classification
    return MetricsResponse(
        regression=regression.metrics,
        classification=classification.metrics,
    )


def _vectorize(features: Dict[str, float], expected: list[str]) -> np.ndarray:
    missing = [name for name in expected if name not in features]
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing features: {missing}")
    return np.array([features[name] for name in expected], dtype=float).reshape(1, -1)


@app.post("/predict/regression", response_model=RegressionPrediction)
def predict_regression(payload: PredictionRequest) -> RegressionPrediction:
    regression: RegressionBundle = app.state.regression
    vector = _vectorize(payload.features, regression.feature_names)
    prediction = float(regression.model.predict(vector)[0])
    return RegressionPrediction(prediction=prediction)


@app.post("/predict/classification", response_model=ClassificationPrediction)
def predict_classification(payload: PredictionRequest) -> ClassificationPrediction:
    classification: ClassificationBundle = app.state.classification
    vector = _vectorize(payload.features, classification.feature_names)
    probs = classification.model.predict_proba(vector)[0]
    label_index = int(np.argmax(probs))
    label = classification.target_names[label_index]
    class_probabilities = {
        name: float(prob) for name, prob in zip(classification.target_names, probs)
    }
    return ClassificationPrediction(
        label=label,
        probability=float(probs[label_index]),
        class_probabilities=class_probabilities,
    )


@app.get("/export/regression")
def export_regression(format: str = Query("csv", pattern="^(csv|json)$")) -> Response:
    regression: RegressionBundle = app.state.regression
    predictions = regression.model.predict(regression.X)
    frame = build_export_frame(regression, predictions)

    if format == "json":
        return JSONResponse(frame.to_dict(orient="records"))
    return Response(content=frame.to_csv(index=False), media_type="text/csv")


@app.get("/export/classification")
def export_classification(format: str = Query("csv", pattern="^(csv|json)$")) -> Response:
    classification: ClassificationBundle = app.state.classification
    predictions = classification.model.predict(classification.X)
    frame = build_export_frame(
        classification,
        predictions,
        label_names=classification.target_names,
    )

    if format == "json":
        return JSONResponse(frame.to_dict(orient="records"))
    return Response(content=frame.to_csv(index=False), media_type="text/csv")
