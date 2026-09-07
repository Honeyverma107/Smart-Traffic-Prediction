# ============================================================
# TRAIN INDORE TRAFFIC CONGESTION MODEL (REBUILT FROM SCRATCH)
# ============================================================
#
# Smart Traffic Management System — Indore City ML Pipeline
#
# This script:
#   1. Loads all available Indore & traffic datasets
#   2. Merges real hourly weather telemetry (WEATHER.csv)
#   3. Merges holiday calendar & festival metadata (HolidayCalendar_*.csv)
#   4. Normalizes target labels to low / medium / high
#   5. Encodes categorical variables with LabelEncoder
#   6. Trains RandomForestClassifier with 20 numeric features
#   7. Evaluates model with accuracy, classification report, confusion matrix
#   8. Saves trained model and encoders to models/
#
# ============================================================

import os
import sys
import glob
import warnings
import joblib
import numpy as np
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix
)

warnings.filterwarnings("ignore")

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
TRAFFIC_MODEL_DIR = os.path.dirname(CURRENT_DIR)

# Ensure data_processing is in Python path for weather_and_holiday_utils
DATA_PROCESSING_DIR = os.path.join(TRAFFIC_MODEL_DIR, "data_processing")
if DATA_PROCESSING_DIR not in sys.path:
    sys.path.insert(0, DATA_PROCESSING_DIR)

from weather_and_holiday_utils import (
    get_time_period,
    load_weather_data,
    load_holiday_data
)

DATA_DIR = os.path.join(TRAFFIC_MODEL_DIR, "data")
RAW_DATA_DIR = os.path.join(DATA_DIR, "raw")

MODELS_DIR = os.path.join(TRAFFIC_MODEL_DIR, "models")
os.makedirs(MODELS_DIR, exist_ok=True)

# Data files
HISTORICAL_FILE = os.path.join(RAW_DATA_DIR, "indore_traffic_historical.csv")
RECENT_FILE = os.path.join(RAW_DATA_DIR, "indore_traffic_recent.csv")
VIJAY_NAGAR_FILE = os.path.join(RAW_DATA_DIR, "indore_vijay_nagar_mendeley.csv")
TRAFFIC_FILE = os.path.join(RAW_DATA_DIR, "traffic.csv")
WEATHER_FILE = os.path.join(RAW_DATA_DIR, "WEATHER.csv")

# Model Output Paths
MODEL_FILE = os.path.join(MODELS_DIR, "congestion_model.pkl")
TRAFFIC_MODEL_PKL = os.path.join(TRAFFIC_MODEL_DIR, "traffic_model.pkl")

TRAFFIC_ENCODER_FILE = os.path.join(MODELS_DIR, "traffic_encoder.pkl")
DAY_ENCODER_FILE = os.path.join(MODELS_DIR, "day_encoder.pkl")
ROAD_ENCODER_FILE = os.path.join(MODELS_DIR, "road_encoder.pkl")
PERIOD_ENCODER_FILE = os.path.join(MODELS_DIR, "period_encoder.pkl")

# Exact 20-Feature Schema
FEATURE_COLUMNS = [
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
    "festival_intensity",
    "temperature",
    "humidity",
    "precipitation",
    "wind_speed",
    "cloud_cover",
    "weather_code"
]


def normalize_congestion_label(label):
    """Normalizes raw label to low, medium, or high."""
    if pd.isna(label):
        return None
    val = str(label).strip().lower()
    if val in ["low", "light", "free", "free flow"]:
        return "low"
    if val in ["medium", "moderate", "normal"]:
        return "medium"
    if val in ["high", "heavy", "severe"]:
        return "high"
    return None


