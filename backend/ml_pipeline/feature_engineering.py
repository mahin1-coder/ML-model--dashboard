"""
Feature Engineering Module

Handles feature creation, selection, and transformation.
"""
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler, MinMaxScaler, PolynomialFeatures
from sklearn.feature_selection import (
    SelectKBest, f_classif, f_regression, 
    mutual_info_classif, mutual_info_regression
)


class FeatureEngineer:
    """Handle feature engineering operations."""
    
    def __init__(
        self,
        scaling: str = "standard",  # "standard", "minmax", or "none"
        create_interactions: bool = False,
        polynomial_degree: int = 2,
    ):
        self.scaling = scaling
        self.create_interactions = create_interactions
        self.polynomial_degree = polynomial_degree
        
        self.scaler: Optional[StandardScaler | MinMaxScaler] = None
        self.poly_features: Optional[PolynomialFeatures] = None
        self.feature_names: List[str] = []
        self.original_feature_names: List[str] = []
    
    def fit(
        self,
        X: np.ndarray,
        feature_names: List[str],
        y: Optional[np.ndarray] = None
    ) -> "FeatureEngineer":
        """
        Fit feature engineering pipeline.
        
        Args:
            X: Feature matrix
            feature_names: Original feature names
            y: Target array (optional, for supervised methods)
        """
        self.original_feature_names = feature_names
        current_features = feature_names.copy()
        
        # Create polynomial/interaction features
        if self.create_interactions:
            self.poly_features = PolynomialFeatures(
                degree=self.polynomial_degree,
                include_bias=False,
                interaction_only=True
            )
            X = self.poly_features.fit_transform(X)
            current_features = list(self.poly_features.get_feature_names_out(feature_names))
        
        # Fit scaler
        if self.scaling == "standard":
            self.scaler = StandardScaler()
            self.scaler.fit(X)
        elif self.scaling == "minmax":
            self.scaler = MinMaxScaler()
            self.scaler.fit(X)
        
        self.feature_names = current_features
        return self
    
    def transform(self, X: np.ndarray) -> np.ndarray:
        """
        Transform features.
        
        Args:
            X: Feature matrix
            
        Returns:
            Transformed feature matrix
        """
        # Polynomial features
        if self.poly_features is not None:
            X = self.poly_features.transform(X)
        
        # Scaling
        if self.scaler is not None:
            X = self.scaler.transform(X)
        
        return X
    
    def fit_transform(
        self,
        X: np.ndarray,
        feature_names: List[str],
        y: Optional[np.ndarray] = None
    ) -> np.ndarray:
        """Fit and transform in one step."""
        self.fit(X, feature_names, y)
        return self.transform(X)
    
    def get_feature_names(self) -> List[str]:
        """Get transformed feature names."""
        return self.feature_names


def select_best_features(
    X: np.ndarray,
    y: np.ndarray,
    feature_names: List[str],
    n_features: int = 10,
    task: str = "classification",
    method: str = "f_score"
) -> Tuple[np.ndarray, List[str], Dict[str, float]]:
    """
    Select best features using statistical tests.
    
    Args:
        X: Feature matrix
        y: Target array
        feature_names: Feature names
        n_features: Number of features to select
        task: "classification" or "regression"
        method: "f_score" or "mutual_info"
        
    Returns:
        Tuple of (selected features, selected names, feature scores)
    """
    n_features = min(n_features, X.shape[1])
    
    # Select scoring function
    if task == "classification":
        score_func = f_classif if method == "f_score" else mutual_info_classif
    else:
        score_func = f_regression if method == "f_score" else mutual_info_regression
    
    # Fit selector
    selector = SelectKBest(score_func=score_func, k=n_features)
    X_selected = selector.fit_transform(X, y)
    
    # Get selected feature info
    selected_mask = selector.get_support()
    selected_names = [name for name, mask in zip(feature_names, selected_mask) if mask]
    
    # Get scores for all features
    scores = dict(zip(feature_names, selector.scores_))
    
    return X_selected, selected_names, scores


def create_time_features(df: pd.DataFrame, date_column: str) -> pd.DataFrame:
    """
    Create time-based features from a date column.
    
    Args:
        df: Dataframe with date column
        date_column: Name of date column
        
    Returns:
        Dataframe with additional time features
    """
    df = df.copy()
    
    # Convert to datetime
    df[date_column] = pd.to_datetime(df[date_column])
    
    # Extract features
    prefix = date_column
    df[f"{prefix}_year"] = df[date_column].dt.year
    df[f"{prefix}_month"] = df[date_column].dt.month
    df[f"{prefix}_day"] = df[date_column].dt.day
    df[f"{prefix}_dayofweek"] = df[date_column].dt.dayofweek
    df[f"{prefix}_quarter"] = df[date_column].dt.quarter
    df[f"{prefix}_is_weekend"] = df[date_column].dt.dayofweek >= 5
    
    return df


def create_aggregation_features(
    df: pd.DataFrame,
    group_column: str,
    agg_column: str,
    operations: List[str] = ["mean", "std", "min", "max"]
) -> pd.DataFrame:
    """
    Create aggregation features for a column grouped by another column.
    
    Args:
        df: Input dataframe
        group_column: Column to group by
        agg_column: Column to aggregate
        operations: List of aggregation operations
        
    Returns:
        Dataframe with additional aggregation features
    """
    df = df.copy()
    
    for op in operations:
        feature_name = f"{agg_column}_{op}_by_{group_column}"
        df[feature_name] = df.groupby(group_column)[agg_column].transform(op)
    
    return df
