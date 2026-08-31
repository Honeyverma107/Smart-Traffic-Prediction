import os
import sys
import json
from datetime import datetime

# Setup Django Environment
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, BASE_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'smart_traffic.settings')

import django
django.setup()

from rest_framework.test import APIRequestFactory
from routes.views import RouteView

def test_rajwada_to_vijay_nagar_right_time():
    print("==========================================================================")
    print("      DATA-DRIVEN RIGHT TIME TO GO TEST: RAJWADA -> VIJAY NAGAR, INDORE   ")
    print("==========================================================================\n")
    
    factory = APIRequestFactory()
    
    # Test payload for Rajwada -> Vijay Nagar
    # Rajwada: 22.7196, 75.8577
    # Vijay Nagar: 22.7533, 75.8937
    payload = {
        "source": "22.7196,75.8577",
        "destination": "22.7533,75.8937",
        "date_time": "2026-08-18T17:30:00",  # 5:30 PM Peak Hour test
        "travel_mode": "car"
    }
    
    request = factory.post('/api/routes/', payload, format='json')
    view = RouteView.as_view()
    
    response = view(request)
    print(f"HTTP Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.data
        routes_list = data if isinstance(data, list) else data.get('routes', [])
        print(f"Total Routes Returned: {len(routes_list)}\n")
        
        for idx, route in enumerate(routes_list):
            print(f"--- ROUTE {idx+1}: {route.get('route_name').upper()} ---")
            print(f"Distance: {route.get('total_distance_km')} km | Speed: {route.get('average_speed_kmh')} km/h | ETA: {route.get('total_time_min')} min")
            print(f"Current Traffic: {route.get('predicted_congestion')} | Traffic Source: {route.get('traffic_source')}")
            
            v_counts = route.get('vehicle_counts', {})
            print(f"Demo YOLO Vehicle Counts: Cars={v_counts.get('car_count')}, Bikes={v_counts.get('bike_count')}, Buses={v_counts.get('bus_count')}, Trucks={v_counts.get('truck_count')}")
            print(f"RECOMMENDED DEPARTURE TIME: {route.get('right_time_to_go')}")
            print(f"SAVING ESTIMATE: ~{route.get('estimated_saving_min')} min")
            print(f"REASON: {route.get('right_time_reason')}\n")
            
            print("CANDIDATE TIME EVALUATIONS:")
            for cand in route.get('candidate_evaluations', []):
                p_cnts = cand.get('projected_counts', {})
                print(f" - Candidate {cand.get('time_str'):8s} (+{cand.get('offset_min'):3d}m) | Congestion: {cand.get('congestion'):6s} | Score: {cand.get('traffic_score'):6.1f} | Projected Cars={p_cnts.get('car_count')}, Bikes={p_cnts.get('bike_count')}")
            print("-" * 74 + "\n")
    else:
        print("API Error Response:", response.data)

if __name__ == "__main__":
    test_rajwada_to_vijay_nagar_right_time()
