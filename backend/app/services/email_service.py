import smtplib
import random
import string
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from ..config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def generate_otp(length: int = 6) -> str:
    """Generate a random numeric OTP code."""
    return ''.join(random.choices(string.digits, k=length))


def send_otp_email(to_email: str, otp_code: str, purpose: str = "verify") -> bool:
    """
    Send a styled HTML email with a 6-digit OTP via Gmail SMTP.
    
    Args:
        to_email: Recipient email address
        otp_code: The 6-digit OTP code
        purpose: 'verify' for email verification, 'reset' for password reset
    
    Returns:
        True if email was sent successfully, False otherwise
    """
    if not settings.smtp_user or not settings.smtp_password:
        logger.error("SMTP credentials not configured. Set SMTP_USER and SMTP_PASSWORD in .env")
        return False

    from_email = settings.smtp_from_email or settings.smtp_user
    
    if purpose == "reset":
        subject = "🔐 Dictator AI — Password Reset Code"
        heading = "Password Reset"
        message = "You requested a password reset. Use the code below to set a new password."
        warning = "If you did not request this, please ignore this email. Your password will remain unchanged."
    else:
        subject = "✉️ Dictator AI — Verify Your Email"
        heading = "Email Verification"
        message = "Welcome to Dictator AI! Please verify your email address using the code below."
        warning = "If you did not create an account, please ignore this email."

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: 'Segoe UI', Arial, sans-serif;">
        <div style="max-width: 520px; margin: 40px auto; background: linear-gradient(135deg, #12121a 0%, #1a1a2e 100%); border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #00d4ff, #3b82f6); padding: 32px 24px; text-align: center;">
                <h1 style="margin: 0; color: #000; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">
                    🛡️ Dictator AI
                </h1>
                <p style="margin: 8px 0 0; color: rgba(0,0,0,0.7); font-size: 14px;">
                    AI Content Authenticity Detector
                </p>
            </div>
            
            <!-- Body -->
            <div style="padding: 32px 24px;">
                <h2 style="margin: 0 0 12px; color: #ffffff; font-size: 20px; font-weight: 600;">
                    {heading}
                </h2>
                <p style="margin: 0 0 24px; color: #a0a0b0; font-size: 15px; line-height: 1.6;">
                    {message}
                </p>
                
                <!-- OTP Code -->
                <div style="background: rgba(0,212,255,0.08); border: 1px dashed rgba(0,212,255,0.3); border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 24px;">
                    <p style="margin: 0 0 8px; color: #a0a0b0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">
                        Your verification code
                    </p>
                    <div style="font-size: 36px; font-weight: 700; color: #00d4ff; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                        {otp_code}
                    </div>
                </div>
                
                <p style="margin: 0 0 8px; color: #a0a0b0; font-size: 13px;">
                    ⏱️ This code expires in <strong style="color: #ffffff;">{settings.otp_expiry_minutes} minutes</strong>.
                </p>
                <p style="margin: 0; color: #666; font-size: 12px; font-style: italic;">
                    {warning}
                </p>
            </div>
            
            <!-- Footer -->
            <div style="padding: 16px 24px; border-top: 1px solid rgba(255,255,255,0.05); text-align: center;">
                <p style="margin: 0; color: #555; font-size: 11px;">
                    © 2026 Dictator AI — AI Content Authenticity Detector
                </p>
            </div>
        </div>
    </body>
    </html>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"Dictator AI <{from_email}>"
    msg["To"] = to_email

    # Plain text fallback
    plain_text = f"{heading}\n\nYour verification code is: {otp_code}\n\nThis code expires in {settings.otp_expiry_minutes} minutes.\n\n{warning}"
    msg.attach(MIMEText(plain_text, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.starttls()
            server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(from_email, to_email, msg.as_string())
        
        logger.info(f"OTP email sent to {to_email} (purpose: {purpose})")
        return True
    except smtplib.SMTPAuthenticationError:
        logger.error("SMTP authentication failed. Check your Gmail App Password.")
        return False
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        return False
