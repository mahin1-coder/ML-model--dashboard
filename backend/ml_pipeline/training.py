"""
Model Training Module

Handles model training with various algorithms and hyperparameter tuning.
"""
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.linear_model import LogisticRegression, LinearRegression, Ridge, Lasso
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, GradientBoostingClassifier, GradientBoostingRegressor
from sklearn.svm import SVC, SVR
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

try:
    import xgboost as xgb
    # Test if xgboost actually works
    _ = xgb.XGBClassifier
    HAS_XGBOOST = True
except (ImportError, Exception):
    HAS_XGBOOST = False
    xgb = None

from ml_pipeline.evaluation import ModelEvaluator


# Default hyperparameters for each algorithm
DEFAULT_HYPERPARAMETERS = {
    "random_forest": {
        "n_estimators": 100,
        "max_depth": 10,
        "min_samples_split": 2,
        "min_samples_leaf": 1,
        "random_state": 42,
    },
    "xgboost": {
        "n_estimators": 100,
        "max_depth": 6,
        "learning_rate": 0.1,
        "random_state": 42,
    },
    "logistic_regression": {
        "C": 1.0,
        "max_iter": 1000,
        "random_state": 42,
    },
    "linear_regression": {},
    "gradient_boosting": {
        "n_estimators": 100,
        "max_depth": 5,
        "learning_rate": 0.1,
        "random_state": 42,
    },
    "svm": {
        "C": 1.0,
        "kernel": "rbf",
        "random_state": 42,
    },
}

# Hyperparameter grids for tuning
HYPERPARAMETER_GRIDS = {
    "random_forest": {
        "n_estimators": [50, 100, 200],
        "max_depth": [5, 10, 15, None],
        "min_samples_split": [2, 5, 10],
    },
    "xgboost": {
        "n_estimators": [50, 100, 200],
        "max_depth": [3, 6, 9],
        "learning_rate": [0.01, 0.1, 0.2],
    },
    "logistic_regression": {
        "C": [0.01, 0.1, 1.0, 10.0],
    },
    "gradient_boosting": {
        "n_estimators": [50, 100, 200],
        "max_depth": [3, 5, 7],
        "learning_rate": [0.01, 0.1, 0.2],
    },
}


