"""
Model Evaluation Module

Handles model evaluation metrics and visualization data.
"""
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from sklearn.metrics import (
    # Classification metrics
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    classification_report,
    confusion_matrix,
    # Regression metrics
    mean_absolute_error,
    mean_squared_error,
    r2_score,
    mean_absolute_percentage_error,
)


class ModelEvaluator:
    """Evaluate machine learning models."""
    
    def __init__(self, model_type: str):
        """
        Initialize evaluator.
        
        Args:
            model_type: "classification" or "regression"
        """
        self.model_type = model_type
    
    def calculate_metrics(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray,
        y_pred_proba: Optional[np.ndarray] = None
    ) -> Dict[str, float]:
        """
        Calculate evaluation metrics.
        
        Args:
            y_true: True labels/values
            y_pred: Predicted labels/values
            y_pred_proba: Prediction probabilities (classification only)
            
        Returns:
            Dictionary of metric names and values
        """
        if self.model_type == "classification":
            return self._classification_metrics(y_true, y_pred, y_pred_proba)
        else:
            return self._regression_metrics(y_true, y_pred)
    
    def _classification_metrics(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray,
        y_pred_proba: Optional[np.ndarray] = None
    ) -> Dict[str, float]:
        """Calculate classification metrics."""
        metrics = {
            "accuracy": float(accuracy_score(y_true, y_pred)),
            "precision": float(precision_score(y_true, y_pred, average="weighted", zero_division=0)),
            "recall": float(recall_score(y_true, y_pred, average="weighted", zero_division=0)),
            "f1": float(f1_score(y_true, y_pred, average="weighted", zero_division=0)),
        }
        
        # ROC AUC (binary or multi-class)
        if y_pred_proba is not None:
            try:
                if len(np.unique(y_true)) == 2:
                    # Binary classification
                    metrics["roc_auc"] = float(roc_auc_score(y_true, y_pred_proba[:, 1]))
                else:
                    # Multi-class
                    metrics["roc_auc"] = float(roc_auc_score(
                        y_true, y_pred_proba, multi_class="ovr", average="weighted"
                    ))
            except ValueError:
                # ROC AUC not computable
                pass
        
        return metrics
    
    def _regression_metrics(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray
    ) -> Dict[str, float]:
        """Calculate regression metrics."""
        metrics = {
            "r2": float(r2_score(y_true, y_pred)),
            "mae": float(mean_absolute_error(y_true, y_pred)),
            "mse": float(mean_squared_error(y_true, y_pred)),
            "rmse": float(np.sqrt(mean_squared_error(y_true, y_pred))),
        }
        
        # MAPE (avoid division by zero)
        try:
            metrics["mape"] = float(mean_absolute_percentage_error(y_true, y_pred))
        except ValueError:
            pass
        
        return metrics
    
    def get_confusion_matrix(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray
    ) -> List[List[int]]:
        """
        Get confusion matrix.
        
        Returns:
            2D list representing confusion matrix
        """
        cm = confusion_matrix(y_true, y_pred)
        return cm.tolist()
    
    def get_classification_report(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray,
        target_names: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Get detailed classification report.
        
        Returns:
            Dictionary with per-class metrics
        """
        report = classification_report(
            y_true, y_pred,
            target_names=target_names,
            output_dict=True,
            zero_division=0
        )
        return report
    
    def get_roc_curve_data(
        self,
        y_true: np.ndarray,
        y_pred_proba: np.ndarray
    ) -> Dict[str, List[float]]:
        """
        Get ROC curve data for visualization.
        
        Returns:
            Dictionary with fpr, tpr, and thresholds
        """
        from sklearn.metrics import roc_curve
        
        if y_pred_proba.ndim == 2:
            # Binary classification - use positive class probability
            y_score = y_pred_proba[:, 1]
        else:
            y_score = y_pred_proba
        
        fpr, tpr, thresholds = roc_curve(y_true, y_score)
        
        return {
            "fpr": fpr.tolist(),
            "tpr": tpr.tolist(),
            "thresholds": thresholds.tolist(),
        }
    
    def get_precision_recall_curve_data(
        self,
        y_true: np.ndarray,
        y_pred_proba: np.ndarray
    ) -> Dict[str, List[float]]:
        """
        Get precision-recall curve data for visualization.
        
        Returns:
            Dictionary with precision, recall, and thresholds
        """
        from sklearn.metrics import precision_recall_curve
        
        if y_pred_proba.ndim == 2:
            y_score = y_pred_proba[:, 1]
        else:
            y_score = y_pred_proba
        
        precision, recall, thresholds = precision_recall_curve(y_true, y_score)
        
        return {
            "precision": precision.tolist(),
            "recall": recall.tolist(),
            "thresholds": thresholds.tolist(),
        }


def compare_models(
    evaluations: List[Dict[str, Any]],
    model_names: List[str],
    metric: str = "accuracy"
) -> Dict[str, Any]:
    """
    Compare multiple model evaluations.
    
    Args:
        evaluations: List of evaluation dictionaries
        model_names: List of model names
        metric: Metric to compare
        
    Returns:
        Comparison summary
    """
    scores = [eval_dict["metrics"].get(metric, 0) for eval_dict in evaluations]
    
    best_idx = np.argmax(scores)
    
    return {
        "scores": dict(zip(model_names, scores)),
        "best_model": model_names[best_idx],
        "best_score": scores[best_idx],
        "metric": metric,
    }