def load_and_preprocess_datasets():
    """Combines raw datasets, merges weather & holiday metadata, and standardizes feature columns."""
    print("\n=======================================================")
    print("1. LOADING & INSPECTING INDORE TRAFFIC DATASETS")
    print("=======================================================\n")

    # Load Weather Telemetry
    w_path = WEATHER_FILE if os.path.exists(WEATHER_FILE) else os.path.join(RAW_DATA_DIR, "weather.csv")
    w_df = pd.read_csv(w_path, skiprows=3)
    w_df["dt"] = pd.to_datetime(w_df["time"], errors="coerce")

    w_rename = {}
    for col in w_df.columns:
        c_lower = str(col).lower()
        if "temp" in c_lower: w_rename[col] = "temperature"
        elif "cloud" in c_lower: w_rename[col] = "cloud_cover"
        elif "code" in c_lower: w_rename[col] = "weather_code"
        elif "precip" in c_lower: w_rename[col] = "precipitation"
        elif "humid" in c_lower: w_rename[col] = "humidity"
        elif "rain" in c_lower: w_rename[col] = "rain"
        elif "wind" in c_lower: w_rename[col] = "wind_speed"

    w_df = w_df.rename(columns=w_rename).dropna(subset=["dt"]).sort_values("dt")
    num_w_cols = ["temperature", "humidity", "precipitation", "wind_speed", "cloud_cover", "weather_code"]
    for c in num_w_cols:
        w_df[c] = pd.to_numeric(w_df[c], errors="coerce").fillna(0.0)

    print(f"[WEATHER] Loaded {len(w_df)} hourly records (Range: {w_df['dt'].min()} to {w_df['dt'].max()})")

    # Load Holiday Calendars
    h_dates, f_map = load_holiday_data()
    print(f"[HOLIDAYS] Loaded {len(h_dates)} holiday dates across 2023-2026")

    raw_records = []

    # 1. Historical Indore Dataset
    if os.path.exists(HISTORICAL_FILE):
        df_hist = pd.read_csv(HISTORICAL_FILE)
        df_hist["dt"] = pd.to_datetime(df_hist["Date_Time"], errors="coerce")
        for _, r in df_hist.iterrows():
            lbl = normalize_congestion_label(r.get("Traffic Status"))
            if lbl and pd.notna(r["dt"]):
                raw_records.append({
                    "dt": r["dt"],
                    "road_name": str(r.get("Intersection_ID", "Vijay Nagar Square")),
                    "CarCount": float(r.get("CarCount", 0)),
                    "BikeCount": float(r.get("BikeCount", 0)),
                    "BusCount": float(r.get("BusCount", 0)),
                    "TruckCount": float(r.get("TruckCount", 0)),
                    "target": lbl,
                    "dataset": "indore_traffic_historical.csv"
                })
        print(f"[DATASET] indore_traffic_historical.csv: {len(df_hist)} records")

    # 2. Recent Indore Dataset
    if os.path.exists(RECENT_FILE):
        df_rec = pd.read_csv(RECENT_FILE)
        df_rec["dt"] = pd.to_datetime(df_rec["timestamp"], errors="coerce")
        for _, r in df_rec.iterrows():
            lbl = normalize_congestion_label(r.get("congestion_level"))
            if lbl and pd.notna(r["dt"]):
                raw_records.append({
                    "dt": r["dt"],
                    "road_name": str(r.get("road_name", "AB Road Vijay Nagar")),
                    "CarCount": float(r.get("car_count", 0)),
                    "BikeCount": float(r.get("bike_count", 0)),
                    "BusCount": float(r.get("bus_count", 0)),
                    "TruckCount": float(r.get("truck_count", 0)),
                    "target": lbl,
                    "dataset": "indore_traffic_recent.csv"
                })
        print(f"[DATASET] indore_traffic_recent.csv: {len(df_rec)} records")

    # 3. Vijay Nagar Mendeley Dataset
    if os.path.exists(VIJAY_NAGAR_FILE):
        df_mend = pd.read_csv(VIJAY_NAGAR_FILE)
        df_mend["dt"] = pd.to_datetime(df_mend["timestamp"], errors="coerce")
        for _, r in df_mend.iterrows():
            lbl = normalize_congestion_label(r.get("congestion_status"))
            if lbl and pd.notna(r["dt"]):
                raw_records.append({
                    "dt": r["dt"],
                    "road_name": str(r.get("road_name", "AB Road Vijay Nagar")),
                    "CarCount": float(r.get("car_count", 0)),
                    "BikeCount": float(r.get("bike_count", 0)),
                    "BusCount": float(r.get("bus_count", 0)),
                    "TruckCount": float(r.get("truck_count", 0)),
                    "target": lbl,
                    "dataset": "indore_vijay_nagar_mendeley.csv"
                })
        print(f"[DATASET] indore_vijay_nagar_mendeley.csv: {len(df_mend)} records")

    # 4. Generic Traffic Dataset
    if os.path.exists(TRAFFIC_FILE):
        df_gen = pd.read_csv(TRAFFIC_FILE)
        dt_str = "2025-01-" + df_gen["Date"].astype(str).str.zfill(2) + " " + df_gen["Time"].astype(str)
        df_gen["dt"] = pd.to_datetime(dt_str, errors="coerce")
        for _, r in df_gen.iterrows():
            lbl = normalize_congestion_label(r.get("Traffic Situation"))
            if lbl:
                dt_val = r["dt"] if pd.notna(r["dt"]) else pd.Timestamp("2025-01-01 12:00:00")
                raw_records.append({
                    "dt": dt_val,
                    "road_name": "Generic Indore Corridor",
                    "CarCount": float(r.get("CarCount", 0)),
                    "BikeCount": float(r.get("BikeCount", 0)),
                    "BusCount": float(r.get("BusCount", 0)),
                    "TruckCount": float(r.get("TruckCount", 0)),
                    "target": lbl,
                    "dataset": "traffic.csv"
                })
        print(f"[DATASET] traffic.csv: {len(df_gen)} records")

    df_combined = pd.DataFrame(raw_records).sort_values("dt").reset_index(drop=True)
    print(f"\n[SUMMARY] Total combined traffic records: {len(df_combined)}")

    # Merge weather telemetry using closest timestamp match
    df_merged = pd.merge_asof(df_combined, w_df, on="dt", direction="nearest")

    # Derive Calendar & Holiday Features
    df_merged["Hour"] = df_merged["dt"].dt.hour.astype(int)
    df_merged["Day"] = df_merged["dt"].dt.day.astype(int)
    df_merged["DayName"] = df_merged["dt"].dt.strftime("%A")
    df_merged["is_weekend"] = df_merged["dt"].dt.weekday.apply(lambda x: 1 if x >= 5 else 0)
    df_merged["is_weekday"] = df_merged["dt"].dt.weekday.apply(lambda x: 1 if x < 5 else 0)
    df_merged["time_period_str"] = df_merged["Hour"].apply(get_time_period)

    def check_holiday(d):
        d_str = d.strftime("%Y-%m-%d")
        return 1 if (d_str in h_dates or d.weekday() >= 5) else 0

    def check_festival(d):
        d_str = d.strftime("%Y-%m-%d")
        return 1 if d_str in f_map else 0

    def check_intensity(d):
        d_str = d.strftime("%Y-%m-%d")
        return f_map[d_str]["intensity"] if d_str in f_map else 0.0

    df_merged["is_holiday"] = df_merged["dt"].apply(check_holiday)
    df_merged["is_festival"] = df_merged["dt"].apply(check_festival)
    df_merged["festival_intensity"] = df_merged["dt"].apply(check_intensity)

    return df_merged


