import os
import sys
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix
)

# Add parent path to import data processing module
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from data_processing.merge_traffic_data import merge_all_traffic_datasets

def train_recency_weighted_model():
    print("\n=======================================================")
    print("STARTING RECENCY-WEIGHTED TRAFFIC CONGESTION ML TRAINING")
    print("=======================================================\n")
    
    # 1. Execute Data Processing & Merging Pipeline
    df = merge_all_traffic_datasets()
    
    # Filter out invalid classes
    df = df[df["congestion_level"] != "high"]  # Clean legacy high label if present
    
    # Normalize class labels: normal -> medium, heavy -> high
    df["congestion_level"] = df["congestion_level"].replace({
        "normal": "medium",
        "heavy": "high"
    })
    
    print("\nClass Distribution in Combined Dataset:")
    print(df["congestion_level"].value_counts())
    
    # Encoders
    day_encoder = LabelEncoder()
    df["Day_encoded"] = day_encoder.fit_transform(df["day_name"])
    
    traffic_encoder = LabelEncoder()
    df["Target_encoded"] = traffic_encoder.fit_transform(df["congestion_level"])
    
    # Feature matrix X and target y
    feature_cols = [
        "hour",
        "day",
        "Day_encoded",
        "car_count",
        "bike_count",
        "bus_count",
        "truck_count"
    ]
    
    # Rename features to match predict.py expected column schema exactly:
    # ['Hour', 'Day', 'Day of week', 'CarCount', 'BikeCount', 'BusCount', 'TruckCount']
    X = df[feature_cols].copy()
    X.columns = [
        "Hour",
        "Day",
        "Day of week",
        "CarCount",
        "BikeCount",
        "BusCount",
        "TruckCount"
    ]
    
    y = df["Target_encoded"]
    weights = df["recency_weight"]
    
    # Train Test Split with sample weights
    X_train, X_test, y_train, y_test, w_train, w_test = train_test_split(
        X,
        y,
        weights,
        test_size=0.2,
        random_state=42,
        stratify=y
    )
    
    # Train Random Forest Classifier using Recency Sample Weights
    model = RandomForestClassifier(
        n_estimators=200,
        random_state=42
    )
    
    print("\nFitting Random Forest with Recency Sample Weights...")
    model.fit(X_train, y_train, sample_weight=w_train)
    
    # Evaluate
    predictions = model.predict(X_test)
    accuracy = accuracy_score(y_test, predictions, sample_weight=w_test)
    print(f"\nRecency-Weighted Model Accuracy: {accuracy * 100:.2f}%")
    
    print("\nFeature Importances:")
    importances = pd.DataFrame({
        "Feature": X.columns,
        "Importance": model.feature_importances_
    }).sort_values(by="Importance", ascending=False)
    print(importances)
    
    print("\nClassification Report:")
    print(classification_report(y_test, predictions, target_names=traffic_encoder.classes_))
    
    # Save Model Artifacts to models/
    models_dir = os.path.join(parent_dir, "models")
    os.makedirs(models_dir, exist_ok=True)
    
    model_path = os.path.join(models_dir, "congestion_model.pkl")
    traffic_encoder_path = os.path.join(models_dir, "traffic_encoder.pkl")
    day_encoder_path = os.path.join(models_dir, "day_encoder.pkl")
    
    joblib.dump(model, model_path)
    joblib.dump(traffic_encoder, traffic_encoder_path)
    joblib.dump(day_encoder, day_encoder_path)
    
    print(f"\n[Model Save SUCCESS] Saved trained artifacts to: {models_dir}")
    return model

if __name__ == "__main__":
    train_recency_weighted_model()