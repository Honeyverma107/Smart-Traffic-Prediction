import os
import logging
from django.core.mail import EmailMultiAlternatives
from django.conf import settings

logger = logging.getLogger(__name__)

def mask_email(email_str):
    if not email_str or '@' not in email_str:
        return '***'
    user_part, domain_part = email_str.split('@', 1)
    if len(user_part) <= 2:
        masked_user = user_part[0] + '*'
    else:
        masked_user = user_part[0] + '*' * (len(user_part) - 2) + user_part[-1]
    return f"{masked_user}@{domain_part}"

def send_transactional_otp_email(recipient_email, otp_code):
    """
    Sends a professional transactional OTP verification email using Django's EmailMultiAlternatives.
    Includes both plain text and clean HTML versions.
    Does NOT log the OTP code or expose credentials.
    """
    masked_recipient = mask_email(recipient_email)
    raw_from = getattr(settings, 'DEFAULT_FROM_EMAIL', None) or getattr(settings, 'EMAIL_HOST_USER', '')
    
    # Format professional sender header
    if '<' not in raw_from:
        from_email = f"Smart Traffic Management <{raw_from}>"
    else:
        from_email = raw_from

    subject = "Smart Traffic Management - Verification Code"

    # Plain text version (RFC compliant transactional fallback)
    text_content = (
        "Smart Traffic Management Verification Code\n\n"
        f"Your verification code is: {otp_code}\n\n"
        "This code will expire in 5 minutes.\n\n"
        "If you did not request this verification code, please ignore this email. No further action is required.\n\n"
        "This is an automated operational message from Smart Traffic Management System. Please do not reply directly to this email."
    )

    # Clean, professional transactional HTML email
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Code</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f6f8; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f4f6f8; padding:30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:480px; background-color:#ffffff; border-radius:12px; border:1px solid #e5e7eb; padding:32px 24px; box-shadow:0 4px 12px rgba(0,0,0,0.05);">
          <!-- Brand Header -->
          <tr>
            <td align="center" style="padding-bottom:20px; border-bottom:1px solid #f3f4f6;">
              <h1 style="margin:0; font-size:20px; font-weight:700; color:#111827; letter-spacing:-0.3px;">
                🚦 Smart Traffic Management
              </h1>
            </td>
          </tr>
          <!-- Body Message -->
          <tr>
            <td style="padding-top:24px; padding-bottom:16px; color:#374151; font-size:15px; line-height:1.5;">
              <p style="margin:0 0 12px 0; font-weight:600; color:#111827; font-size:16px;">
                Login Verification Code
              </p>
              <p style="margin:0 0 20px 0; color:#4b5563;">
                Please use the verification code below to complete your login.
              </p>
            </td>
          </tr>
          <!-- OTP Display Card -->
          <tr>
            <td align="center" style="padding:16px 0;">
              <div style="background-color:#f8fafc; border:1px solid #cbd5e1; border-radius:8px; padding:16px 28px; display:inline-block;">
                <span style="font-size:32px; font-weight:700; letter-spacing:10px; color:#0f172a; font-family:'Courier New', Courier, monospace;">
                  {otp_code}
                </span>
              </div>
            </td>
          </tr>
          <!-- Expiration & Security Disclaimer -->
          <tr>
            <td style="padding-top:16px; padding-bottom:24px; color:#6b7280; font-size:13px; line-height:1.5;">
              <p style="margin:0 0 8px 0; color:#4b5563; font-weight:500;">
                ⏱️ This code will expire in <strong>5 minutes</strong>.
              </p>
              <p style="margin:0; color:#9ca3af;">
                If you did not request this verification code, you can safely ignore this email. No changes have been made to your account.
              </p>
            </td>
          </tr>
          <!-- Automated Footer -->
          <tr>
            <td align="center" style="border-top:1px solid #f3f4f6; padding-top:20px; color:#9ca3af; font-size:12px;">
              <p style="margin:0;">
                Smart Traffic Management System &bull; Operational Alert Service
              </p>
              <p style="margin:4px 0 0 0; font-size:11px;">
                This is an automated system notification. Please do not reply.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

    try:
        masked_sender = mask_email(raw_from)
        print(f"[OTP EMAIL] Sending verification email from '{masked_sender}' to '{masked_recipient}'...", flush=True)
        
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email,
            to=[recipient_email]
        )
        msg.attach_alternative(html_content, "text/html")
        
        # Transactional Headers
        msg.extra_headers['Auto-Submitted'] = 'auto-generated'
        msg.extra_headers['X-Auto-Response-Suppress'] = 'All'

        sent_count = msg.send(fail_silently=False)
        if sent_count == 1:
            print(f"[OTP EMAIL] Verification email successfully delivered via SMTP to '{masked_recipient}'.", flush=True)
            return True
        else:
            print(f"[OTP EMAIL ERROR] Send returned {sent_count} for '{masked_recipient}'.", flush=True)
            return False
    except Exception as e:
        raw_pwd = getattr(settings, 'EMAIL_HOST_PASSWORD', '')
        err_msg = str(e).replace(raw_pwd, '******') if raw_pwd else str(e)
        print(f"[OTP EMAIL ERROR] Failed to send email to '{masked_recipient}': {type(e).__name__}: {err_msg}", flush=True)
        return False
