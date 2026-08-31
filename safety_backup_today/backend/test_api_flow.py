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
    routes_data = response.data
    print(f"Received {len(routes_data)} routes:")
    for idx, r in enumerate(routes_data):
        print(f"\n--- Route {idx + 1}: {r['route_name']} ---")
        print(f"  Total Distance: {r['total_distance_km']} km")
        print(f"  Predicted Congestion: {r['predicted_congestion']}")
        print(f"  Average Speed: {r['average_speed_kmh']} km/h")
        print(f"  Total Time: {r['total_time_min']} mins")
        print(f"  Recommended: {r['recommended']}")
        print(f"  Segments Count: {len(r['segments'])}")
        print(f"  Vehicle Counts: {r['vehicle_counts']}")
else:
    print("Error Response:", response.data)

print("\n==================================================")
