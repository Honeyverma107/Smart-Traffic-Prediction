import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'smart_traffic.settings')
django.setup()

from django.core.mail import get_connection
from django.conf import settings
from routes.email_utils import send_transactional_otp_email, mask_email

def test_smtp():
    print("\n========== TESTING SMTP CONNECTION & TRANSACTIONAL OTP EMAIL ==========")
    print(f"EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
    print(f"EMAIL_HOST: {settings.EMAIL_HOST}:{settings.EMAIL_PORT} (TLS: {settings.EMAIL_USE_TLS})")
    print(f"DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
    print(f"EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
    
    # 1. Test SMTP Connection
    try:
        connection = get_connection()
        connection.open()
        print("SMTP Connection Status: SUCCESS (Connected to smtp.gmail.com:587)")
        connection.close()
    except Exception as e:
        raw_pwd = getattr(settings, 'EMAIL_HOST_PASSWORD', '')
        err_msg = str(e).replace(raw_pwd, "******") if raw_pwd else str(e)
        print(f"SMTP Connection Status: FAILED ({type(e).__name__}: {err_msg})")
        return False

    # 2. Test Transactional OTP Email Send
    recipient = settings.DEFAULT_FROM_EMAIL or settings.EMAIL_HOST_USER
    test_otp = "849204"
    success = send_transactional_otp_email(recipient, test_otp)
    if success:
        print(f"Email Send Status: SUCCESS (Transactional OTP email sent to {mask_email(recipient)})")
        print("============================================================\n")
        return True
    else:
        print(f"Email Send Status: FAILED for {mask_email(recipient)}")
        print("============================================================\n")
        return False

if __name__ == "__main__":
    test_smtp()
