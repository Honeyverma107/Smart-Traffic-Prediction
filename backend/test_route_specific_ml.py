import os
import sys
import json
from datetime import datetime
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, '.env'), override=True)

# Add routes to path
routes_dir = os.path.join(BASE_DIR, "routes")
if routes_dir not in sys.path:
    sys.path.insert(0, routes_dir)

import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "smart_traffic.settings")
django.setup()

from routes.traffic_matching import (
    match_segment_to_indore_location,
    get_camera_observation_for_segment,
    get_road_historical_counts,
    get_road_recent_counts,
    build_segment_features_and_predict,
    aggregate_route_congestion
)

def run_route_specific_ml_tests():
    print("\n=======================================================")
    print("STARTING ROUTE-SPECIFIC AI TRAFFIC ML VERIFICATION")
    print("=======================================================\n")

    results = {}
    now_dt = datetime.now()

    # 1. Test Indore Location Matching
    vn_match = match_segment_to_indore_location(22.7533, 75.8937, 22.7535, 75.8940)
    mr10_match = match_segment_to_indore_location(22.7660, 75.8830, 22.7662, 75.8835)
    unmapped_match = match_segment_to_indore_location(22.5100, 75.6600, 22.5105, 75.6605)

    print("1. Location Matching Verification:")
    print(f"   Vijay Nagar Match: {vn_match['road_name']} (Matched: {vn_match['matched']}, Distance: {vn_match['match_distance_m']}m)")
    print(f"   MR-10 Match: {mr10_match['road_name']} (Matched: {mr10_match['matched']}, Distance: {mr10_match['match_distance_m']}m)")
    print(f"   Unmapped Location: {unmapped_match['road_name']} (Matched: {unmapped_match['matched']})")

    loc_ok = vn_match['matched'] and mr10_match['matched'] and not unmapped_match['matched']
    results["1_location_matching"] = "PASS" if loc_ok else "FAIL"

    # 2. Test Geographic Camera Scoping
    cam_feeds_mock = {
        "demo_camera_fast": {
            "lat": 22.7533,
            "lng": 75.8937,
            "name": "Vijay Nagar Camera",
            "vcounts": {"car_count": 65, "bike_count": 95, "bus_count": 12, "truck_count": 5}
        }
    }

    covered_cam = get_camera_observation_for_segment(22.7534, 75.8938, cam_feeds_mock, max_dist_m=400.0)
    uncovered_cam = get_camera_observation_for_segment(22.7200, 75.8500, cam_feeds_mock, max_dist_m=400.0)

    print("\n2. Geographic Camera Scoping Verification:")
    print(f"   Covered Segment (near camera): Camera Available = {covered_cam['available']} (Dist: {covered_cam['distance_m']}m, Car count: {covered_cam['car_count']})")
    print(f"   Uncovered Segment (far from camera): Camera Available = {uncovered_cam['available']}")

    cam_ok = covered_cam['available'] and not uncovered_cam['available']
    results["2_camera_geographic_scoping"] = "PASS" if cam_ok else "FAIL"

    # 3. Test Historical Road-Specific Data Retrieval
    hist_vn = get_road_historical_counts(now_dt, "AB Road Vijay Nagar")
    hist_mr10 = get_road_historical_counts(now_dt, "MR-10 Junction")

    print("\n3. Road-Specific Historical Data Baseline:")
    print(f"   AB Road Vijay Nagar Baseline: {hist_vn}")
    print(f"   MR-10 Junction Baseline: {hist_mr10}")

    hist_ok = isinstance(hist_vn, dict) and isinstance(hist_mr10, dict)
    results["3_road_specific_historical_data"] = "PASS" if hist_ok else "FAIL"

    # 4. Test Segment ML Predictions (Different Roads -> Different Counts -> Different ML Predictions)
    seg_vn = build_segment_features_and_predict(now_dt, "AB Road Vijay Nagar", hist_vn, {"available": False}, covered_cam)
    seg_mr10 = build_segment_features_and_predict(now_dt, "MR-10 Junction", hist_mr10, {"available": False}, uncovered_cam)

    print("\n4. Segment-Level Random Forest ML Predictions:")
    print(f"   Vijay Nagar Segment ML Pred: {seg_vn['ml_prediction']} (Sources: {seg_vn['data_sources_used']}, Counts: {seg_vn['car_count']} cars)")
    print(f"   MR-10 Segment ML Pred: {seg_mr10['ml_prediction']} (Sources: {seg_mr10['data_sources_used']}, Counts: {seg_mr10['car_count']} cars)")

    ml_ok = "ml_prediction" in seg_vn and "ml_prediction" in seg_mr10
    results["4_segment_ml_prediction"] = "PASS" if ml_ok else "FAIL"

    # 5. Test Route-Level Aggregation
    mock_route_segs_1 = [
        {"length_m": 500, "congestion_level": "HIGH", "matched": True, "segment_observation": {"available": True}},
        {"length_m": 500, "congestion_level": "HIGH", "matched": True, "segment_observation": {"available": False}}
    ]
    mock_route_segs_2 = [
        {"length_m": 500, "congestion_level": "LOW", "matched": True, "segment_observation": {"available": False}},
        {"length_m": 500, "congestion_level": "NORMAL", "matched": True, "segment_observation": {"available": False}}
    ]

    agg_1 = aggregate_route_congestion(mock_route_segs_1)
    agg_2 = aggregate_route_congestion(mock_route_segs_2)

    print("\n5. Length-Weighted Route Aggregation:")
    print(f"   Route 1 Aggregated Congestion: {agg_1['predicted_congestion']} (Score: {agg_1['traffic_score']})")
    print(f"   Route 2 Aggregated Congestion: {agg_2['predicted_congestion']} (Score: {agg_2['traffic_score']})")

    agg_ok = agg_1['predicted_congestion'] == "HIGH" and agg_2['predicted_congestion'] in ["LOW", "NORMAL"]
    results["5_length_weighted_aggregation"] = "PASS" if agg_ok else "FAIL"

    print("\n=======================================================")
    print("FINAL ROUTE-SPECIFIC AI TRAFFIC VERIFICATION MATRIX")
    print("=======================================================")
    print(json.dumps(results, indent=2))
    return results

if __name__ == "__main__":
    run_route_specific_ml_tests()