def train_and_save_model():
    """Trains RandomForest model, saves artifacts, and prints comprehensive evaluation stats."""
    df = load_and_preprocess_datasets()

    print("\n=======================================================")
    print("2. ENCODING CATEGORICAL FEATURES & BUILDING MATRIX")
    print("=======================================================\n")

    day_enc = LabelEncoder()
    df["Day of week"] = day_enc.fit_transform(df["DayName"])

    road_enc = LabelEncoder()
    df["Road ID"] = road_enc.fit_transform(df["road_name"])

    period_enc = LabelEncoder()
    df["time_period"] = period_enc.fit_transform(df["time_period_str"])

    target_enc = LabelEncoder()
    df["target_enc"] = target_enc.fit_transform(df["target"])

    # Save Encoders to models/ directory
    joblib.dump(day_enc, DAY_ENCODER_FILE)
    joblib.dump(road_enc, ROAD_ENCODER_FILE)
    joblib.dump(period_enc, PERIOD_ENCODER_FILE)
    joblib.dump(target_enc, TRAFFIC_ENCODER_FILE)

    print(f"[ENCODERS] Saved day_encoder.pkl ({len(day_enc.classes_)} classes)")
    print(f"[ENCODERS] Saved road_encoder.pkl ({len(road_enc.classes_)} classes)")
    print(f"[ENCODERS] Saved period_encoder.pkl ({len(period_enc.classes_)} classes)")
    print(f"[ENCODERS] Saved traffic_encoder.pkl ({len(target_enc.classes_)} target classes: {list(target_enc.classes_)})")

    X = df[FEATURE_COLUMNS]
    y = df["target_enc"]

    print(f"\n[DATA MATRIX] Feature shape: {X.shape}, Target shape: {y.shape}")
    print("[CLASS DISTRIBUTION]")
    for cls_name, count in zip(target_enc.classes_, np.bincount(y)):
        print(f"  {cls_name.upper():8s}: {count:5d} records ({count / len(y) * 100:.1f}%)")

    # Stratified Train/Test Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print(f"\n[SPLIT] Train records: {len(X_train)} | Test records: {len(X_test)}")

    # Train RandomForestClassifier
    rf = RandomForestClassifier(
        n_estimators=100,
        random_state=42,
        class_weight="balanced"
    )
    rf.fit(X_train, y_train)

    # Evaluate
    y_pred = rf.predict(X_test)
    train_acc = accuracy_score(y_train, rf.predict(X_train))
    test_acc = accuracy_score(y_test, y_pred)

    print("\n=======================================================")
    print("3. MODEL EVALUATION & RESULTS")
    print("=======================================================\n")

    print(f"TRAIN ACCURACY : {train_acc * 100:.2f}%")
    print(f"TEST ACCURACY  : {test_acc * 100:.2f}%\n")

    print("CLASSIFICATION REPORT:")
    print(classification_report(y_test, y_pred, target_names=target_enc.classes_))

    print("CONFUSION MATRIX:")
    cm = confusion_matrix(y_test, y_pred)
    cm_df = pd.DataFrame(cm, index=target_enc.classes_, columns=target_enc.classes_)
    print(cm_df.to_string())

    print("\nFEATURE IMPORTANCES:")
    importances = sorted(zip(FEATURE_COLUMNS, rf.feature_importances_), key=lambda x: x[1], reverse=True)
    for col, imp in importances:
        print(f"  {col:22s}: {imp:.4f}")

    # Save Model Artifacts
    model_artifact = {
        "model": rf,
        "features": FEATURE_COLUMNS,
        "classes": list(target_enc.classes_)
    }

    joblib.dump(model_artifact, MODEL_FILE)
    joblib.dump(model_artifact, TRAFFIC_MODEL_PKL)

    print(f"\n[SAVE] Model saved to '{MODEL_FILE}'")
    print(f"[SAVE] Model saved to '{TRAFFIC_MODEL_PKL}'")
    print("\n=======================================================")
    print("INDORE ML TRAFFIC MODEL REBUILD COMPLETED SUCCESSFULLY")
    print("=======================================================\n")


if __name__ == "__main__":
    train_and_save_model()