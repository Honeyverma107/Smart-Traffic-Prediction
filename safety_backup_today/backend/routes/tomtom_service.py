import os
import requests
from django.conf import settings

# Strict Spatial Bounding Box for Indore, Madhya Pradesh, India
INDORE_BOUNDS = {
    "min_lat": 22.50,
    "max_lat": 22.90,
    "min_lng": 75.65,
    "max_lng": 76.05
}

def get_tomtom_api_key():
    """
    Safely retrieves the TomTom API key from settings or environment.
    Never prints or exposes the raw API key.
    """
    key = getattr(settings, 'TOMTOM_API_KEY', '') or os.getenv('TOMTOM_API_KEY', '')
    return key.strip()

def is_within_indore(lat: float, lng: float) -> bool:
    """
    Validates that coordinates fall strictly within the supported Indore urban bounding box.
    """
    try:
        lat_f, lng_f = float(lat), float(lng)
        return (INDORE_BOUNDS["min_lat"] <= lat_f <= INDORE_BOUNDS["max_lat"]) and \
               (INDORE_BOUNDS["min_lng"] <= lng_f <= INDORE_BOUNDS["max_lng"])
    except Exception:
        return False

def get_tomtom_traffic_flow(lat: float, lng: float) -> dict:
    """
    Fetches real-time TomTom Flow Segment Data for a specific Indore coordinate.
    Enforces Indore spatial bounding restriction before executing external request.
    """
    key = get_tomtom_api_key()
    if not key:
        print("[TomTom Warning] TOMTOM_API_KEY is not set in environment.", flush=True)
        return {"available": False, "reason": "API key missing"}

    if not is_within_indore(lat, lng):
        print(f"[TomTom Scoping Warning] Coordinates ({lat:.4f}, {lng:.4f}) fall outside supported Indore area.", flush=True)
        return {"available": False, "reason": "Coordinates outside supported Indore urban area"}

    url = f"https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?key={key}&point={lat},{lng}"
    try:
        resp = requests.get(url, timeout=5)
        if resp.status_code == 200:
            data = resp.json().get("flowSegmentData", {})
            curr_speed = float(data.get("currentSpeed", 45))
            free_speed = float(data.get("freeFlowSpeed", 50))
            curr_time = float(data.get("currentTravelTime", 0))
            free_time = float(data.get("freeFlowTravelTime", 0))
            
            speed_ratio = round(curr_speed / max(1.0, free_speed), 2)
            
            if speed_ratio >= 0.85:
                traffic_level = "LOW"
            elif speed_ratio >= 0.60:
                traffic_level = "NORMAL"
            else:
                traffic_level = "HIGH"

            print(f"[TomTom Flow Scoped] Indore Lat: {lat:.4f}, Lng: {lng:.4f} | Current Speed: {curr_speed} km/h | FreeFlow Speed: {free_speed} km/h | Ratio: {speed_ratio} | Level: {traffic_level}", flush=True)

            return {
                "available": True,
                "current_speed_kmh": curr_speed,
                "free_flow_speed_kmh": free_speed,
                "current_travel_time_sec": curr_time,
                "free_flow_travel_time_sec": free_time,
                "speed_ratio": speed_ratio,
                "traffic_level": traffic_level,
                "confidence": data.get("confidence", 1.0)
            }
        else:
            print(f"[TomTom Flow Warning] HTTP Status {resp.status_code} for point ({lat}, {lng})", flush=True)
            return {"available": False, "status_code": resp.status_code}
    except Exception as e:
        print(f"[TomTom Flow Exception] {e}", flush=True)
        return {"available": False, "error": str(e)}

def get_tomtom_route_traffic(start_lat: float, start_lng: float, end_lat: float, end_lng: float) -> dict:
    """
    Fetches real-time TomTom Route Traffic Summary between start and end coordinates within Indore.
    Enforces Indore spatial bounding restriction for both start and destination coordinates.
    """
    key = get_tomtom_api_key()
    if not key:
        return {"available": False, "reason": "API key missing"}

    if not is_within_indore(start_lat, start_lng) or not is_within_indore(end_lat, end_lng):
        print(f"[TomTom Scoping Warning] Start ({start_lat:.4f}, {start_lng:.4f}) or End ({end_lat:.4f}, {end_lng:.4f}) outside Indore area.", flush=True)
        return {"available": False, "reason": "Route coordinates fall outside supported Indore area"}

    url = f"https://api.tomtom.com/routing/1/calculateRoute/{start_lat},{start_lng}:{end_lat},{end_lng}/json?key={key}&traffic=true"
    try:
        resp = requests.get(url, timeout=6)
        if resp.status_code == 200:
            routes = resp.json().get("routes", [])
            if routes:
                summary = routes[0].get("summary", {})
                length_m = float(summary.get("lengthInMeters", 0))
                travel_sec = float(summary.get("travelTimeInSeconds", 0))
                delay_sec = float(summary.get("trafficDelayInSeconds", 0))

                dist_km = round(length_m / 1000.0, 2)
                travel_min = max(1.0, round(travel_sec / 60.0, 1))
                delay_min = max(0.0, round(delay_sec / 60.0, 1))
                route_speed_kmh = round((dist_km / (travel_min / 60.0)), 1) if travel_min > 0 else 35.0

                if delay_min >= 8.0 or route_speed_kmh < 20.0:
                    traffic_level = "HIGH"
                elif delay_min >= 2.0 or route_speed_kmh < 38.0:
                    traffic_level = "NORMAL"
                else:
                    traffic_level = "LOW"

                print(f"[TomTom Route Scoped] Indore Corridor: ({start_lat:.4f}, {start_lng:.4f}) -> ({end_lat:.4f}, {end_lng:.4f}) | Dist: {dist_km} km | Time: {travel_min}m | Delay: {delay_min}m | Level: {traffic_level}", flush=True)

                return {
                    "available": True,
                    "distance_km": dist_km,
                    "travel_time_min": travel_min,
                    "delay_min": delay_min,
                    "route_speed_kmh": route_speed_kmh,
                    "traffic_level": traffic_level,
                    "raw_delay_sec": delay_sec,
                    "raw_travel_sec": travel_sec
                }
        print(f"[TomTom Route Warning] HTTP Status {resp.status_code}", flush=True)
        return {"available": False, "status_code": resp.status_code}
    except Exception as e:
        print(f"[TomTom Route Exception] {e}", flush=True)
        return {"available": False, "error": str(e)}
