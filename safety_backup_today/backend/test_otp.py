import os
import sys
import json
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'smart_traffic.settings')
django.setup()

from rest_framework.test import APIRequestFactory
from routes.views import SendOTPView, VerifyOTPView
from routes.models import OTP

factory = APIRequestFactory()
send_view = SendOTPView.as_view()
verify_view = VerifyOTPView.as_view()

test_email = "citizen.test@indore.gov.in"

print("========== 1. TESTING SEND OTP ==========")
req1 = factory.post('/api/send-otp/', data={"email": test_email}, format='json')
res1 = send_view(req1)
print("Send OTP Response Status:", res1.status_code)
print("Send OTP Response Data:", res1.data)

latest_otp_obj = OTP.objects.filter(email=test_email).latest("created_at")
generated_code = latest_otp_obj.code
print(f"OTP saved in DB for {test_email}: {generated_code}")

print("\n========== 2. TESTING VERIFY OTP ==========")
req2 = factory.post('/api/verify-otp/', data={"email": test_email, "otp": generated_code}, format='json')
res2 = verify_view(req2)
print("Verify OTP Response Status:", res2.status_code)
print("Verify OTP Response Data:", res2.data)
