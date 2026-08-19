import os
import sys
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Import ML prediction module
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from traffic_model.prediction.predict import predict_congestion

# Load Representative Average Traffic Dataset for hourly baseline pattern
AVG_DATASET_PATH = os.path.join(BASE_DIR, "traffic_model", "data", "processed", "average_traffic_dataset.csv")
RAW_DATASET_PATH = os.path.join(BASE_DIR, "traffic_model", "data", "raw", "traffic.csv")

_HOURLY_PCE_PATTERN = None

def get_hourly_pce_pattern() -> dict:
    """
    Calculates historical average Passenger Car Equivalent (PCE) volume by Hour (0..23)
    from the representative dataset (or raw baseline dataset).
    """
    global _HOURLY_PCE_PATTERN
    if _HOURLY_PCE_PATTERN is not None:
        return _HOURLY_PCE_PATTERN
        
    df = None
    if os.path.exists(AVG_DATASET_PATH):
        df = pd.read_csv(AVG_DATASET_PATH)
    elif os.path.exists(RAW_DATASET_PATH):
        df = pd.read_csv(RAW_DATASET_PATH)
        df['Hour'] = pd.to_datetime(df['Time'], format="%I:%M:%S %p", errors='coerce').dt.hour
        
    if df is not None and 'Hour' in df.columns:
        # Standard PCE Formula: Cars=1.0, Bikes=0.5, Buses=2.5, Trucks=3.0
        car_col = 'CarCount' if 'CarCount' in df.columns else 'car_count'
        bike_col = 'BikeCount' if 'BikeCount' in df.columns else 'bike_count'
        bus_col = 'BusCount' if 'BusCount' in df.columns else 'bus_count'
        truck_col = 'TruckCount' if 'TruckCount' in df.columns else 'truck_count'
        
        df['pce'] = (
            df[car_col] * 1.0 +
            df[bike_col] * 0.5 +
            df[bus_col] * 2.5 +
            df[truck_col] * 3.0
        )
        
        hourly_means = df.groupby('Hour')['pce'].mean().to_dict()
        # Fill any missing hours with overall mean
        overall_mean = df['pce'].mean() if len(df) > 0 else 150.0
        _HOURLY_PCE_PATTERN = {h: hourly_means.get(h, overall_mean) for h in range(24)}
    else:
        # Default baseline hourly curve if no dataset exists
        _HOURLY_PCE_PATTERN = {h: (200.0 if (7 <= h <= 9 or 16 <= h <= 19) else 150.0 if (10 <= h <= 15) else 95.0) for h in range(24)}
        
    return _HOURLY_PCE_PATTERN

