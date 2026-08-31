import os
import sys
import math
import joblib
import pandas as pd
import time
from datetime import datetime

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
data_processing_dir = os.path.join(parent_dir, "data_processing")
models_dir = os.path.join(parent_dir, "models")

if data_processing_dir not in sys.path:
    sys.path.insert(0, data_processing_dir)

from weather_and_holiday_utils import (
    get_time_period,
    get_day_type_features,
    get_festival_features
)

model_path = os.path.join(models_dir, "congestion_model.pkl")
traffic_encoder_path = os.path.join(models_dir, "traffic_encoder.pkl")
day_encoder_path = os.path.join(models_dir, "day_encoder.pkl")
road_encoder_path = os.path.join(models_dir, "road_encoder.pkl")

# Cached Model Artifacts
_MODEL = None
_TRAFFIC_ENCODER = None
_DAY_ENCODER = None
_ROAD_ENCODER = None

def load_ml_models():
    global _MODEL, _TRAFFIC_ENCODER, _DAY_ENCODER, _ROAD_ENCODER
    t0 = time.time()
    was_in_memory = (_MODEL is not None and _TRAFFIC_ENCODER is not None and _DAY_ENCODER is not None and _ROAD_ENCODER is not None)
    if not was_in_memory:
        _MODEL = joblib.load(model_path)
        _TRAFFIC_ENCODER = joblib.load(traffic_encoder_path)
        _DAY_ENCODER = joblib.load(day_encoder_path)
        if os.path.exists(road_encoder_path):
            _ROAD_ENCODER = joblib.load(road_encoder_path)
        else:
            _ROAD_ENCODER = None

    load_time = 0.0 if was_in_memory else (time.time() - t0)
    return _MODEL, _TRAFFIC_ENCODER, _DAY_ENCODER, _ROAD_ENCODER, load_time

