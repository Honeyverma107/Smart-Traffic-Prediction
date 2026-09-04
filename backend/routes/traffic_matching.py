import math
import os
from datetime import datetime
from django.conf import settings
from .models import SegmentTrafficObservation
from traffic_model.prediction.predict import predict_congestion, _get_dataset_minute_baseline

# Known Indore Traffic Locations from datasets with GPS coordinates & radii
INDORE_TRAFFIC_LOCATIONS = [
    {
        "road_id": "IND_VN_01",
        "road_name": "AB Road Vijay Nagar",
        "lat": 22.7533,
        "lng": 75.8937,
        "radius_m": 800.0,
        "aliases": ["ab road vijay nagar", "ab rd vijay nagar", "vijay nagar", "vijay nagar square", "ind_vn_01", "ind_vn_05"]
    },
    {
        "road_id": "IND_VN_05",
        "road_name": "Vijay Nagar Square",
        "lat": 22.7533,
        "lng": 75.8937,
        "radius_m": 600.0,
        "aliases": ["vijay nagar square", "vijay nagar junction", "ind_vn_05"]
    },
    {
        "road_id": "IND_VN_02",
        "road_name": "Ring Road Radisson Square",
        "lat": 22.7391,
        "lng": 75.8917,
        "radius_m": 800.0,
        "aliases": ["ring road radisson square", "radisson square", "eastern ring road", "radisson", "ind_vn_02"]
    },
    {
        "road_id": "IND_VN_03",
        "road_name": "MR-10 Junction",
        "lat": 22.7660,
        "lng": 75.8830,
        "radius_m": 1000.0,
        "aliases": ["mr-10 junction", "mr-10 road", "mr 10", "mr10", "mr-10", "ind_vn_03"]
    },
    {
        "road_id": "IND_VN_04",
        "road_name": "Scheme 54 Bombay Hospital",
        "lat": 22.7580,
        "lng": 75.8950,
        "radius_m": 700.0,
        "aliases": ["scheme 54 bombay hospital", "bombay hospital square", "bombay hospital", "scheme 54", "ind_vn_04"]
    },
    {
        "road_id": "IND_PL_01",
        "road_name": "Ring Road Palasia",
        "lat": 22.7244,
        "lng": 75.8839,
        "radius_m": 800.0,
        "aliases": ["ring road palasia", "palasia square", "palasia", "old palasia", "new palasia"]
    },
    {
        "road_id": "IND_RJ_01",
        "road_name": "MG Road Rajwada",
        "lat": 22.7196,
        "lng": 75.8577,
        "radius_m": 800.0,
        "aliases": ["mg road rajwada", "rajwada square", "rajwada", "mg road"]
    },
    {
        "road_id": "IND_BK_01",
        "road_name": "Bhanwarkuan Square",
        "lat": 22.6898,
        "lng": 75.8665,
        "radius_m": 800.0,
        "aliases": ["bhanwarkuan square", "bhanwarkuan", "bhanwarkwa"]
    },
    {
        "road_id": "IND_CL_01",
        "road_name": "Collectorate Square",
        "lat": 22.7125,
        "lng": 75.8512,
        "radius_m": 800.0,
        "aliases": ["collectorate square", "collectorate", "moti bungalow"]
    },
    {
        "road_id": "IND_KJ_01",
        "road_name": "Khajrana Square",
        "lat": 22.7275,
        "lng": 75.9083,
        "radius_m": 900.0,
        "aliases": ["khajrana square", "khajrana", "khajrana road"]
    }
]

