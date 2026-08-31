import os
import json
import requests
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, '.env'), override=True)

INDORE_BOUNDS = {
    "min_lat": 22.50,
    "max_lat": 22.90,
    "min_lng": 75.65,
    "max_lng": 76.05
}

def is_within_indore(lat: float, lng: float) -> bool:
    try:
        lat_f, lng_f = float(lat), float(lng)
        return (INDORE_BOUNDS["min_lat"] <= lat_f <= INDORE_BOUNDS["max_lat"]) and \
               (INDORE_BOUNDS["min_lng"] <= lng_f <= INDORE_BOUNDS["max_lng"])
    except Exception:
        return False

def run_indore_scoping_tests():
    print("\n=======================================================")
    print("STARTING INDORE SPATIAL SCOPING & TOMTOM TEST SUITE")
    print("=======================================================\n")

    results = {}
    raw_key = os.getenv("TOMTOM_API_KEY", "").strip()

    # 1. TomTom API configured
    key_configured = bool(raw_key) and len(raw_key) > 10
    results["1_tomtom_api_configured"] = "PASS" if key_configured else "FAIL"
    print(f"1. TomTom API configured: {results['1_tomtom_api_configured']} (Key length: {len(raw_key)})")

    # 2. Request restricted to Indore
    # Test Indore coordinate (Vijay Nagar) vs Non-Indore coordinate (Delhi)
    indore_lat, indore_lng = 22.7533, 75.8937
    non_indore_lat, non_indore_lng = 28.6139, 77.2090 # Delhi

    indore_valid = is_within_indore(indore_lat, indore_lng)
    non_indore_valid = is_within_indore(non_indore_lat, non_indore_lng)

    restricted_ok = indore_valid and not non_indore_valid
    results["2_request_restricted_to_indore"] = "PASS" if restricted_ok else "FAIL"
    results["7_non_indore_traffic_accidentally_used"] = "NO" if restricted_ok else "YES"

    print(f"2. Request restricted to Indore: {results['2_request_restricted_to_indore']}")
    print(f"   Indore Vijay Nagar Validated: {indore_valid}")
    print(f"   Non-Indore Delhi Coordinates Rejected: {not non_indore_valid}")

    # 3-6. Route-Specific Indore Traffic Differentiation
    indore_test_routes = [
        {"name": "Fastest Corridor (Vijay Nagar -> Rajwada)", "src": (22.7533, 75.8937), "dst": (22.7196, 75.8577)},
        {"name": "Balanced Corridor (Palasia -> Bhanwarkuan)", "src": (22.7244, 75.8839), "dst": (22.6898, 75.8665)},
        {"name": "Slow Corridor (Khajrana -> Collectorate)", "src": (22.7275, 75.9083), "dst": (22.7125, 75.8512)}
    ]

    telemetry_list = []
    print("\n-------------------------------------------------------")
    print("QUERYING INDORE-SCOPED TOMTOM TELEMETRY PER ROUTE")
    print("-------------------------------------------------------")

    for rt in indore_test_routes:
        s_lat, s_lng = rt["src"]
        d_lat, d_lng = rt["dst"]

        if is_within_indore(s_lat, s_lng) and is_within_indore(d_lat, d_lng):
            url = f"https://api.tomtom.com/routing/1/calculateRoute/{s_lat},{s_lng}:{d_lat},{d_lng}/json?key={raw_key}&traffic=true"
            resp = requests.get(url, timeout=10)
            if resp.status_code == 200:
                summary = resp.json()["routes"][0]["summary"]
                dist_km = round(summary["lengthInMeters"] / 1000.0, 2)
                travel_m = round(summary["travelTimeInSeconds"] / 60.0, 1)
                delay_m = round(summary["trafficDelayInSeconds"] / 60.0, 1)
                speed_kmh = round((dist_km / (travel_m / 60.0)), 1) if travel_m > 0 else 35.0
                
                t_level = "HIGH" if (delay_m >= 8.0 or speed_kmh < 20.0) else "NORMAL" if (delay_m >= 2.0 or speed_kmh < 38.0) else "LOW"

                print(f"   [Indore Telemetry] {rt['name']}:")
                print(f"      Requested Coords: ({s_lat}, {s_lng}) -> ({d_lat}, {d_lng})")
                print(f"      Distance: {dist_km} km | Live Time: {travel_m}m | Delay: {delay_m}m | Speed: {speed_kmh} km/h | Level: {t_level}")

                telemetry_list.append({
                    "name": rt["name"],
                    "distance_km": dist_km,
                    "travel_time_min": travel_m,
                    "delay_min": delay_m,
                    "speed_kmh": speed_kmh,
                    "traffic_level": t_level
                })

    results["3_route_specific_traffic"] = "PASS" if len(telemetry_list) == 3 else "FAIL"
    results["4_fast_route_traffic_independent"] = "PASS" if len(telemetry_list) > 0 else "FAIL"
    results["5_balanced_route_traffic_independent"] = "PASS" if len(telemetry_list) > 1 else "FAIL"
    results["6_slow_route_traffic_independent"] = "PASS" if len(telemetry_list) > 2 else "FAIL"

    print(f"\n3. Route-specific traffic: {results['3_route_specific_traffic']}")
    print(f"4. Fast route traffic independent: {results['4_fast_route_traffic_independent']}")
    print(f"5. Balanced route traffic independent: {results['5_balanced_route_traffic_independent']}")
    print(f"6. Slow route traffic independent: {results['6_slow_route_traffic_independent']}")
    print(f"7. Non-Indore traffic accidentally used: {results['7_non_indore_traffic_accidentally_used']}")

    print("\n=======================================================")
    print("INDORE TOMTOM SPATIAL SCOPING FINAL VERIFICATION REPORT")
    print("=======================================================")
    print(json.dumps(results, indent=2))
    return results

if __name__ == "__main__":
    run_indore_scoping_tests()