def _build_feature_row(dt_obj, road_name, car_c, bike_c, bus_c, truck_c, day_encoder, road_encoder):
    hour = dt_obj.hour
    day = dt_obj.day
    dow_name = dt_obj.strftime("%A")

    try:
        day_encoded = day_encoder.transform([dow_name])[0]
    except Exception:
        day_encoded = 0

    if road_encoder is not None:
        try:
            road_clean = str(road_name).strip()
            road_encoded = road_encoder.transform([road_clean])[0] if road_clean in road_encoder.classes_ else 0
        except Exception:
            road_encoded = 0
    else:
        road_encoded = 0

    global _PERIOD_ENCODER
    if '_PERIOD_ENCODER' not in globals() or _PERIOD_ENCODER is None:
        period_enc_path = os.path.join(models_dir, "period_encoder.pkl")
        if os.path.exists(period_enc_path):
            try:
                _PERIOD_ENCODER = joblib.load(period_enc_path)
            except Exception:
                _PERIOD_ENCODER = None
        else:
            _PERIOD_ENCODER = None

    time_pd = get_time_period(hour)
    if _PERIOD_ENCODER is not None and hasattr(_PERIOD_ENCODER, 'classes_'):
        try:
            period_encoded = _PERIOD_ENCODER.transform([time_pd])[0] if time_pd in _PERIOD_ENCODER.classes_ else 2
        except Exception:
            period_encoded = 0 if time_pd == "afternoon" else 1 if time_pd == "evening" else 2 if time_pd == "morning" else 3
    else:
        period_encoded = 0 if time_pd == "afternoon" else 1 if time_pd == "evening" else 2 if time_pd == "morning" else 3

    day_type = get_day_type_features(dt_obj)
    fest = get_festival_features(dt_obj)

    row = [
        hour,
        day,
        day_encoded,
        road_encoded,
        period_encoded,
        int(car_c),
        int(bike_c),
        int(bus_c),
        int(truck_c),
        day_type["is_weekend"],
        day_type["is_weekday"],
        day_type["is_holiday"],
        fest["is_festival"],
        fest["festival_intensity"]
    ]

    cols = [
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
    return pd.DataFrame([row], columns=cols)

def predict_congestion_current(
    time_str,
    day,
    day_of_week,
    car_count,
    bike_count,
    bus_count,
    truck_count,
    road_name="AB Road Vijay Nagar"
):
    """
    Predicts CURRENT congestion level at time t=NOW using observed vehicle counts + current timestamp features.
    """
    model, traffic_encoder, day_encoder, road_encoder, _ = load_ml_models()
    try:
        dt_obj = datetime.strptime(time_str, "%I:%M:%S %p")
    except Exception:
        dt_obj = datetime.now()

    features = _build_feature_row(dt_obj, road_name, car_count, bike_count, bus_count, truck_count, day_encoder, road_encoder)
    pred = model.predict(features)
    decoded = traffic_encoder.inverse_transform(pred)[0]
    return str(decoded).lower()

# Dataset Baseline Cache (Keyed by (road_name, hour))
_CORRIDOR_BASELINE_CACHE = None
_GENERAL_BASELINE_CACHE = None

def _load_dataset_baselines():
    global _CORRIDOR_BASELINE_CACHE, _GENERAL_BASELINE_CACHE
    if _CORRIDOR_BASELINE_CACHE is None or _GENERAL_BASELINE_CACHE is None:
        try:
            csv_path = os.path.join(parent_dir, "data", "processed", "merged_traffic.csv")
            if not os.path.exists(csv_path):
                csv_path = os.path.join(parent_dir, "data", "processed", "processed_traffic.csv")

            if os.path.exists(csv_path):
                df = pd.read_csv(csv_path)
                # Group by road_name AND hour for corridor-specific baselines
                if "road_name" in df.columns and "hour" in df.columns:
                    _CORRIDOR_BASELINE_CACHE = df.groupby(["road_name", "hour"])[["car_count", "bike_count", "bus_count", "truck_count"]].mean().to_dict(orient="index")
                else:
                    _CORRIDOR_BASELINE_CACHE = {}

                # General hourly baseline fallback
                if "hour" in df.columns:
                    _GENERAL_BASELINE_CACHE = df.groupby("hour")[["car_count", "bike_count", "bus_count", "truck_count"]].mean().to_dict(orient="index")
                else:
                    _GENERAL_BASELINE_CACHE = {}
            else:
                _CORRIDOR_BASELINE_CACHE = {}
                _GENERAL_BASELINE_CACHE = {}
        except Exception as err:
            print(f"[Dataset Baseline Warning] Could not load baseline dataset: {err}", flush=True)
            _CORRIDOR_BASELINE_CACHE = {}
            _GENERAL_BASELINE_CACHE = {}

def _get_dataset_minute_baseline(dt_obj: datetime, road_name: str = "AB Road Vijay Nagar") -> dict:
    """
    Queries empirical dataset baseline filtered specifically for the target road corridor and datetime.
    Performs smooth minute-level linear interpolation between current hour and next hour.
    """
    _load_dataset_baselines()

    h1 = int(dt_obj.hour)
    h2 = (h1 + 1) % 24
    minute = int(dt_obj.minute)
    alpha = minute / 60.0

    r_clean = str(road_name).strip()

    # Query corridor-specific cache if available, else general hourly fallback
    key1 = (r_clean, h1)
    key2 = (r_clean, h2)

    entry1 = _CORRIDOR_BASELINE_CACHE.get(key1) or _GENERAL_BASELINE_CACHE.get(h1, {"car_count": 45, "bike_count": 20, "bus_count": 10, "truck_count": 12})
    entry2 = _CORRIDOR_BASELINE_CACHE.get(key2) or _GENERAL_BASELINE_CACHE.get(h2, {"car_count": 50, "bike_count": 22, "bus_count": 11, "truck_count": 13})

    base_car = (1.0 - alpha) * entry1.get("car_count", 45) + alpha * entry2.get("car_count", 50)
    base_bike = (1.0 - alpha) * entry1.get("bike_count", 20) + alpha * entry2.get("bike_count", 22)
    base_bus = (1.0 - alpha) * entry1.get("bus_count", 10) + alpha * entry2.get("bus_count", 11)
    base_truck = (1.0 - alpha) * entry1.get("truck_count", 12) + alpha * entry2.get("truck_count", 13)

    return {
        "car_count": int(round(base_car)),
        "bike_count": int(round(base_bike)),
        "bus_count": int(round(base_bus)),
        "truck_count": int(round(base_truck)),
        "total_count": int(round(base_car + base_bike + base_bus + base_truck)),
        "road_corridor": r_clean
    }

def calculate_recent_traffic_trend(current_total: int, historical_total: int, prev_total: int = None) -> dict:
    """
    Computes a data-driven short-term traffic trend (INCREASING, DECREASING, or STABLE)
    by comparing current observation against previous observation and historical baseline.
    """
    if prev_total is not None and prev_total > 0:
        diff = current_total - prev_total
        if diff >= 5:
            trend = "INCREASING"
            trend_factor = 1.15
        elif diff <= -5:
            trend = "DECREASING"
            trend_factor = 0.85
        else:
            trend = "STABLE"
            trend_factor = 1.00
        ref_val = prev_total
    else:
        # Compare current observation against historical corridor expectation
        ratio = current_total / max(1.0, float(historical_total))
        if ratio >= 1.15:
            trend = "INCREASING"
            trend_factor = 1.12
        elif ratio <= 0.85:
            trend = "DECREASING"
            trend_factor = 0.88
        else:
            trend = "STABLE"
            trend_factor = 1.00
        ref_val = historical_total

    return {
        "trend": trend,
        "trend_factor": trend_factor,
        "previous_total": ref_val,
        "current_total": current_total
    }

def predict_congestion_future_proba(
    dt_obj,
    road_name="AB Road Vijay Nagar",
    yolo_obs: dict = None
):
    """
    Predicts FUTURE congestion level + class probabilities at time t+delta using
    class-by-class future vehicle counts (live YOLO observation + historical time delta)
    + temporal + festival features.
    Returns: (decoded_label: str, probabilities: dict)
    """
    model, traffic_encoder, day_encoder, road_encoder, _ = load_ml_models()
    
    # Query empirical minute-interpolated vehicle baseline from merged project dataset for target road_name
    base_counts = _get_dataset_minute_baseline(dt_obj, road_name)

    if yolo_obs and isinstance(yolo_obs, dict):
        now_dt = datetime.now()
        hist_now = _get_dataset_minute_baseline(now_dt, road_name)
        
        c_car = max(0, int(yolo_obs.get("car_count", 0) + (base_counts["car_count"] - hist_now["car_count"])))
        c_bike = max(0, int(yolo_obs.get("bike_count", 0) + (base_counts["bike_count"] - hist_now["bike_count"])))
        c_bus = max(0, int(yolo_obs.get("bus_count", 0) + (base_counts["bus_count"] - hist_now["bus_count"])))
        c_truck = max(0, int(yolo_obs.get("truck_count", 0) + (base_counts["truck_count"] - hist_now["truck_count"])))
    else:
        c_car = base_counts["car_count"]
        c_bike = base_counts["bike_count"]
        c_bus = base_counts["bus_count"]
        c_truck = base_counts["truck_count"]

    features = _build_feature_row(
        dt_obj,
        road_name,
        c_car,
        c_bike,
        c_bus,
        c_truck,
        day_encoder,
        road_encoder
    )
    pred = model.predict(features)
    pred_proba = model.predict_proba(features)[0]

    decoded = str(traffic_encoder.inverse_transform(pred)[0]).lower()
    classes = [str(c).lower() for c in traffic_encoder.classes_]
    proba_dict = dict(zip(classes, [float(p) for p in pred_proba]))

    return decoded, proba_dict

def predict_congestion_future(
    dt_obj,
    road_name="AB Road Vijay Nagar"
):
    """
    Predicts FUTURE congestion level string label at time t+delta using empirical dataset baseline features.
    """
    decoded_label, _ = predict_congestion_future_proba(dt_obj, road_name)
    return decoded_label

def map_canonical_traffic_label(raw_label: str) -> str:
    """
    Canonical mapping function for all traffic labels across the application:
    'medium' / 'normal' / 'moderate' -> 'NORMAL'
    'high' / 'heavy'                -> 'HIGH'
    'low' / 'free' / 'smooth'       -> 'LOW'
    """
    s = str(raw_label).strip().lower()
    if s in ['medium', 'normal', 'moderate']:
        return 'NORMAL'
    elif s in ['high', 'heavy']:
        return 'HIGH'
    elif s in ['low', 'free', 'light', 'smooth']:
        return 'LOW'
    return 'NORMAL'
def predict_congestion(
    time_str,
    day,
    day_of_week,
    car_count,
    bike_count,
    bus_count,
    truck_count,
    road_name="AB Road Vijay Nagar"
):
    return predict_congestion_current(time_str, day, day_of_week, car_count, bike_count, bus_count, truck_count, road_name)

if __name__ == "__main__":
    res_now = predict_congestion_current("08:30:00 AM", 18, "Wednesday", 58, 85, 9, 4, "AB Road Vijay Nagar")
    print(f"Current Traffic ML Forecast (NOW): {res_now}")
    
    res_future, probas = predict_congestion_future_proba(datetime.now(), "AB Road Vijay Nagar")
    print(f"Future Traffic ML Forecast (+30m): {res_future} | Probas: {probas}")