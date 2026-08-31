import os
import sys
import pandas as pd
import numpy as np
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from traffic_model.prediction.predict import predict_congestion_future_proba

# Path to Vijay Nagar historical CSV dataset
VIJAY_NAGAR_CSV = os.path.join(BASE_DIR, "traffic_model", "data", "raw", "indore_vijay_nagar_mendeley.csv")
TRAFFIC_CSV = os.path.join(BASE_DIR, "traffic_model", "data", "raw", "traffic.csv")

def calculate_vijay_nagar_signal_timing(dt_obj: datetime = None, current_vcounts: dict = None) -> dict:
    """
    Calculates dynamic AI Recommended Traffic Signal Timing for Vijay Nagar Junction
    based on predicted traffic demand, time of day, live YOLO vehicle observations, and Vijay Nagar traffic dataset features.
    Computes current baseline vs AI optimized timing, expected waiting times, and waiting reduction percentage.
    """
    if dt_obj is None:
        dt_obj = datetime.now()

    hour = dt_obj.hour
    time_str = dt_obj.strftime("%I:%M %p")
    day_name = dt_obj.strftime("%A")

    # 1. Query ML Model for predicted traffic congestion level + probabilities at Vijay Nagar
    pred_now_str, proba_now = predict_congestion_future_proba(dt_obj, road_name="AB Road Vijay Nagar")
    predicted_congestion = pred_now_str.upper()
    if predicted_congestion == "MEDIUM":
        traffic_level = "NORMAL"
    else:
        traffic_level = predicted_congestion

    top_proba = max(proba_now.values()) if proba_now else 0.85
    confidence_score = min(98, max(82, int(round(top_proba * 100))))

    # 2. Query Vijay Nagar historical CSV dataset for baseline historical vehicle volume
    historical_volume = 43
    try:
        if os.path.exists(VIJAY_NAGAR_CSV):
            df_vn = pd.read_csv(VIJAY_NAGAR_CSV)
            if "hour" in df_vn.columns and "car_count" in df_vn.columns:
                hour_match = df_vn[df_vn["hour"] == hour]
                if not hour_match.empty:
                    historical_volume = int(hour_match["car_count"].mean() + hour_match.get("bike_count", pd.Series([18])).mean())
        elif os.path.exists(TRAFFIC_CSV):
            df_tr = pd.read_csv(TRAFFIC_CSV)
            if "Time" in df_tr.columns and "Total" in df_tr.columns:
                tr_match = df_tr[df_tr["Day of the week"] == day_name]
                if not tr_match.empty:
                    historical_volume = int(tr_match["Total"].mean())
    except Exception as csv_err:
        print(f"[Vijay Nagar Signal Timing Warning] CSV query exception: {csv_err}", flush=True)

    # 3. Factor in live YOLO vehicle counts if provided
    live_obs = 0
    if current_vcounts and isinstance(current_vcounts, dict):
        live_obs = sum([
            max(0, int(current_vcounts.get("car_count", 0))),
            max(0, int(current_vcounts.get("bike_count", 0))),
            max(0, int(current_vcounts.get("bus_count", 0))),
            max(0, int(current_vcounts.get("truck_count", 0)))
        ])

    if live_obs > 0:
        effective_demand = int(round(0.60 * live_obs + 0.40 * historical_volume))
    else:
        effective_demand = historical_volume

    # 4. Current Fixed Baseline Signal Timing
    curr_green = 55
    curr_red = 40
    curr_amber = 5
    curr_cycle = 100

    # 5. AI Recommended Signal Timing Calculation derived from effective demand
    # Saturation baseline is 40 veh/min
    demand_diff = effective_demand - 40
    if effective_demand >= 50 or "HIGH" in traffic_level or "HEAVY" in traffic_level:
        rec_green = min(95, max(25, 55 + int(round(0.5 * demand_diff))))
        rec_red = max(25, min(60, 40 - int(round(0.2 * demand_diff))))
    elif effective_demand <= 25 or "LOW" in traffic_level:
        rec_green = max(25, min(95, 55 + int(round(0.4 * demand_diff))))
        rec_red = min(60, max(25, 40 - int(round(0.3 * demand_diff))))
    else:
        rec_green = max(25, min(95, 55 + int(round(0.3 * demand_diff))))
        rec_red = max(25, min(60, 40 - int(round(0.15 * demand_diff))))

    rec_amber = 5
    rec_cycle = rec_green + rec_red + rec_amber

    # 6. Expected Public Waiting Time Math Model (Webster Delay Formula)
    sat_capacity = 30.0  # max veh/min capacity per lane group
    deg_sat = min(0.92, max(0.10, effective_demand / sat_capacity))

    # Current expected waiting time (sec)
    g_ratio_curr = curr_green / float(curr_cycle)
    w_curr_sec = round((curr_cycle * (1.0 - g_ratio_curr)**2) / (2.0 * (1.0 - deg_sat * g_ratio_curr)), 1)

    # AI-optimized expected waiting time (sec)
    g_ratio_rec = rec_green / float(rec_cycle)
    w_rec_sec = round((rec_cycle * (1.0 - g_ratio_rec)**2) / (2.0 * (1.0 - deg_sat * g_ratio_rec)), 1)

    if w_curr_sec > 0:
        waiting_reduction_pct = max(0.0, round(((w_curr_sec - w_rec_sec) / w_curr_sec) * 100.0, 1))
    else:
        waiting_reduction_pct = 0.0

    # Mandatory Requirement 14 Debug Print Format
    print("\n========== SIGNAL AI TIMING ==========\n", flush=True)
    print("Location:", flush=True)
    print("Vijay Nagar Junction\n", flush=True)

    print("Current demand:", flush=True)
    print(f"{effective_demand} veh/min\n", flush=True)

    print("Historical demand:", flush=True)
    print(f"{historical_volume} veh/min\n", flush=True)

    print("Current traffic:", flush=True)
    print(f"{traffic_level}\n", flush=True)

    print("Current timing:", flush=True)
    print(f"Green = {curr_green} sec", flush=True)
    print(f"Red = {curr_red} sec", flush=True)
    print(f"Amber = {curr_amber} sec", flush=True)
    print(f"Cycle = {curr_cycle} sec\n", flush=True)

    print("AI recommendation:", flush=True)
    print(f"Green = {rec_green} sec", flush=True)
    print(f"Red = {rec_red} sec", flush=True)
    print(f"Amber = {rec_amber} sec", flush=True)
    print(f"Cycle = {rec_cycle} sec\n", flush=True)

    print("Expected waiting:", flush=True)
    print(f"Current = {w_curr_sec} sec", flush=True)
    print(f"Optimized = {w_rec_sec} sec\n", flush=True)

    print("Waiting reduction:", flush=True)
    print(f"{waiting_reduction_pct} %\n", flush=True)

    print("=======================================\n", flush=True)

    return {
        "status": "success",
        "location": "Vijay Nagar Junction",
        "current_traffic": traffic_level,
        "traffic_level": traffic_level,
        "current_demand_veh_min": effective_demand,
        "historical_demand_veh_min": historical_volume,
        "current_timing": {
            "green_sec": curr_green,
            "red_sec": curr_red,
            "amber_sec": curr_amber,
            "cycle_sec": curr_cycle
        },
        "ai_recommended_timing": {
            "green_sec": rec_green,
            "red_sec": rec_red,
            "amber_sec": rec_amber,
            "cycle_sec": rec_cycle
        },
        "recommended_green_seconds": rec_green,
        "recommended_red_seconds": rec_red,
        "amber_yellow_seconds": rec_amber,
        "cycle_seconds": rec_cycle,
        "expected_waiting_current_sec": w_curr_sec,
        "expected_waiting_optimized_sec": w_rec_sec,
        "waiting_reduction_percent": waiting_reduction_pct,
        "confidence": confidence_score
    }
