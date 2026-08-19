import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'smart_traffic.settings')
django.setup()

from rest_framework.test import APIRequestFactory
from routes.views import TestEmailView, SendOTPView
from django.conf import settings

factory = APIRequestFactory()
test_email_view = TestEmailView.as_view()
send_otp_view = SendOTPView.as_view()

target_email = settings.DEFAULT_FROM_EMAIL or settings.EMAIL_HOST_USER

print("\n========== 1. TESTING /api/test-email/ ENDPOINT ==========")
req1 = factory.post('/api/test-email/', data={"email": target_email}, format='json')
res1 = test_email_view(req1)
print("Response Status Code:", res1.status_code)
print("Response Data:", res1.data)

print("\n========== 2. TESTING /api/send-otp/ EMAIL DISPATCH ==========")
req2 = factory.post('/api/send-otp/', data={"email": target_email}, format='json')
res2 = send_otp_view(req2)
print("Response Status Code:", res2.status_code)
print("Response Data:", res2.data)
print("=============================================================\n")