def haversine_distance_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculates Haversine distance in meters between two lat/lng points."""
    R = 6371000.0
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (math.sin(dlat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

def normalize_road_name(raw_name: str) -> str:
    """Normalizes road name strings for consistent matching."""
    if not raw_name:
        return ""
    clean = str(raw_name).strip().lower()
    clean = clean.replace(".", "").replace("-", " ").replace("_", " ")
    words = clean.split()
    return " ".join(words)

def match_segment_to_indore_location(lat_start: float, lng_start: float, lat_end: float, lng_end: float) -> dict:
    """
    Matches a route segment geometry to known Indore traffic locations based on geographic proximity.
    Priority order:
    1. Known location within configured radius (closest match)
    2. Unmapped fallback
    """
    mid_lat = (lat_start + lat_end) / 2.0
    mid_lng = (lng_start + lng_end) / 2.0

    best_match = None
    min_dist = float('inf')

    for loc in INDORE_TRAFFIC_LOCATIONS:
        dist_m = haversine_distance_m(mid_lat, mid_lng, loc["lat"], loc["lng"])
        if dist_m <= loc["radius_m"] and dist_m < min_dist:
            min_dist = dist_m
            best_match = {
                "matched": True,
                "road_id": loc["road_id"],
                "road_name": loc["road_name"],
                "match_method": "GEOGRAPHIC_PROXIMITY",
                "match_distance_m": round(dist_m, 1),
                "location_center": {"lat": loc["lat"], "lng": loc["lng"]}
            }

    if best_match:
        return best_match

    return {
        "matched": False,
        "road_id": "IND_GENERIC",
        "road_name": "Generic Indore Corridor",
        "match_method": "UNMATCHED_FALLBACK",
        "match_distance_m": None,
        "location_center": None
    }

def get_camera_observation_for_segment(seg_mid_lat: float, seg_mid_lng: float, camera_counts_dict: dict, max_dist_m: float = 400.0) -> dict:
    """
    Geographically matches a route segment to nearby active cameras.
    YOLO counts apply ONLY if segment is within max_dist_m (default 400m) of camera GPS.
    """
    best_feed_id = None
    best_dist = float('inf')
    best_counts = None

    for feed_id, c_data in camera_counts_dict.items():
        c_lat = c_data.get("lat")
        c_lng = c_data.get("lng")
        if c_lat is None or c_lng is None:
            continue

        dist_m = haversine_distance_m(seg_mid_lat, seg_mid_lng, c_lat, c_lng)
        if dist_m <= max_dist_m and dist_m < best_dist:
            best_dist = dist_m
            best_feed_id = feed_id
            best_counts = c_data.get("vcounts")

    if best_feed_id and best_counts:
        return {
            "available": True,
            "camera_id": best_feed_id,
            "distance_m": round(best_dist, 1),
            "car_count": best_counts.get("car_count", 0),
            "bike_count": best_counts.get("bike_count", 0),
            "bus_count": best_counts.get("bus_count", 0),
            "truck_count": best_counts.get("truck_count", 0)
        }

    return {
        "available": False,
        "camera_id": None,
        "distance_m": None,
        "car_count": None,
        "bike_count": None,
        "bus_count": None,
        "truck_count": None
    }

def get_road_historical_counts(dt_obj: datetime, road_name: str) -> dict:
    """Fetches road-specific historical baseline counts from dataset."""
    baseline = _get_dataset_minute_baseline(dt_obj, road_name)
    return {
        "car_count": baseline.get("car_count", 35),
        "bike_count": baseline.get("bike_count", 50),
        "bus_count": baseline.get("bus_count", 5),
        "truck_count": baseline.get("truck_count", 3)
    }

def get_road_recent_counts(dt_obj: datetime, road_name: str) -> dict:
    """
    Fetches road-specific recent counts from SegmentTrafficObservation DB records or recent dataset.
    Returns None if no recent observation exists for target road_name.
    """
    try:
        obs = SegmentTrafficObservation.objects.filter(
            road_name__icontains=road_name
        ).order_by('-observed_at').first()

        if obs:
            return {
                "available": True,
                "car_count": obs.car_count,
                "bike_count": obs.bike_count,
                "bus_count": obs.bus_count,
                "truck_count": obs.truck_count,
                "observed_at": obs.observed_at.strftime("%Y-%m-%d %H:%M:%S")
            }
    except Exception:
        pass

    return {"available": False}

def build_segment_features_and_predict(
    dt_obj: datetime,
    road_name: str,
    hist_counts: dict,
    recent_counts: dict,
    yolo_obs: dict
) -> dict:
    """
    Combines counts following the strict fallback hierarchy:
    1. Valid YOLO (if camera geographically covers segment)
    2. Recent road-specific data
    3. Historical road-specific data
    4. Generic dataset fallback

    Executes Random Forest ML prediction on segment counts.
    """
    time_str = dt_obj.strftime("%I:%M:%S %p")
    day = dt_obj.day
    day_of_week = dt_obj.strftime("%A")

    data_sources_used = []

    # Blend inputs based on data availability
    if yolo_obs.get("available"):
        data_sources_used.append(f"YOLO Camera ({yolo_obs['camera_id']} @ {yolo_obs['distance_m']}m)")
        y_car = yolo_obs["car_count"]
        y_bike = yolo_obs["bike_count"]
        y_bus = yolo_obs["bus_count"]
        y_truck = yolo_obs["truck_count"]

        if recent_counts.get("available"):
            data_sources_used.append("Recent Road DB")
            c_car = int(round(0.50 * y_car + 0.30 * recent_counts["car_count"] + 0.20 * hist_counts["car_count"]))
            c_bike = int(round(0.50 * y_bike + 0.30 * recent_counts["bike_count"] + 0.20 * hist_counts["bike_count"]))
            c_bus = int(round(0.50 * y_bus + 0.30 * recent_counts["bus_count"] + 0.20 * hist_counts["bus_count"]))
            c_truck = int(round(0.50 * y_truck + 0.30 * recent_counts["truck_count"] + 0.20 * hist_counts["truck_count"]))
        else:
            data_sources_used.append("Historical Road Baseline")
            c_car = int(round(0.65 * y_car + 0.35 * hist_counts["car_count"]))
            c_bike = int(round(0.65 * y_bike + 0.35 * hist_counts["bike_count"]))
            c_bus = int(round(0.65 * y_bus + 0.35 * hist_counts["bus_count"]))
            c_truck = int(round(0.65 * y_truck + 0.35 * hist_counts["truck_count"]))

    elif recent_counts.get("available"):
        data_sources_used.append("Recent Road DB")
        data_sources_used.append("Historical Road Baseline")
        c_car = int(round(0.60 * recent_counts["car_count"] + 0.40 * hist_counts["car_count"]))
        c_bike = int(round(0.60 * recent_counts["bike_count"] + 0.40 * hist_counts["bike_count"]))
        c_bus = int(round(0.60 * recent_counts["bus_count"] + 0.40 * hist_counts["bus_count"]))
        c_truck = int(round(0.60 * recent_counts["truck_count"] + 0.40 * hist_counts["truck_count"]))
    else:
        data_sources_used.append("Historical Road Baseline")
        c_car = hist_counts["car_count"]
        c_bike = hist_counts["bike_count"]
        c_bus = hist_counts["bus_count"]
        c_truck = hist_counts["truck_count"]

    # Execute ML Prediction
    raw_pred = predict_congestion(
        time_str=time_str,
        day=day,
        day_of_week=day_of_week,
        car_count=c_car,
        bike_count=c_bike,
        bus_count=c_bus,
        truck_count=c_truck,
        road_name=road_name
    )

    s_pred = str(raw_pred).upper()
    if "HIGH" in s_pred or "HEAVY" in s_pred:
        ml_level = "HIGH"
    elif "MEDIUM" in s_pred or "NORMAL" in s_pred or "MODERATE" in s_pred:
        ml_level = "NORMAL"
    else:
        ml_level = "LOW"

    return {
        "car_count": c_car,
        "bike_count": c_bike,
        "bus_count": c_bus,
        "truck_count": c_truck,
        "data_sources_used": data_sources_used,
        "ml_prediction": ml_level,
        "raw_ml_label": str(raw_pred)
    }

def aggregate_route_congestion(segment_predictions: list) -> dict:
    """
    Length-weighted aggregation of segment ML predictions across the route.
    Scale: LOW = 1, NORMAL = 2, HIGH = 3.
    Returns aggregated route prediction ('LOW', 'NORMAL', 'HIGH'), score, and counts.
    """
    if not segment_predictions:
        return {
            "predicted_congestion": "NORMAL",
            "traffic_score": 2.0,
            "total_segments": 0,
            "congested_segments": 0,
            "camera_covered_segments": 0,
            "matched_segments": 0
        }

    total_len = 0.0
    weighted_sum = 0.0
    congested_count = 0
    camera_covered_count = 0
    matched_count = 0

    severity_map = {"LOW": 1.0, "NORMAL": 2.0, "HIGH": 3.0}

    for seg in segment_predictions:
        seg_len = seg.get("length_m", 50.0)
        ml_pred = seg.get("congestion_level", "NORMAL")
        sev = severity_map.get(ml_pred, 2.0)

        total_len += seg_len
        weighted_sum += sev * seg_len

        if ml_pred == "HIGH":
            congested_count += 1
        if seg.get("segment_observation", {}).get("available"):
            camera_covered_count += 1
        if seg.get("matched", True):
            matched_count += 1

    avg_score = round(weighted_sum / max(1.0, total_len), 2)

    if avg_score >= 2.35:
        overall_pred = "HIGH"
    elif avg_score >= 1.60:
        overall_pred = "NORMAL"
    else:
        overall_pred = "LOW"

    return {
        "predicted_congestion": overall_pred,
        "traffic_score": avg_score,
        "total_segments": len(segment_predictions),
        "congested_segments": congested_count,
        "camera_covered_segments": camera_covered_count,
        "matched_segments": matched_count
    }
