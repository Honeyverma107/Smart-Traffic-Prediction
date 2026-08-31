import os
import sys
import math
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from traffic_model.prediction.predict import (
    predict_congestion_current,
    predict_congestion_future,
    predict_congestion_future_proba,
    _get_dataset_minute_baseline,
    calculate_recent_traffic_trend,
    _build_feature_row,
    load_ml_models,
    get_time_period,
    map_canonical_traffic_label
)

# Configurable minimum travel-time improvement (in minutes) required to recommend a future departure
MIN_TRAVEL_TIME_SAVING = 5.0

def evaluate_right_time_to_go(
    departure_dt: datetime,
    yolo_counts: dict,
    route_name: str,
    dist_km: float,
    base_speed_kmh: float = 35.0,
    candidate_offsets_min: list = None
) -> dict:
    """
    Evaluates 'Right Time to Go' dynamically and independently for each route:
    - Uses class-by-class future vehicle count estimation (live YOLO + historical delta).
    - Uses continuous ML prediction probabilities, candidate speeds, travel durations, and delay metrics.
    - Recommends a future departure ONLY if it provides meaningful travel time / traffic improvement over leaving NOW.
    """
    if candidate_offsets_min is None:
        candidate_offsets_min = [0, 5, 10, 15, 20, 30, 40, 50, 60]

    # Observed current vehicle counts for NOW (t=0)
    current_cars = max(0, int(yolo_counts.get("car_count", 0)))
    current_bikes = max(0, int(yolo_counts.get("bike_count", 0)))
    current_buses = max(0, int(yolo_counts.get("bus_count", 0)))
    current_trucks = max(0, int(yolo_counts.get("truck_count", 0)))
    current_total_obs = current_cars + current_bikes + current_buses + current_trucks

    current_time_str = departure_dt.strftime("%I:%M:%S %p")
    current_day = departure_dt.day
    current_dow = departure_dt.strftime("%A")

    r_tag = route_name.upper()
    if "FAST" in r_tag:
        mapped_road = "AB Road Vijay Nagar"
    elif "BALANC" in r_tag:
        mapped_road = "Ring Road Palasia"
    elif "SLOW" in r_tag or "ECO" in r_tag:
        mapped_road = "Scheme 54 Bombay Hospital"
    else:
        mapped_road = route_name

    # Baseline historical expectations for NOW (t=0)
    hist_now = _get_dataset_minute_baseline(departure_dt, mapped_road)

    candidates = []
    traffic_forecast = []

    model, traffic_encoder, day_encoder, road_encoder, _ = load_ml_models()

    for idx, offset in enumerate(candidate_offsets_min):
        cand_dt = departure_dt + timedelta(minutes=offset)
        cand_time_12 = cand_dt.strftime("%I:%M %p").lstrip("0")
        cand_time_24 = cand_dt.strftime("%H:%M")

        hist_cand = _get_dataset_minute_baseline(cand_dt, mapped_road)

        # Class-by-class deterministic future count estimation (live YOLO + historical time delta)
        fut_cars = max(0, int(current_cars + (hist_cand["car_count"] - hist_now["car_count"])))
        fut_bikes = max(0, int(current_bikes + (hist_cand["bike_count"] - hist_now["bike_count"])))
        fut_buses = max(0, int(current_buses + (hist_cand["bus_count"] - hist_now["bus_count"])))
        fut_trucks = max(0, int(current_trucks + (hist_cand["truck_count"] - hist_now["truck_count"])))

        df_feat = _build_feature_row(
            cand_dt,
            mapped_road,
            fut_cars,
            fut_bikes,
            fut_buses,
            fut_trucks,
            day_encoder,
            road_encoder
        )

        pred = model.predict(df_feat)
        pred_proba = model.predict_proba(df_feat)[0]
        raw_pred_idx = int(pred[0])

        classes = [str(c).lower() for c in traffic_encoder.classes_]
        proba_dict = dict(zip(classes, [float(p) for p in pred_proba]))

        ml_decoded = str(traffic_encoder.inverse_transform([raw_pred_idx])[0]).lower()
        p_high = proba_dict.get("high", 0.0)
        p_medium = proba_dict.get("medium", 0.0) + proba_dict.get("normal", 0.0)

        cong_class = map_canonical_traffic_label(ml_decoded)

        speed_factor = max(0.35, min(1.0, 1.0 - (0.50 * p_high + 0.22 * p_medium)))
        effective_base_speed = max(20.0, min(55.0, base_speed_kmh))
        cand_speed = max(12.0, min(55.0, effective_base_speed * speed_factor))

        cand_time_min = max(1.0, round((dist_km / cand_speed) * 60, 1))
        free_flow_time = round((dist_km / 50.0) * 60, 1)
        cand_delay_min = max(0.0, round(cand_time_min - free_flow_time, 1))

        waiting_time_min = offset
        total_user_time_min = round(waiting_time_min + cand_time_min, 1)
        journey_cost = round(cand_time_min + 0.15 * waiting_time_min, 2)

        cand_info = {
            "departure_time": cand_time_12,
            "departure_24": cand_time_24,
            "departure_display": cand_time_12,
            "mapped_road": mapped_road,
            "road_id": int(df_feat["Road ID"].values[0]),
            "feature_vector": df_feat.to_dict(orient="records")[0],
            "raw_pred_index": raw_pred_idx,
            "raw_pred_label": ml_decoded,
            "proba_dict": proba_dict,
            "predicted_congestion": cong_class,
            "traffic_level": cong_class,
            "estimated_speed_kmh": round(cand_speed, 1),
            "estimated_travel_time_min": cand_time_min,
            "estimated_delay_min": cand_delay_min,
            "waiting_time_min": waiting_time_min,
            "total_user_time_min": total_user_time_min,
            "journey_cost": journey_cost,
            "score": journey_cost,
            "offset_min": offset,
            "hist_counts": hist_cand,
            "future_counts": {"car": fut_cars, "bike": fut_bikes, "bus": fut_buses, "truck": fut_trucks}
        }
        candidates.append(cand_info)

        end_offset = candidate_offsets_min[idx + 1] if idx + 1 < len(candidate_offsets_min) else offset + 10
        forecast_item = {
            "start_offset_min": offset,
            "end_offset_min": end_offset,
            "departure_time": cand_time_12,
            "traffic_level": cong_class,
            "estimated_speed_kmh": round(cand_speed, 1),
            "estimated_travel_time_min": cand_time_min,
            "estimated_delay_min": cand_delay_min,
            "waiting_time_min": waiting_time_min,
            "total_user_time_min": total_user_time_min,
            "journey_cost": journey_cost,
            "score": journey_cost
        }
        traffic_forecast.append(forecast_item)

    # Decision Rule for Right Time to Leave (CRITICAL RULE 7)
    # Compare future candidates against NOW (offset 0)
    curr_candidate = candidates[0]
    curr_travel_time = curr_candidate["estimated_travel_time_min"]
    curr_traffic = curr_candidate["predicted_congestion"]

    # Identify candidates that provide meaningful travel time or traffic improvement over NOW
    meaningful_candidates = []
    for c in candidates:
        if c["offset_min"] == 0:
            meaningful_candidates.append(c)
            continue
        
        travel_saved = round(curr_travel_time - c["estimated_travel_time_min"], 1)
        
        # Congestion level improvement check (e.g. HIGH -> NORMAL/LOW or NORMAL -> LOW)
        traffic_improved = (curr_traffic == "HIGH" and c["predicted_congestion"] in ["NORMAL", "LOW"]) or \
                           (curr_traffic == "NORMAL" and c["predicted_congestion"] == "LOW")
        
        # Meaningful benefit threshold: saves >= 2.0 min driving OR improves traffic class with >= 0.5 min saving
        if (travel_saved >= 2.0) or (traffic_improved and travel_saved >= 0.5):
            meaningful_candidates.append(c)

    # Pick candidate with minimum journey cost among valid meaningful candidates
    if meaningful_candidates:
        best_candidate = min(meaningful_candidates, key=lambda x: (x["journey_cost"], x["offset_min"]))
    else:
        best_candidate = curr_candidate

    recommended_time_12 = best_candidate["departure_time"]

    if best_candidate["offset_min"] > 0:
        travel_saved = round(curr_travel_time - best_candidate["estimated_travel_time_min"], 1)
        reason = f"Recommending departure at {best_candidate['departure_time']} (+{best_candidate['offset_min']} min) because predicted traffic improves from {curr_traffic} to {best_candidate['predicted_congestion']}, reducing driving time from {curr_travel_time} min to {best_candidate['estimated_travel_time_min']} min (saves {travel_saved} min)."
    else:
        sel_time_str = departure_dt.strftime("%I:%M %p").lstrip("0")
        reason = f"Leaving now at {sel_time_str} is recommended as current traffic is favorable and waiting longer does not provide a meaningful travel-time benefit."

    route_tag = route_name.upper().replace("ROUTE", "").strip()
    if "FAST" in route_tag:
        label = "FASTEST"
    elif "BALANC" in route_tag:
        label = "BALANCED"
    elif "SLOW" in route_tag or "ECO" in route_tag:
        label = "SLOW/ECO"
    else:
        label = route_tag

    # Required Detailed Debug Log Output per Prompt
    print(f"\nROUTE: {label}\n", flush=True)
    for i, c in enumerate(candidates, 1):
        is_sel = "YES" if c["departure_time"] == recommended_time_12 else "NO"
        fc = c["future_counts"]
        hc = c["hist_counts"]
        prob_str = ", ".join([f"{k.upper()}: {v*100:.1f}%" for k, v in c["proba_dict"].items()])
        print(f"Candidate {i}:", flush=True)
        print(f"Departure: {c['departure_time']}", flush=True)
        print(f"Future counts: Car={fc['car']}, Bike={fc['bike']}, Bus={fc['bus']}, Truck={fc['truck']}", flush=True)
        print(f"Historical baseline: Car={hc['car_count']}, Bike={hc['bike_count']}, Bus={hc['bus_count']}, Truck={hc['truck_count']}", flush=True)
        print(f"Future traffic: {c['predicted_congestion']}", flush=True)
        print(f"Traffic probabilities: {prob_str}", flush=True)
        print(f"Predicted travel time: {c['estimated_travel_time_min']} min", flush=True)
        print(f"Waiting time: {c['waiting_time_min']} min", flush=True)
        print(f"Total journey cost: {c['journey_cost']}", flush=True)
        print(f"Selected: {is_sel}\n", flush=True)

    print("BEST:", flush=True)
    print(f"Departure: {best_candidate['departure_time']}", flush=True)
    print(f"Predicted travel: {best_candidate['estimated_travel_time_min']} min", flush=True)
    print(f"Total journey cost: {best_candidate['journey_cost']}", flush=True)
    print("-----------------------------------------------\n", flush=True)

    cand_congestions = [c["predicted_congestion"] for c in candidates]
    peak_traffic = "HIGH" if "HIGH" in cand_congestions else ("NORMAL" if "NORMAL" in cand_congestions else "LOW")
    traffic_trend = " -> ".join(list(dict.fromkeys(cand_congestions)))

    return {
        "current_traffic": curr_candidate["predicted_congestion"],
        "recommended_departure": recommended_time_12,
        "recommended_departure_time": recommended_time_12,
        "recommended_time_display": recommended_time_12,
        "recommended_wait_minutes": best_candidate["offset_min"],
        "predicted_traffic": best_candidate["predicted_congestion"],
        "peak_traffic": peak_traffic,
        "traffic_trend": traffic_trend,
        "traffic_level": best_candidate["predicted_congestion"],
        "expected_duration_minutes": best_candidate["estimated_travel_time_min"],
        "predicted_travel_time_minutes": best_candidate["estimated_travel_time_min"],
        "total_user_time_minutes": best_candidate["total_user_time_min"],
        "journey_cost": best_candidate["journey_cost"],
        "score": best_candidate["journey_cost"],
        "offset_minutes": best_candidate["offset_min"],
        "current_vehicle_count": current_total_obs,
        "traffic_source": "YOLO_OBSERVATION_AND_ML_MODEL",
        "is_independent_optimization": True,
        "reason": reason,
        "candidate_evaluations": candidates,
        "traffic_forecast": traffic_forecast
    }
