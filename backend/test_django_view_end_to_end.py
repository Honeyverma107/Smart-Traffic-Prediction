import os
import sys
import json
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, '.env'), override=True)

if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "smart_traffic.settings")
django.setup()

from rest_framework.test import APIRequestFactory
from routes.views import RouteView

def test_route_view_direct():
    print("\n=======================================================")
    print("TESTING ROUTEVIEW POST API DIRECTLY VIA DRF APIRequestFactory")
    print("=======================================================\n")

    factory = APIRequestFactory()

    # Vijay Nagar -> Rajwada corridor in Indore
    payload = {
        "source": "22.7533,75.8937",
        "destination": "22.7196,75.8577",
        "travel_mode": "car"
    }

    request = factory.post("/api/routes/", payload, format="json")
    view = RouteView.as_view()

    response = view(request)

    print(f"HTTP Response Status Code: {response.status_code}")
    data = response.data

    assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}"
    assert data.get("success") is True, "Expected success: True"
    assert "routes" in data, "Expected routes array in response payload"
    assert len(data["routes"]) == 3, f"Expected 3 routes, got {len(data['routes'])}"

    for idx, r_obj in enumerate(data["routes"]):
        print(f"\n[Route {idx+1}: {r_obj['route_name']}]")
        print(f"  Distance: {r_obj['total_distance_km']} km | Time: {r_obj['total_time_min']} m")
        print(f"  Predicted ML Congestion: {r_obj['predicted_congestion']} (Score: {r_obj.get('traffic_score')})")
        print(f"  Vehicle Counts: {r_obj.get('vehicle_counts')}")
        print(f"  Camera Coverage: {r_obj.get('camera_coverage')}")
        print(f"  Right Time to Leave: {r_obj.get('right_time_to_leave', {}).get('recommended_departure_time')} (Current: {r_obj.get('right_time_to_leave', {}).get('current_traffic')})")
        print(f"  Segments Count: {len(r_obj.get('segments', []))}")

        # Verify segment data structure
        if r_obj.get("segments"):
            first_seg = r_obj["segments"][0]
            print(f"  First Segment Matched Road: {first_seg.get('road_name')} ({first_seg.get('road_id')}) | Matched: {first_seg.get('matched')} | Seg ML: {first_seg.get('congestion_level')}")
            assert "latitude_start" in first_seg, "Segment missing latitude_start"
            assert "longitude_start" in first_seg, "Segment missing longitude_start"
            assert "segment_observation" in first_seg, "Segment missing segment_observation"
            assert "segment_ml_prediction" in first_seg, "Segment missing segment_ml_prediction"

    print("\n=======================================================")
    print("ROUTE VIEW DIRECT API TEST COMPLETED SUCCESSFULLY!")
    print("=======================================================\n")

if __name__ == "__main__":
    test_route_view_direct()
