"""
Data Preprocessing Module

Handles data cleaning, missing value imputation, and data transformation.
"""
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import LabelEncoder


class DataPreprocessor:
    """Handle data preprocessing operations."""
    
    def __init__(self):
        self.imputers: Dict[str, SimpleImputer] = {}
        self.label_encoders: Dict[str, LabelEncoder] = {}
        self.numeric_columns: List[str] = []
        self.categorical_columns: List[str] = []
        self.column_dtypes: Dict[str, str] = {}
    
    def fit(self, df: pd.DataFrame, target_column: Optional[str] = None) -> "DataPreprocessor":
        """
        Fit preprocessor on training data.
        
        Args:
            df: Training dataframe
            target_column: Target column to exclude from feature processing
        """
        # Identify column types
        for col in df.columns:
            if col == target_column:
                continue
            
            dtype = df[col].dtype
            if np.issubdtype(dtype, np.number):
                self.numeric_columns.append(col)
                self.column_dtypes[col] = "numeric"
            else:
                self.categorical_columns.append(col)
                self.column_dtypes[col] = "categorical"
        
        # Fit numeric imputers
        for col in self.numeric_columns:
            imputer = SimpleImputer(strategy="median")
            imputer.fit(df[[col]])
            self.imputers[col] = imputer
        
        # Fit categorical imputers and encoders
        for col in self.categorical_columns:
            # Imputer
            imputer = SimpleImputer(strategy="most_frequent")
            imputer.fit(df[[col]].astype(str))
            self.imputers[col] = imputer
            
            # Label encoder
            encoder = LabelEncoder()
            values = df[col].astype(str).fillna("missing")
            encoder.fit(values)
            self.label_encoders[col] = encoder
        
        return self
    
    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Transform dataframe using fitted preprocessor.
        
        Args:
            df: Dataframe to transform
            
        Returns:
            Transformed dataframe
        """
        df = df.copy()
        
        # Impute and transform numeric columns
        for col in self.numeric_columns:
            if col in df.columns:
                df[col] = self.imputers[col].transform(df[[col]]).ravel()
        
        # Impute and encode categorical columns
        for col in self.categorical_columns:
            if col in df.columns:
                # Impute
                df[col] = self.imputers[col].transform(
                    df[[col]].astype(str)
                ).ravel()
                
                # Encode - handle unseen categories
                df[col] = df[col].astype(str)
                known_labels = set(self.label_encoders[col].classes_)
                df[col] = df[col].apply(
                    lambda x: x if x in known_labels else "unknown"
                )
                
                # Add "unknown" to encoder if needed
                if "unknown" not in known_labels:
                    self.label_encoders[col].classes_ = np.append(
                        self.label_encoders[col].classes_, "unknown"
                    )
                
                df[col] = self.label_encoders[col].transform(df[col])
        
        return df
    
    def fit_transform(
        self, 
        df: pd.DataFrame, 
        target_column: Optional[str] = None
    ) -> pd.DataFrame:
        """Fit and transform in one step."""
        self.fit(df, target_column)
        return self.transform(df)
    
    def get_column_info(self) -> Dict[str, Any]:
        """Get information about processed columns."""
        return {
            "numeric_columns": self.numeric_columns,
            "categorical_columns": self.categorical_columns,
            "column_dtypes": self.column_dtypes,
        }


def clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """
    Basic dataframe cleaning operations.
    
    - Remove duplicate rows
    - Strip whitespace from string columns
    - Convert empty strings to NaN
    """
    df = df.copy()
    
    # Remove duplicates
    df = df.drop_duplicates()
    
    # Clean string columns
    for col in df.select_dtypes(include=["object"]).columns:
        df[col] = df[col].astype(str).str.strip()
        df[col] = df[col].replace({"": np.nan, "nan": np.nan, "None": np.nan})
    
    return df


def detect_outliers_iqr(
    df: pd.DataFrame, 
    columns: List[str],
    multiplier: float = 1.5
) -> pd.DataFrame:
    """
    Detect outliers using IQR method.
    
    Returns dataframe with boolean mask for outliers.
    """
    outlier_mask = pd.DataFrame(index=df.index)
    
    for col in columns:
        if col not in df.columns:
            continue
        if not np.issubdtype(df[col].dtype, np.number):
            continue
        
        Q1 = df[col].quantile(0.25)
        Q3 = df[col].quantile(0.75)
        IQR = Q3 - Q1
        
        lower = Q1 - multiplier * IQR
        upper = Q3 + multiplier * IQR
        
        outlier_mask[col] = (df[col] < lower) | (df[col] > upper)
    
    return outlier_mask