def evaluate_right_time_to_go(
    departure_dt: datetime,
    yolo_counts: dict,
    route_name: str,
    dist_km: float,
    base_speed_kmh: float = 35.0,
    candidate_offsets_min: list = None
) -> dict:
    """
    Data-driven 'Right Time to Go' evaluation combining current demo YOLO vehicle counts
    with historical hourly traffic patterns across dynamic candidate departure slots.
    Provides deterministic future vehicle count range forecasts and vehicle type breakdowns.
    """
    if candidate_offsets_min is None:
        candidate_offsets_min = [0, 30, 60, 90, 120]
        
    hourly_pattern = get_hourly_pce_pattern()
    
    # Current YOLO Baseline Counts (Live/Current Observation Only)
    current_cars = max(0, int(yolo_counts.get("car_count", 26)))
    current_bikes = max(0, int(yolo_counts.get("bike_count", 6)))
    current_buses = max(0, int(yolo_counts.get("bus_count", 4)))
    current_trucks = max(0, int(yolo_counts.get("truck_count", 2)))
    
    current_total_vehicles = current_cars + current_bikes + current_buses + current_trucks
    current_pce = (current_cars * 1.0) + (current_bikes * 0.5) + (current_buses * 2.5) + (current_trucks * 3.0)
    
    # Route-specific volume multiplier (Fastest Route = 1.0, Balanced = 0.85, Slow/Low-Traffic = 0.70)
    route_lower = route_name.lower()
    if 'low' in route_lower or 'slow' in route_lower:
        route_mult = 0.70
    elif 'balanc' in route_lower:
        route_mult = 0.85
    else:
        route_mult = 1.00
        
    current_hour = departure_dt.hour
    baseline_hist_pce = max(1.0, hourly_pattern.get(current_hour, 160.0))
    
    candidates = []
    traffic_forecast = []
    
    print(f"\n========== RIGHT TIME FORECAST ==========", flush=True)
    print(f"ROUTE: {route_name}", flush=True)
    print(f"CURRENT YOLO TOTAL: {current_total_vehicles}", flush=True)
    
    for idx, offset in enumerate(candidate_offsets_min):
        cand_dt = departure_dt + timedelta(minutes=offset)
        cand_time_val = cand_dt.strftime("%I:%M:%S %p")
        cand_time_str = cand_dt.strftime("%I:%M %p")
        cand_day = cand_dt.day
        cand_dow = cand_dt.strftime("%A")
        cand_hour = cand_dt.hour
        
        # Historical volume ratio: PCE_hist(cand_hour) / PCE_hist(current_hour)
        cand_hist_pce = hourly_pattern.get(cand_hour, 160.0)
        hist_ratio = cand_hist_pce / baseline_hist_pce
        
        # Estimate Future Vehicle Counts: Combine Current Demo YOLO baseline with Historical hourly ratio & Route Multiplier
        proj_cars = max(0, int(round(current_cars * hist_ratio * route_mult)))
        proj_bikes = max(0, int(round(current_bikes * hist_ratio * route_mult)))
        proj_buses = max(0, int(round(current_buses * hist_ratio * route_mult)))
        proj_trucks = max(0, int(round(current_trucks * hist_ratio * route_mult)))
        
        pred_total_vehicles = proj_cars + proj_bikes + proj_buses + proj_trucks
        
        # Deterministic Vehicle Count Range (+/- 10% uncertainty margin based on historical variance)
        range_min = max(0, int(round(pred_total_vehicles * 0.90)))
        range_max = max(range_min, int(round(pred_total_vehicles * 1.10)))
        
        vehicle_breakdown = {
            "cars": {
                "min": max(0, int(round(proj_cars * 0.90))),
                "max": max(0, int(round(proj_cars * 1.10)))
            },
            "bikes": {
                "min": max(0, int(round(proj_bikes * 0.90))),
                "max": max(0, int(round(proj_bikes * 1.10)))
            },
            "buses": {
                "min": max(0, int(round(proj_buses * 0.90))),
                "max": max(0, int(round(proj_buses * 1.10)))
            },
            "trucks": {
                "min": max(0, int(round(proj_trucks * 0.90))),
                "max": max(0, int(round(proj_trucks * 1.10)))
            }
        }
        
        # Predict Congestion using existing Random Forest ML model pipeline
        try:
            pred_raw = predict_congestion(
                cand_time_val,
                cand_day,
                cand_dow,
                proj_cars,
                proj_bikes,
                proj_buses,
                proj_trucks
            )
            raw_str = str(pred_raw).upper()
            proj_pce = (proj_cars * 1.0) + (proj_bikes * 0.5) + (proj_buses * 2.5) + (proj_trucks * 3.0)

            if proj_pce >= 160.0 or proj_cars >= 65:
                cand_cong = "HIGH"
                cong_rank = 2
                cong_penalty = 150
            elif proj_pce >= 85.0 or proj_cars >= 25 or "MEDIUM" in raw_str:
                cand_cong = "NORMAL"
                cong_rank = 1
                cong_penalty = 50
            else:
                cand_cong = "LOW"
                cong_rank = 0
                cong_penalty = 0
        except Exception:
            cand_cong = "NORMAL"
            cong_rank = 1
            cong_penalty = 50
            
        # Speed & Travel Time calculation
        if cand_cong == "LOW":
            cand_speed = min(50.0, base_speed_kmh * 1.25)
        elif cand_cong == "NORMAL":
            cand_speed = base_speed_kmh
        else: # HIGH
            cand_speed = max(15.0, base_speed_kmh * 0.55)
            
        cand_time_min = max(1.0, round((dist_km / cand_speed) * 60, 1))
        free_flow_time = round((dist_km / 60.0) * 60, 1)
        cand_delay_min = max(0.0, round(cand_time_min - free_flow_time, 1))
        
        # Transparent Score: (CongestionPenalty * 2.0) + (TravelTime * 5.0) + (Delay * 3.0) + (Offset * 0.3)
        score = round((cong_penalty * 2.0) + (cand_time_min * 5.0) + (cand_delay_min * 3.0) + (offset * 0.3), 1)
        
        dept_disp = f"{cand_time_str} (+{offset}m)" if offset > 0 else cand_time_str

        cand_info = {
            "departure_time": cand_time_str,
            "departure_display": dept_disp,
            "predicted_congestion": cand_cong,
            "traffic_level": cand_cong,
            "predicted_vehicle_count": pred_total_vehicles,
            "vehicle_count_range": {
                "min": range_min,
                "max": range_max
            },
            "vehicle_type_breakdown": vehicle_breakdown,
            "estimated_speed_kmh": round(cand_speed, 1),
            "estimated_travel_time_min": cand_time_min,
            "estimated_delay_min": cand_delay_min,
            "score": score,
            "offset_min": offset,
            "time_str": cand_time_str,
            "congestion": cand_cong,
            "projected_counts": {
                "car_count": proj_cars,
                "bike_count": proj_bikes,
                "bus_count": proj_buses,
                "truck_count": proj_trucks
            }
        }
        candidates.append(cand_info)
        
        # Construct traffic forecast array item
        end_offset = candidate_offsets_min[idx + 1] if idx + 1 < len(candidate_offsets_min) else offset + 30
        forecast_item = {
            "start_offset_min": offset,
            "end_offset_min": end_offset,
            "departure_time": cand_time_str,
            "traffic_level": cand_cong,
            "predicted_vehicle_count": pred_total_vehicles,
            "vehicle_count_range": {
                "min": range_min,
                "max": range_max
            },
            "vehicle_type_breakdown": vehicle_breakdown,
            "estimated_speed_kmh": round(cand_speed, 1),
            "estimated_travel_time_min": cand_time_min,
            "estimated_delay_min": cand_delay_min,
            "score": score
        }
        traffic_forecast.append(forecast_item)
        
        print(f"\n+{offset} MIN", flush=True)
        print(f"TIME: {cand_time_str}", flush=True)
        print(f"PREDICTED VEHICLES: {pred_total_vehicles}", flush=True)
        print(f"RANGE: {range_min}-{range_max}", flush=True)
        print(f"TRAFFIC: {cand_cong}", flush=True)
        print(f"TRAVEL TIME: {cand_time_min} min", flush=True)
        print(f"DELAY: {cand_delay_min} min", flush=True)
        print(f"SCORE: {score}", flush=True)
        
    # Select candidate with lowest traffic score
    current_candidate = candidates[0]
    candidates_sorted = sorted(candidates, key=lambda c: (c["score"], c["estimated_travel_time_min"]))
    best_candidate = candidates_sorted[0]
    
    time_saved = max(0.0, round(current_candidate["estimated_travel_time_min"] - best_candidate["estimated_travel_time_min"], 1))
    
    # LEAVE NOW RULE: If waiting provides <= 2 min savings or if score is not strictly better, recommend "Leave Now"
    if best_candidate["offset_min"] == 0 or time_saved <= 2.0 or best_candidate["score"] >= current_candidate["score"]:
        recommended_time_only = "Leave Now"
        recommended_time_display = "Leave Now"
        reason = f"Traffic is currently favorable on {route_name} and waiting does not provide meaningful travel time savings."
        time_saved = 0.0
        best_cand_log_str = "Leave Now"
    else:
        recommended_time_only = best_candidate["departure_time"]
        recommended_time_display = f"{best_candidate['departure_time']} (+{best_candidate['offset_min']} min later)"
        reason = (
            f"Traffic on {route_name} is currently predicted as {current_candidate['predicted_congestion']}. "
            f"Leaving at {best_candidate['departure_time']} (+{best_candidate['offset_min']} min) is expected to reduce "
            f"congestion to {best_candidate['predicted_congestion']} (saving ~{time_saved} min)."
        )
        best_cand_log_str = f"{best_candidate['departure_time']} (+{best_candidate['offset_min']} min)"
        
    print(f"\nBEST TIME: {best_cand_log_str}", flush=True)
    print(f"ESTIMATED SAVING: {time_saved} min", flush=True)
    print("==========================================\n", flush=True)
    
    return {
        "current_traffic": current_candidate["predicted_congestion"],
        "recommended_departure_time": recommended_time_only,
        "recommended_time_display": recommended_time_display,
        "offset_minutes": best_candidate["offset_min"] if recommended_time_only != "Leave Now" else 0,
        "estimated_saving_min": time_saved,
        "current_vehicle_count": current_total_vehicles,
        "traffic_source": "DEMO_YOLO_VIDEO_AND_HISTORICAL_PATTERN",
        "reason": reason,
        "candidate_evaluations": candidates,
        "traffic_forecast": traffic_forecast
    }
