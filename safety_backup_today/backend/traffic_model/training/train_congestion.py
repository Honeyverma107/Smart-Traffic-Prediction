import os
import sys
import pandas as pd
import numpy as np
import joblib

from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix
)

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from data_processing.merge_traffic_data import merge_all_traffic_datasets

def train_congestion_model():
    print("\n=======================================================")
    print("STARTING INDORE TRAFFIC CONGESTION ML MODEL TRAINING")
    print("=======================================================\n")

    # 1. Load standardized dataset from pipeline
    df = merge_all_traffic_datasets()

    # Label Encoders
    day_encoder = LabelEncoder()
    df["Day_encoded"] = day_encoder.fit_transform(df["day_name"])

    road_encoder = LabelEncoder()
    df["Road_encoded"] = road_encoder.fit_transform(df["road_name"])

    period_encoder = LabelEncoder()
    df["Period_encoded"] = period_encoder.fit_transform(df["time_period"])

    fest_name_encoder = LabelEncoder()
    df["FestName_encoded"] = fest_name_encoder.fit_transform(df["festival_name"])

    fest_type_encoder = LabelEncoder()
    df["FestType_encoded"] = fest_type_encoder.fit_transform(df["festival_type"])

    traffic_encoder = LabelEncoder()
    df["Target_encoded"] = traffic_encoder.fit_transform(df["congestion_level"])

    # Feature Matrix X and Target y
    feature_cols = [
        "hour",
        "day",
        "Day_encoded",
        "Road_encoded",
        "Period_encoded",
        "car_count",
        "bike_count",
        "bus_count",
        "truck_count",
        "is_weekend",
        "is_weekday",
        "is_holiday",
        "is_festival",
        "festival_intensity"
    ]

    X = df[feature_cols].copy()
    X.columns = [
        "Hour",
        "Day",
        "Day of week",
        "Road ID",
        "time_period",
        "CarCount",
        "BikeCount",
        "BusCount",
        "TruckCount",
        "is_weekend",
        "is_weekday",
        "is_holiday",
        "is_festival",
        "festival_intensity"
    ]

    y = df["Target_encoded"]
    weights = df["sample_weight"]

    # Chronological Train / Holdout Split:
    # 1. All genuine Indore native records (50 rows) are kept for evaluation & fine-tuning.
    # 2. Generic baseline survey data (5,952 rows) is chronologically split (first 80% train, last 20% test).
    
    indore_mask = df["is_indore_native"] == True
    generic_mask = ~indore_mask

    df_generic_X = X[generic_mask]
    df_generic_y = y[generic_mask]
    df_generic_w = weights[generic_mask]

    df_indore_X = X[indore_mask]
    df_indore_y = y[indore_mask]
    df_indore_w = weights[indore_mask]

    # Chronological index split for generic baseline survey data (first 80% train, last 20% validation)
    n_generic_train = int(len(df_generic_X) * 0.8)
    
    X_train = pd.concat([df_generic_X.iloc[:n_generic_train], df_indore_X.iloc[:int(len(df_indore_X)*0.6)]])
    y_train = pd.concat([df_generic_y.iloc[:n_generic_train], df_indore_y.iloc[:int(len(df_indore_y)*0.6)]])
    w_train = pd.concat([df_generic_w.iloc[:n_generic_train], df_indore_w.iloc[:int(len(df_indore_w)*0.6)]])

    # Overall Test Set (Last 20% generic + remaining 40% Indore)
    X_test_overall = pd.concat([df_generic_X.iloc[n_generic_train:], df_indore_X.iloc[int(len(df_indore_X)*0.6):]])
    y_test_overall = pd.concat([df_generic_y.iloc[n_generic_train:], df_indore_y.iloc[int(len(df_indore_y)*0.6):]])
    w_test_overall = pd.concat([df_generic_w.iloc[n_generic_train:], df_indore_w.iloc[int(len(df_indore_w)*0.6):]])

    # Indore-Only Holdout Test Set
    X_test_indore = df_indore_X.iloc[int(len(df_indore_X)*0.6):]
    y_test_indore = df_indore_y.iloc[int(len(df_indore_y)*0.6):]
    w_test_indore = df_indore_w.iloc[int(len(df_indore_y)*0.6):]

    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=15,
        min_samples_split=4,
        random_state=42
    )

    print(f"\nFitting Random Forest Classifier on {len(X_train)} training records with source sample weights...")
    model.fit(X_train, y_train, sample_weight=w_train)

    # 1. Overall Test Set Evaluation
    overall_preds = model.predict(X_test_overall)
    overall_acc = accuracy_score(y_test_overall, overall_preds, sample_weight=w_test_overall)

    print("\n=======================================================")
    print(f"1. OVERALL EVALUATION ACCURACY: {overall_acc * 100:.2f}%")
    print("=======================================================")
    print("\nOverall Feature Importances:")
    importances = pd.DataFrame({
        "Feature": X.columns,
        "Importance": model.feature_importances_
    }).sort_values(by="Importance", ascending=False)
    print(importances)

    print("\nOverall Classification Report:")
    print(classification_report(y_test_overall, overall_preds, target_names=traffic_encoder.classes_))

    print("\nOverall Confusion Matrix:")
    print(confusion_matrix(y_test_overall, overall_preds))

    # 2. Indore-Only Chronological Holdout Evaluation
    if len(X_test_indore) > 0:
        indore_preds = model.predict(X_test_indore)
        indore_acc = accuracy_score(y_test_indore, indore_preds, sample_weight=w_test_indore)

        print("\n=======================================================")
        print(f"2. INDORE-ONLY HOLDOUT ACCURACY: {indore_acc * 100:.2f}%")
        print("=======================================================")
        print("\nIndore-Only Classification Report:")
        print(classification_report(y_test_indore, indore_preds, target_names=traffic_encoder.classes_, zero_division=0))

        print("\nIndore-Only Confusion Matrix:")
        print(confusion_matrix(y_test_indore, indore_preds))

    # Save Model Artifacts
    models_dir = os.path.join(parent_dir, "models")
    os.makedirs(models_dir, exist_ok=True)

    joblib.dump(model, os.path.join(models_dir, "congestion_model.pkl"))
    joblib.dump(traffic_encoder, os.path.join(models_dir, "traffic_encoder.pkl"))
    joblib.dump(day_encoder, os.path.join(models_dir, "day_encoder.pkl"))
    joblib.dump(road_encoder, os.path.join(models_dir, "road_encoder.pkl"))
    joblib.dump(period_encoder, os.path.join(models_dir, "period_encoder.pkl"))
    joblib.dump(fest_name_encoder, os.path.join(models_dir, "fest_name_encoder.pkl"))
    joblib.dump(fest_type_encoder, os.path.join(models_dir, "fest_type_encoder.pkl"))

    print(f"\n[Model Save SUCCESS] Saved trained artifacts to: {models_dir}")
    return model

if __name__ == "__main__":
    train_congestion_model()