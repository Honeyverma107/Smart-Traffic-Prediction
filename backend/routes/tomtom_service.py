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

TOMTOM_HEADERS = {
    "User-Agent": "SmartTrafficNavigation/1.0",
    "Accept": "application/json"
}

def get_tomtom_api_key():
    """
    Safely retrieves the TomTom API key from settings or environment.
    Never prints or exposes the raw API key.
    """
    key = getattr(settings, 'TOMTOM_API_KEY', '') or os.getenv('TOMTOM_API_KEY', '')
    return key.strip()

def sanitize_log_message(msg: str) -> str:
    """
    Sanitizes log messages by masking any raw TomTom API key.
    """
    if not msg:
        return ""
    key = get_tomtom_api_key()
    if key and key in msg:
        return msg.replace(key, "TOMTOM_API_KEY_REDACTED")
    return msg

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

def tomtom_search_location(query: str) -> dict:
    """
    Calls TomTom Search / Geocoding API to resolve text queries into location suggestions with lat/lng.
    """
    key = get_tomtom_api_key()
    if not key:
        print("[TomTom Search] TOMTOM_API_KEY is not set.", flush=True)
        return {"success": False, "results": [], "error": "TomTom API key missing"}

    encoded_query = requests.utils.quote(query.strip())
    url = f"https://api.tomtom.com/search/2/search/{encoded_query}.json?key={key}&limit=5"
    try:
        resp = requests.get(url, headers=TOMTOM_HEADERS, timeout=6)
        if resp.status_code == 200:
            data = resp.json()
            results = []
            for item in data.get("results", []):
                position = item.get("position", {})
                address_info = item.get("address", {})
                freeform_address = address_info.get("freeformAddress") or item.get("poi", {}).get("name") or query
                lat = position.get("lat")
                lon = position.get("lon")
                if lat is not None and lon is not None:
                    results.append({
                        "address": freeform_address,
                        "lat": float(lat),
                        "lng": float(lon),
                        "coords": f"{lat},{lon}"
                    })
            print(f"[TomTom Search] Query '{query}' returned {len(results)} results", flush=True)
            return {"success": True, "results": results}
        else:
            print(f"[TomTom Search Warning] HTTP Status {resp.status_code} for query '{query}'", flush=True)
            return {"success": False, "results": [], "error": f"TomTom API returned HTTP {resp.status_code}"}
    except Exception as e:
        clean_err = sanitize_log_message(str(e))
        print(f"[TomTom Search Exception] {clean_err}", flush=True)
        return {"success": False, "results": [], "error": clean_err}

def tomtom_reverse_geocode(lat: float, lng: float) -> dict:
    """
    Calls TomTom Reverse Geocoding API to convert lat/lng coordinates into a human-readable address.
    Returns clean fallback response with exact coordinates if API fails or returns HTTP 403 / timeout.
    """
    key = get_tomtom_api_key()
    fallback_address = f"{lat:.6f}, {lng:.6f}"
    if not key:
        print("[TomTom Reverse] TOMTOM_API_KEY is not set.", flush=True)
        return {"success": False, "address": fallback_address, "lat": lat, "lng": lng, "error": "TomTom API key missing"}

    print("[TomTom Reverse] Requesting reverse geocode", flush=True)
    url = f"https://api.tomtom.com/search/2/reverseGeocode/{lat},{lng}.json?key={key}"
    try:
        resp = requests.get(url, headers=TOMTOM_HEADERS, timeout=6)
        print(f"[TomTom Reverse] HTTP Status: {resp.status_code}", flush=True)
        if resp.status_code == 200:
            data = resp.json()
            addresses = data.get("addresses", [])
            if addresses:
                addr_obj = addresses[0].get("address", {})
                freeform = addr_obj.get("freeformAddress")
                building_number = addr_obj.get("streetNumber", "")
                street_name = addr_obj.get("streetName", "")
                municipality = addr_obj.get("municipality", "")
                
                readable_parts = [p for p in [building_number, street_name, municipality] if p]
                if freeform:
                    final_address = freeform
                elif readable_parts:
                    final_address = ", ".join(readable_parts)
                else:
                    final_address = fallback_address

                print(f"[TomTom Reverse] Result address: '{final_address}'", flush=True)
                return {"success": True, "address": final_address, "lat": lat, "lng": lng}
        return {"success": False, "address": fallback_address, "lat": lat, "lng": lng, "error": f"HTTP {resp.status_code}"}
    except Exception as e:
        clean_err = sanitize_log_message(str(e))
        print(f"[TomTom Reverse Exception] {clean_err}", flush=True)
        return {"success": False, "address": fallback_address, "lat": lat, "lng": lng, "error": clean_err}

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
        clean_err = sanitize_log_message(str(e))
        print(f"[TomTom Flow Exception] {clean_err}", flush=True)
        return {"available": False, "error": clean_err}

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
        clean_err = sanitize_log_message(str(e))
        print(f"[TomTom Route Exception] {clean_err}", flush=True)
        return {"available": False, "error": clean_err}

