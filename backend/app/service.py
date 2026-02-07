from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.datasets import load_breast_cancer, load_diabetes
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler


MODEL_DIR = Path(__file__).resolve().parents[1] / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

REG_MODEL_PATH = MODEL_DIR / "regression.joblib"
CLF_MODEL_PATH = MODEL_DIR / "classification.joblib"


@dataclass
class RegressionBundle:
    model: Pipeline
    feature_names: List[str]
    target_name: str
    metrics: Dict[str, float]
    X: np.ndarray
    y: np.ndarray


@dataclass
class ClassificationBundle:
    model: Pipeline
    feature_names: List[str]
    target_names: List[str]
    metrics: Dict[str, float]
    X: np.ndarray
    y: np.ndarray


def load_or_train_models() -> Tuple[RegressionBundle, ClassificationBundle]:
    regression = _load_or_train_regression()
    classification = _load_or_train_classification()
    return regression, classification


def _load_or_train_regression() -> RegressionBundle:
    if REG_MODEL_PATH.exists():
        payload = joblib.load(REG_MODEL_PATH)
        return RegressionBundle(**payload)

    dataset = load_diabetes()
    X = dataset.data
    y = dataset.target
    feature_names = list(dataset.feature_names)
    target_name = "disease_progression"

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = Pipeline(
        [
            ("scaler", StandardScaler()),
            ("model", LinearRegression()),
        ]
    )
    model.fit(X_train, y_train)
    preds = model.predict(X_test)
    metrics = {
        "r2": float(r2_score(y_test, preds)),
        "mae": float(mean_absolute_error(y_test, preds)),
    }

    bundle = RegressionBundle(
        model=model,
        feature_names=feature_names,
        target_name=target_name,
        metrics=metrics,
        X=X,
        y=y,
    )
    joblib.dump(bundle.__dict__, REG_MODEL_PATH)
    return bundle


def _load_or_train_classification() -> ClassificationBundle:
    if CLF_MODEL_PATH.exists():
        payload = joblib.load(CLF_MODEL_PATH)
        return ClassificationBundle(**payload)

    dataset = load_breast_cancer()
    X = dataset.data
    y = dataset.target
    feature_names = list(dataset.feature_names)
    target_names = list(dataset.target_names)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = Pipeline(
        [
            ("scaler", StandardScaler()),
            (
                "model",
                LogisticRegression(max_iter=1000),
            ),
        ]
    )
    model.fit(X_train, y_train)
    preds = model.predict(X_test)
    metrics = {
        "accuracy": float(accuracy_score(y_test, preds)),
        "f1": float(f1_score(y_test, preds)),
    }

    bundle = ClassificationBundle(
        model=model,
        feature_names=feature_names,
        target_names=target_names,
        metrics=metrics,
        X=X,
        y=y,
    )
    joblib.dump(bundle.__dict__, CLF_MODEL_PATH)
    return bundle


def build_export_frame(
    bundle: RegressionBundle | ClassificationBundle,
    predictions: np.ndarray,
    label_names: List[str] | None = None,
) -> pd.DataFrame:
    data = pd.DataFrame(bundle.X, columns=bundle.feature_names)
    data["target"] = bundle.y

    if label_names:
        data["target_label"] = [label_names[int(val)] for val in bundle.y]
        data["prediction_label"] = [label_names[int(val)] for val in predictions]
    data["prediction"] = predictions
    return data
