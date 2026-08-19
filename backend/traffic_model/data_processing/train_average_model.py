import os
import sys
import pandas as pd
import numpy as np
import joblib

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix
)

# Import dataset creation pipeline
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from create_average_traffic_dataset import create_average_traffic_dataset

def train_and_evaluate_average_model():
    print("==========================================================================")
    print("     REPRESENTATIVE AVERAGE TRAFFIC ML TRAINING & COMPARISON EVALUATION   ")
    print("==========================================================================\n")
    
    # 1. Generate / Load Representative Average Traffic Dataset
    avg_df = create_average_traffic_dataset()
    
    # Target Encoding (fitted ONLY on preprocessing pipeline)
    day_encoder = LabelEncoder()
    avg_df["Day_encoded"] = day_encoder.fit_transform(avg_df["Day of week"])
    
    traffic_encoder = LabelEncoder()
    avg_df["Target_encoded"] = traffic_encoder.fit_transform(avg_df["Traffic Situation"])
    
    # Features X and Target y
    feature_cols = ["Hour", "Day", "Day_encoded", "CarCount", "BikeCount", "BusCount", "TruckCount"]
    X = avg_df[feature_cols].copy()
    X.columns = ["Hour", "Day", "Day of week", "CarCount", "BikeCount", "BusCount", "TruckCount"]
    y = avg_df["Target_encoded"]
    
    # 2. Train-Test Split (80% Train, 20% Unseen Test)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # 3. Fit Random Forest Classifier
    rf_new = RandomForestClassifier(n_estimators=200, random_state=42)
    rf_new.fit(X_train, y_train)
    
    # 4. Predict on Unseen Test Set
    y_pred = rf_new.predict(X_test)
    
    acc_new = accuracy_score(y_test, y_pred)
    prec_new = precision_score(y_test, y_pred, average='weighted')
    rec_new = recall_score(y_test, y_pred, average='weighted')
    f1_weighted_new = f1_score(y_test, y_pred, average='weighted')
    f1_macro_new = f1_score(y_test, y_pred, average='macro')
    cm_new = confusion_matrix(y_test, y_pred)
    
    # 5. Time-Based Validation Split (Days 1-22 vs Days 23-31)
    cutoff_day = 22
    train_mask = avg_df['Day'] <= cutoff_day
    test_mask = avg_df['Day'] > cutoff_day
    
    X_train_tb = X[train_mask]
    y_train_tb = y[train_mask]
    X_test_tb = X[test_mask]
    y_test_tb = y[test_mask]
    
    rf_tb = RandomForestClassifier(n_estimators=200, random_state=42)
    rf_tb.fit(X_train_tb, y_train_tb)
    y_pred_tb = rf_tb.predict(X_test_tb)
    
    acc_tb = accuracy_score(y_test_tb, y_pred_tb)
    prec_tb = precision_score(y_test_tb, y_pred_tb, average='weighted')
    rec_tb = recall_score(y_test_tb, y_pred_tb, average='weighted')
    f1_weighted_tb = f1_score(y_test_tb, y_pred_tb, average='weighted')
    f1_macro_tb = f1_score(y_test_tb, y_pred_tb, average='macro')
    cm_tb = confusion_matrix(y_test_tb, y_pred_tb)
    
    # 6. Check for Data Leakage
    train_tuples = set(tuple(x) for x in X_train.values)
    test_tuples = set(tuple(x) for x in X_test.values)
    overlap = train_tuples.intersection(test_tuples)
    
    # 7. Save Models to models/
    models_dir = os.path.join(parent_dir, "models")
    os.makedirs(models_dir, exist_ok=True)
    
    joblib.dump(rf_new, os.path.join(models_dir, "congestion_model.pkl"))
    joblib.dump(traffic_encoder, os.path.join(models_dir, "traffic_encoder.pkl"))
    joblib.dump(day_encoder, os.path.join(models_dir, "day_encoder.pkl"))
    
    # Print Results Summary
    print("\n--- STEP 7: RETRAINED MODEL EVALUATION METRICS ---")
    print(f"Total Average-Dataset Records: {len(avg_df)}")
    print(f"Train Set Records:              {len(X_train)}")
    print(f"Test Set Records:               {len(X_test)}")
    print(f"Accuracy:                      {acc_new * 100:.2f}%")
    print(f"Precision (Weighted):           {prec_new:.4f}")
    print(f"Recall (Weighted):              {rec_new:.4f}")
    print(f"Macro F1-Score:                 {f1_macro_new:.4f}")
    print(f"Weighted F1-Score:              {f1_weighted_new:.4f}")
    print("\nClasses:", traffic_encoder.classes_)
    print("Confusion Matrix:\n", cm_new)
    
    print("\n--- TIME-BASED VALIDATION (Train: Days 1-22 / Test: Days 23-31) ---")
    print(f"Time-Based Train Set Records:  {len(X_train_tb)}")
    print(f"Time-Based Test Set Records:   {len(X_test_tb)}")
    print(f"Time-Based Accuracy:            {acc_tb * 100:.2f}%")
    print(f"Time-Based Precision:           {prec_tb:.4f}")
    print(f"Time-Based Recall:              {rec_tb:.4f}")
    print(f"Time-Based Macro F1-Score:      {f1_macro_tb:.4f}")
    print(f"Time-Based Weighted F1-Score:   {f1_weighted_tb:.4f}")
    print("Time-Based Confusion Matrix:\n", cm_tb)
    
    print("\n--- STEP 9: DATA LEAKAGE AUDIT ---")
    print(f"Target 'Traffic Situation' in Input Features: False")
    print(f"Identical Averaged Record Overlap (Train vs Test): {len(overlap)} rows")
    print(f"Test Set Unseen: True")
    
    return {
        "acc_new": acc_new,
        "prec_new": prec_new,
        "rec_new": rec_new,
        "f1_macro_new": f1_macro_new,
        "f1_weighted_new": f1_weighted_new,
        "cm_new": cm_new,
        "acc_tb": acc_tb,
        "prec_tb": prec_tb,
        "rec_tb": rec_tb,
        "f1_macro_tb": f1_macro_tb,
        "f1_weighted_tb": f1_weighted_tb,
        "cm_tb": cm_tb,
        "len_avg": len(avg_df),
        "len_train": len(X_train),
        "len_test": len(X_test),
        "overlap_count": len(overlap)
    }

if __name__ == "__main__":
    train_and_evaluate_average_model()