class ModelTrainer:
    """Train machine learning models."""
    
    def __init__(
        self,
        model_type: str,  # "classification" or "regression"
        algorithm: str,
        hyperparameters: Optional[Dict[str, Any]] = None,
    ):
        self.model_type = model_type
        self.algorithm = algorithm
        self.hyperparameters = hyperparameters or {}
        self.evaluator = ModelEvaluator(model_type)
    
    def _get_model(self) -> Any:
        """Get model instance based on algorithm."""
        # Merge default and custom hyperparameters
        params = DEFAULT_HYPERPARAMETERS.get(self.algorithm, {}).copy()
        params.update(self.hyperparameters)
        
        if self.model_type == "classification":
            if self.algorithm == "random_forest":
                return RandomForestClassifier(**params)
            elif self.algorithm == "xgboost":
                if not HAS_XGBOOST:
                    raise ImportError("XGBoost is not installed")
                return xgb.XGBClassifier(**params, use_label_encoder=False, eval_metric="logloss")
            elif self.algorithm == "logistic_regression":
                return LogisticRegression(**params)
            elif self.algorithm == "gradient_boosting":
                return GradientBoostingClassifier(**params)
            elif self.algorithm == "svm":
                return SVC(**params, probability=True)
            else:
                raise ValueError(f"Unknown classification algorithm: {self.algorithm}")
        
        else:  # regression
            if self.algorithm == "random_forest":
                return RandomForestRegressor(**params)
            elif self.algorithm == "xgboost":
                if not HAS_XGBOOST:
                    raise ImportError("XGBoost is not installed")
                return xgb.XGBRegressor(**params)
            elif self.algorithm == "linear_regression":
                return LinearRegression()
            elif self.algorithm == "gradient_boosting":
                return GradientBoostingRegressor(**params)
            elif self.algorithm == "svm":
                params.pop("random_state", None)
                return SVR(**params)
            else:
                raise ValueError(f"Unknown regression algorithm: {self.algorithm}")
    
    def train(
        self,
        df: pd.DataFrame,
        target_column: str,
        feature_columns: List[str],
        test_size: float = 0.2,
        cross_validation: bool = True,
        cv_folds: int = 5,
        tune_hyperparameters: bool = False,
    ) -> Dict[str, Any]:
        """
        Train a model on the provided data.
        
        Args:
            df: Training dataframe
            target_column: Target column name
            feature_columns: List of feature column names
            test_size: Test split ratio
            cross_validation: Whether to perform cross-validation
            cv_folds: Number of CV folds
            tune_hyperparameters: Whether to tune hyperparameters
            
        Returns:
            Dictionary with trained model, metrics, and feature importance
        """
        # Prepare data
        X = df[feature_columns].values
        y = df[target_column].values
        
        # Handle missing values
        X = np.nan_to_num(X, nan=0.0)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42
        )
        
        # Create pipeline with scaling
        model = self._get_model()
        pipeline = Pipeline([
            ("scaler", StandardScaler()),
            ("model", model),
        ])
        
        # Hyperparameter tuning
        if tune_hyperparameters and self.algorithm in HYPERPARAMETER_GRIDS:
            param_grid = {
                f"model__{k}": v 
                for k, v in HYPERPARAMETER_GRIDS[self.algorithm].items()
            }
            grid_search = GridSearchCV(
                pipeline, param_grid, cv=cv_folds, n_jobs=-1, scoring="accuracy" if self.model_type == "classification" else "r2"
            )
            grid_search.fit(X_train, y_train)
            pipeline = grid_search.best_estimator_
        else:
            pipeline.fit(X_train, y_train)
        
        # Cross-validation scores
        cv_scores = None
        if cross_validation:
            scoring = "accuracy" if self.model_type == "classification" else "r2"
            cv_scores = cross_val_score(pipeline, X_train, y_train, cv=cv_folds, scoring=scoring)
        
        # Predictions
        y_pred = pipeline.predict(X_test)
        y_pred_proba = None
        if self.model_type == "classification" and hasattr(pipeline, "predict_proba"):
            y_pred_proba = pipeline.predict_proba(X_test)
        
        # Calculate metrics
        metrics = self.evaluator.calculate_metrics(y_test, y_pred, y_pred_proba)
        
        if cv_scores is not None:
            metrics["cv_mean"] = float(cv_scores.mean())
            metrics["cv_std"] = float(cv_scores.std())
        
        # Feature importance
        feature_importance = self._get_feature_importance(pipeline, feature_columns)
        
        # Confusion matrix for classification
        confusion_matrix = None
        if self.model_type == "classification":
            confusion_matrix = self.evaluator.get_confusion_matrix(y_test, y_pred)
        
        return {
            "model": pipeline,
            "metrics": metrics,
            "feature_importance": feature_importance,
            "confusion_matrix": confusion_matrix,
            "cv_scores": cv_scores.tolist() if cv_scores is not None else None,
        }
    
    def _get_feature_importance(
        self,
        pipeline: Pipeline,
        feature_names: List[str]
    ) -> Dict[str, float]:
        """Extract feature importance from model."""
        model = pipeline.named_steps["model"]
        
        importance = None
        
        if hasattr(model, "feature_importances_"):
            importance = model.feature_importances_
        elif hasattr(model, "coef_"):
            importance = np.abs(model.coef_).flatten()
            if len(importance) != len(feature_names):
                # Multi-class case - average across classes
                importance = np.abs(model.coef_).mean(axis=0)
        
        if importance is not None:
            # Normalize to sum to 1
            importance = importance / importance.sum()
            return dict(zip(feature_names, importance.tolist()))
        
        return {}