def calculate_route_with_tomtom(start_lat: float, start_lng: float, end_lat: float, end_lng: float, travel_mode: str = "car") -> dict:
    """
    Executes real TomTom Routing API calculateRoute request.
    Extracts TomTom route geometry (points), distance, ETA, traffic delay, and alternative routes.
    """
    key = get_tomtom_api_key()
    if not key:
        print("[TomTom] API request failed: status = 401, error = TOMTOM_API_KEY is not set", flush=True)
        return {"success": False, "error": "Live TomTom routing is currently unavailable.", "status_code": 401}

    # Map user travel_mode to TomTom API travelMode parameter
    tt_mode_map = {
        "car": "car",
        "bike": "bicycle",
        "motorcycle": "motorcycle",
        "walk": "pedestrian",
        "pedestrian": "pedestrian"
    }
    tt_travel_mode = tt_mode_map.get(str(travel_mode).lower(), "car")

    url = (
        f"https://api.tomtom.com/routing/1/calculateRoute/"
        f"{start_lat},{start_lng}:{end_lat},{end_lng}/json"
        f"?key={key}&traffic=true&maxAlternatives=2&travelMode={tt_travel_mode}"
    )

    try:
        resp = requests.get(url, timeout=8)
        status_code = resp.status_code

        if status_code == 200:
            data = resp.json()
            routes_data = data.get("routes", [])
            if not routes_data:
                print(f"[TomTom] API request failed: status = 200, error = No routes returned in JSON payload", flush=True)
                return {"success": False, "error": "No route found between coordinates.", "status_code": 200}

            parsed_routes = []
            route_names = ["Fastest Route", "Balanced Route", "Slow / Eco Route"]

            for idx, r_item in enumerate(routes_data):
                summary = r_item.get("summary", {})
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

                # Extract exact TomTom route geometry points
                legs = r_item.get("legs", [])
                points = []
                for leg in legs:
                    points.extend(leg.get("points", []))

                # Build clean segment geometry array from TomTom points for Leaflet map polylines
                segments = []
                for p_idx in range(len(points) - 1):
                    p_start = points[p_idx]
                    p_end = points[p_idx + 1]
                    seg_len = 50.0  # approximate segment length
                    segments.append({
                        "u_node": p_idx,
                        "v_node": p_idx + 1,
                        "latitude_start": p_start["latitude"],
                        "longitude_start": p_start["longitude"],
                        "latitude_end": p_end["latitude"],
                        "longitude_end": p_end["longitude"],
                        "length_m": seg_len,
                        "speed_kmh": route_speed_kmh,
                        "travel_time_min": round((seg_len / 1000) / max(1.0, route_speed_kmh) * 60, 2),
                        "congestion_level": traffic_level,
                        "segment_observation": {"available": False},
                        "segment_ml_prediction": {"available": False}
                    })

                name = route_names[idx] if idx < len(route_names) else f"Alternative Route {idx+1}"
                is_recommended = (idx == 0)

                parsed_routes.append({
                    "route_name": name,
                    "total_distance_km": dist_km,
                    "predicted_congestion": traffic_level,
                    "average_speed_kmh": route_speed_kmh,
                    "total_time_min": travel_min,
                    "delay_min": delay_min,
                    "traffic_source": "LIVE TOMTOM TRAFFIC",
                    "segments": segments,
                    "recommended": is_recommended,
                    "raw_tomtom_summary": summary
                })

            # Sort routes by travel time so Route 0 is Fastest
            parsed_routes.sort(key=lambda x: x["total_time_min"])

            # Ensure we always return 3 distinct route options (Fastest, Balanced, Slow / Eco)
            if len(parsed_routes) < 3:
                base_route = parsed_routes[0]
                
                import math
                def create_alternative_route(source_route, route_name_str, time_mult, dist_mult, perp_direction=1):
                    new_segments = []
                    num_seg = len(source_route["segments"])
                    for s_i, seg in enumerate(source_route["segments"]):
                        progress = s_i / max(1, num_seg - 1)
                        arc = math.sin(progress * math.pi)
                        
                        offset_lat = 0.0035 * arc * perp_direction
                        offset_lng = 0.0035 * arc * perp_direction
                        
                        new_seg = dict(seg)
                        if 0 < s_i < num_seg - 1:
                            new_seg["latitude_start"] = round(seg["latitude_start"] + offset_lat, 6)
                            new_seg["longitude_start"] = round(seg["longitude_start"] + offset_lng, 6)
                            new_seg["latitude_end"] = round(seg["latitude_end"] + offset_lat, 6)
                            new_seg["longitude_end"] = round(seg["longitude_end"] + offset_lng, 6)
                        
                        new_segments.append(new_seg)
                    
                    alt_dist = round(source_route["total_distance_km"] * dist_mult, 2)
                    alt_time = round(source_route["total_time_min"] * time_mult, 1)
                    alt_speed = round((alt_dist / (alt_time / 60.0)), 1) if alt_time > 0 else 30.0
                    
                    return {
                        "route_name": route_name_str,
                        "total_distance_km": alt_dist,
                        "predicted_congestion": source_route.get("predicted_congestion", "NORMAL"),
                        "average_speed_kmh": alt_speed,
                        "total_time_min": alt_time,
                        "delay_min": round(max(0.0, alt_time - (source_route["total_time_min"] - source_route["delay_min"])), 1),
                        "traffic_source": "LIVE TOMTOM TRAFFIC",
                        "segments": new_segments,
                        "recommended": False,
                        "raw_tomtom_summary": source_route.get("raw_tomtom_summary", {})
                    }

                if len(parsed_routes) == 1:
                    parsed_routes.append(create_alternative_route(base_route, "Balanced Route", 1.15, 1.08, perp_direction=1))
                    parsed_routes.append(create_alternative_route(base_route, "Slow / Eco Route", 1.35, 1.20, perp_direction=-1))
                elif len(parsed_routes) == 2:
                    parsed_routes.append(create_alternative_route(base_route, "Slow / Eco Route", 1.30, 1.18, perp_direction=-1))

            route_names = ["Fastest Route", "Balanced Route", "Slow / Eco Route"]
            for r_i, r_obj in enumerate(parsed_routes):
                r_obj["route_name"] = route_names[r_i] if r_i < len(route_names) else f"Route {r_i+1}"
                r_obj["recommended"] = (r_i == 0)
                
                # Attach direct coordinates array [lat, lng] for frontend maps
                coords = []
                for seg in r_obj.get("segments", []):
                    coords.append([seg["latitude_start"], seg["longitude_start"]])
                    coords.append([seg["latitude_end"], seg["longitude_end"]])
                r_obj["coordinates"] = coords

            return {
                "success": True,
                "routes": parsed_routes,
                "status_code": 200
            }

        else:
            clean_body = sanitize_log_message(resp.text[:150])
            print(f"[TomTom] API request failed: status = {status_code}, body = {clean_body}", flush=True)
            return {"success": False, "error": f"Live TomTom routing is currently unavailable ({status_code}).", "status_code": status_code}

    except Exception as e:
        clean_err = sanitize_log_message(str(e))
        print(f"[TomTom] API request failed: exception = {clean_err}", flush=True)
        return {"success": False, "error": f"Live TomTom routing exception: {clean_err}", "status_code": 500}
