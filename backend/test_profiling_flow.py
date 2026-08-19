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

payload = {
    "source": "22.7533,75.8937",
    "destination": "22.7244,75.8839",
    "travel_mode": "bike",
    "date_time": "2026-08-12T15:00:00.000Z"
}

print("\n==================================================", flush=True)
print(">>> FIRST ROUTE API REQUEST (Initial Load & Cache)", flush=True)
print("==================================================", flush=True)
request1 = factory.post('/api/routes/', data=payload, format='json')
response1 = view(request1)

print("\n==================================================", flush=True)
print(">>> SECOND ROUTE API REQUEST (Reusing Memory Cache)", flush=True)
print("==================================================", flush=True)
request2 = factory.post('/api/routes/', data=payload, format='json')
response2 = view(request2)

print("\n==================================================", flush=True)
print(f"Request 1 Status: {response1.status_code}, Routes returned: {len(response1.data)}")
print(f"Request 2 Status: {response2.status_code}, Routes returned: {len(response2.data)}")
print("==================================================", flush=True)
