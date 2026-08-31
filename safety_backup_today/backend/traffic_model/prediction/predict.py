import os
import sys
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

    time_pd = get_time_period(hour)
    period_encoded = 0 if time_pd == "morning" else 1 if time_pd == "afternoon" else 2 if time_pd == "evening" else 3

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

def predict_congestion_future(
    dt_obj,
    road_name="AB Road Vijay Nagar"
):
    """
    Predicts FUTURE congestion level at time t+delta using ONLY future timestamp + temporal + festival features.
    Does NOT pass current vehicle counts into future inference.
    """
    model, traffic_encoder, day_encoder, road_encoder, _ = load_ml_models()
    
    # Historical average volume baseline by hour for future timestamp
    hour = dt_obj.hour
    is_peak = (8 <= hour <= 10 or 17 <= hour <= 20)
    baseline_car = 45 if is_peak else 20
    baseline_bike = 60 if is_peak else 25
    baseline_bus = 6 if is_peak else 2
    baseline_truck = 4 if is_peak else 1

    features = _build_feature_row(dt_obj, road_name, baseline_car, baseline_bike, baseline_bus, baseline_truck, day_encoder, road_encoder)
    pred = model.predict(features)
    decoded = traffic_encoder.inverse_transform(pred)[0]
    return str(decoded).lower()

# Retain backward compatible function signature
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
    
    res_future = predict_congestion_future(datetime.now(), "AB Road Vijay Nagar")
    print(f"Future Traffic ML Forecast (+30m): {res_future}")