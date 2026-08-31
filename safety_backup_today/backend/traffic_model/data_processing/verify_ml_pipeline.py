import os
import sys
import pandas as pd
import numpy as np
from datetime import datetime

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

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_DATA_DIR = os.path.join(BASE_DIR, "data", "raw")
PROCESSED_DATA_DIR = os.path.join(BASE_DIR, "data", "processed")

from merge_traffic_data import merge_all_traffic_datasets

def run_full_verification():
    print("==========================================================================")
    print("      COMPREHENSIVE ML & SIGNAL TIMING VERIFICATION REPORT                ")
    print("==========================================================================\n")

    # -------------------------------------------------------------------------
    # 1. VERIFY MERGED RECORDS & DATASETS
    # -------------------------------------------------------------------------
    print("--- 1. DATASET & MERGED RECORD METRICS ---")
    
    # Load raw datasets separately
    baseline_path = os.path.join(RAW_DATA_DIR, "traffic.csv")
    hist_path = os.path.join(RAW_DATA_DIR, "indore_traffic_historical.csv")
    recent_path = os.path.join(RAW_DATA_DIR, "indore_traffic_recent.csv")

    n_baseline = len(pd.read_csv(baseline_path)) if os.path.exists(baseline_path) else 0
    n_hist = len(pd.read_csv(hist_path)) if os.path.exists(hist_path) else 0
    n_recent = len(pd.read_csv(recent_path)) if os.path.exists(recent_path) else 0

    merged_df = merge_all_traffic_datasets()
    
    total_records = len(merged_df)
    missing_count = merged_df.isnull().sum().sum()
    
    # Calculate duplicate feature rows
    feature_cols = ["hour", "day", "day_name", "car_count", "bike_count", "bus_count", "truck_count"]
    duplicate_features_count = merged_df.duplicated(subset=feature_cols, keep=False).sum()
    exact_duplicates = merged_df.duplicated(keep=False).sum()

    print(f"Historical Baseline Records (traffic.csv): {n_baseline}")
    print(f"Historical Indore Records (indore_traffic_historical.csv): {n_hist}")
    print(f"Recent Indore Records (indore_traffic_recent.csv): {n_recent}")
    print(f"Final Merged Record Count: {total_records}")
    print(f"Exact Duplicate Records: {exact_duplicates}")
    print(f"Duplicate Feature Combination Rows: {duplicate_features_count}")
    print(f"Total Missing Values: {missing_count}")
    print(f"Date Range: {merged_df['dt'].min()} to {merged_df['dt'].max()}")
    print("\nSource Distribution:")
    print(merged_df['data_source'].value_counts())
    print()

    # -------------------------------------------------------------------------
    # 2. VERIFY RECENCY WEIGHTING FORMULA
    # -------------------------------------------------------------------------
    print("--- 2. RECENCY WEIGHTING FORMULA VERIFICATION ---")
    ref_date = datetime.now()
    test_days = [0, 30, 180, 365, 730, merged_df['age_days'].max()]
    
    print("Formula: w = exp(-0.001 * age_in_days), clipped to [0.25, 1.0]")
    for days in test_days:
        w_calc = float(np.clip(np.exp(-0.001 * days), 0.25, 1.0))
        print(f" - Age: {int(days):4d} days -> Weight: {w_calc:.4f}")
    
    min_w = merged_df['recency_weight'].min()
    max_w = merged_df['recency_weight'].max()
    print(f"Actual Weight Range in Dataset: [{min_w:.4f}, {max_w:.4f}]\n")

    # -------------------------------------------------------------------------
    # 3. RANDOM TRAIN/TEST SPLIT ML VALIDATION (80/20)
    # -------------------------------------------------------------------------
    print("--- 3. RANDOM TRAIN/TEST SPLIT EVALUATION (80/20 Split) ---")
    
    # Preprocessing
    df_ml = merged_df[merged_df["congestion_level"] != "high"].copy()
    df_ml["congestion_level"] = df_ml["congestion_level"].replace({"normal": "medium", "heavy": "high"})
    
    day_enc = LabelEncoder()
    df_ml["day_encoded"] = day_enc.fit_transform(df_ml["day_name"])
    
    traffic_enc = LabelEncoder()
    df_ml["target_encoded"] = traffic_enc.fit_transform(df_ml["congestion_level"])
    
    X_cols = ["hour", "day", "day_encoded", "car_count", "bike_count", "bus_count", "truck_count"]
    X = df_ml[X_cols].copy()
    X.columns = ["Hour", "Day", "Day of week", "CarCount", "BikeCount", "BusCount", "TruckCount"]
    y = df_ml["target_encoded"]
    weights = df_ml["recency_weight"]

    X_train, X_test, y_train, y_test, w_train, w_test = train_test_split(
        X, y, weights, test_size=0.2, random_state=42, stratify=y
    )

    rf_random = RandomForestClassifier(n_estimators=200, random_state=42)
    rf_random.fit(X_train, y_train, sample_weight=w_train)
    y_pred_rand = rf_random.predict(X_test)

    acc_rand = accuracy_score(y_test, y_pred_rand, sample_weight=w_test)
    prec_rand = precision_score(y_test, y_pred_rand, average='weighted', sample_weight=w_test)
    rec_rand = recall_score(y_test, y_pred_rand, average='weighted', sample_weight=w_test)
    f1_rand = f1_score(y_test, y_pred_rand, average='weighted', sample_weight=w_test)
    macro_f1_rand = f1_score(y_test, y_pred_rand, average='macro', sample_weight=w_test)
    cm_rand = confusion_matrix(y_test, y_pred_rand)

    print(f"Train Set Size: {len(X_train)} samples")
    print(f"Test Set Size:  {len(X_test)} samples")
    print(f"Accuracy:     {acc_rand * 100:.2f}%")
    print(f"Precision:    {prec_rand:.4f}")
    print(f"Recall:       {rec_rand:.4f}")
    print(f"Weighted F1:  {f1_rand:.4f}")
    print(f"Macro F1:     {macro_f1_rand:.4f}")
    print("Classes:", traffic_enc.classes_)
    print("Confusion Matrix:\n", cm_rand)

    # Check for train-test overlap (data leakage due to identical feature rows)
    train_tuples = set(tuple(x) for x in X_train.values)
    test_tuples = set(tuple(x) for x in X_test.values)
    overlap = train_tuples.intersection(test_tuples)
    print(f"Train-Test Feature Vector Overlap (Identical rows in both): {len(overlap)} distinct combinations\n")

    # -------------------------------------------------------------------------
    # 4. TIME-BASED VALIDATION (Train on Older Data, Test on Newer Data)
    # -------------------------------------------------------------------------
    print("--- 4. TIME-BASED VALIDATION (Train: Older / Test: Recent) ---")
    
    # Split by day or age: train on older data (e.g. Days 1-22), test on newer data (Days 23-31 & recent data)
    # Or train on age_days > 30 (historical), test on age_days <= 30 (recent/latest)
    cutoff_day = 22
    train_mask = df_ml['day'] <= cutoff_day
    test_mask = df_ml['day'] > cutoff_day

    X_train_time = X[train_mask]
    y_train_time = y[train_mask]
    w_train_time = weights[train_mask]

    X_test_time = X[test_mask]
    y_test_time = y[test_mask]
    w_test_time = weights[test_mask]

    rf_time = RandomForestClassifier(n_estimators=200, random_state=42)
    rf_time.fit(X_train_time, y_train_time, sample_weight=w_train_time)
    y_pred_time = rf_time.predict(X_test_time)

    acc_time = accuracy_score(y_test_time, y_pred_time, sample_weight=w_test_time)
    prec_time = precision_score(y_test_time, y_pred_time, average='weighted', sample_weight=w_test_time)
    rec_time = recall_score(y_test_time, y_pred_time, average='weighted', sample_weight=w_test_time)
    f1_time = f1_score(y_test_time, y_pred_time, average='weighted', sample_weight=w_test_time)
    macro_f1_time = f1_score(y_test_time, y_pred_time, average='macro', sample_weight=w_test_time)
    cm_time = confusion_matrix(y_test_time, y_pred_time)

    print(f"Time-Based Train Set Size (Days 1-{cutoff_day}): {len(X_train_time)} samples")
    print(f"Time-Based Test Set Size (Days {cutoff_day+1}-31): {len(X_test_time)} samples")
    print(f"Time-Based Accuracy:     {acc_time * 100:.2f}%")
    print(f"Time-Based Precision:    {prec_time:.4f}")
    print(f"Time-Based Recall:       {rec_time:.4f}")
    print(f"Time-Based Weighted F1:  {f1_time:.4f}")
    print(f"Time-Based Macro F1:     {macro_f1_time:.4f}")
    print("Time-Based Confusion Matrix:\n", cm_time)
    print()

    # -------------------------------------------------------------------------
    # 5. DYNAMIC SIGNAL TIMING ALGORITHM TEST
    # -------------------------------------------------------------------------
    print("--- 5. DYNAMIC TRAFFIC SIGNAL TIMING ALGORITHM TEST ---")
    sys.path.insert(0, os.path.join(BASE_DIR))
    from signal_timing import calculate_dynamic_signal_timing

    test_intersection_input = {
        "north": {"car_count": 5, "bike_count": 2, "bus_count": 0, "truck_count": 0, "waiting_time_sec": 15},
        "south": {"car_count": 10, "bike_count": 5, "bus_count": 1, "truck_count": 0, "waiting_time_sec": 20},
        "east": {"car_count": 70, "bike_count": 25, "bus_count": 3, "truck_count": 2, "waiting_time_sec": 60},
        "west": {"car_count": 40, "bike_count": 15, "bus_count": 2, "truck_count": 1, "waiting_time_sec": 45}
    }

    signal_res = calculate_dynamic_signal_timing(test_intersection_input, intersection_name="Vijay Nagar Test")

    print("Target Intersection:", signal_res["intersection"])
    print("Calculated Full Cycle Time:", signal_res["cycle_time_sec"], "sec")
    print("Active Priority Phase:", signal_res["active_phase"].upper())

    all_in_bounds = True
    for d_key, d_data in signal_res["directions"].items():
        g_time = d_data["green_time_sec"]
        y_time = d_data["yellow_time_sec"]
        r_time = d_data["all_red_time_sec"]
        pce = d_data["pce_volume"]
        p_score = d_data["priority_score"]
        
        in_bounds = (15 <= g_time <= 65)
        if not in_bounds:
            all_in_bounds = False
            
        print(f" - {d_key.upper():5s} | Vehicles: {d_data['total_vehicles']:3d} | PCE: {pce:5.1f} | Priority: {p_score:5.2f} | Green: {g_time:2d}s | Yellow: {y_time}s | All-Red: {r_time}s | In Bounds [15,65]: {in_bounds}")

    print(f"\nAll Directions Within Safety Bounds [15s, 65s]: {all_in_bounds}")
    print(f"Recommendation Summary: {signal_res['recommendation_summary']}\n")

    # -------------------------------------------------------------------------
    # 6. DJANGO API ENDPOINTS VERIFICATION
    # -------------------------------------------------------------------------
    print("--- 6. DJANGO API ENDPOINTS INTEGRATION TEST ---")
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'smart_traffic.settings')
    sys.path.insert(0, os.path.join(BASE_DIR, '..'))
    
    try:
        import django
        django.setup()
        from rest_framework.test import APIRequestFactory
        from routes.views import SignalTimingView, CurrentTrafficView

        factory = APIRequestFactory()

        # Test /api/signal-timing/
        req_sig = factory.post('/api/signal-timing/', test_intersection_input, format='json')
        view_sig = SignalTimingView.as_view()
        res_sig = view_sig(req_sig)
        print(f"POST /api/signal-timing/ HTTP Status: {res_sig.status_code}")
        print(f"Signal Timing API Output Active Phase: {res_sig.data.get('active_phase')}")

        # Test /api/traffic/current/
        req_curr = factory.get('/api/traffic/current/')
        view_curr = CurrentTrafficView.as_view()
        res_curr = view_curr(req_curr)
        print(f"GET /api/traffic/current/ HTTP Status: {res_curr.status_code}")
        print(f"Current Traffic API Datasets: {res_curr.data.get('datasets')}")
        
    except Exception as e:
        print(f"Django API local test exception: {e}")

    print("\n==========================================================================")
    print("                     VERIFICATION RUN COMPLETED                           ")
    print("==========================================================================")

if __name__ == "__main__":
    run_full_verification()
