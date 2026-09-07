import os
import sys
import json
import django

# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'smart_traffic.settings')
django.setup()

from rest_framework.test import APIRequestFactory
from routes.views import RouteView

factory = APIRequestFactory()
view = RouteView.as_view()

# Test Payload: Vijay Nagar to Palasia in Indore
payload = {
    "source": "22.7533,75.8937",
    "destination": "22.7244,75.8839",
    "travel_mode": "bike",
    "date_time": "2026-08-12T15:00:00.000Z"
}

print("========== TESTING ROUTEVIEW POST REQUEST ==========")
request = factory.post('/api/routes/', data=payload, format='json')
response = view(request)

print(f"Status Code: {response.status_code}")
if response.status_code == 200:
    res_dict = response.data
    routes_list = res_dict.get("routes", []) if isinstance(res_dict, dict) else res_dict
    print(f"Received {len(routes_list)} routes:")
    for idx, r in enumerate(routes_list):
        print(f"\n--- Route {idx + 1}: {r.get('route_name') or r.get('label')} ---")
        print(f"  Total Distance: {r.get('total_distance_km') or r.get('distance_km')} km")
        print(f"  Predicted Congestion: {r.get('predicted_congestion') or r.get('traffic_level')}")
        print(f"  Average Speed: {r.get('average_speed_kmh')} km/h")
        print(f"  Total Time: {r.get('total_time_min') or r.get('duration_minutes')} mins")
        print(f"  Recommended: {r.get('recommended')}")
        print(f"  Segments Count: {len(r.get('segments', []))}")
        print(f"  Vehicle Counts: {r.get('vehicle_counts')}")
else:
    print("Error Response:", response.data)

print("\n==================================================")
