from fastapi import APIRouter, HTTPException, status
from ..schemas.user import (
    UserSignup, UserLogin, TokenResponse, UserResponse,
    VerifyOTPRequest, ResendOTPRequest, ForgotPasswordRequest,
    ResetPasswordRequest, MessageResponse
)
from ..models.user import User
from ..utils.security import hash_password, verify_password
from ..utils.jwt import create_access_token
from ..utils.pubsub import publish_admin_event
from ..services.email_service import generate_otp, send_otp_email
from ..config import get_settings
from datetime import datetime, timedelta

router = APIRouter()
settings = get_settings()


@router.post("/signup", response_model=MessageResponse)
async def signup(user_data: UserSignup):
    """
    Step 1: Create account with is_verified=False and send OTP email.
    The user must verify their email before they can log in.
    """
    # Check if user exists
    existing_user = await User.find_one(User.email == user_data.email)
    if existing_user:
        if not existing_user.is_verified:
            # Re-send OTP for unverified accounts
            otp = generate_otp()
            existing_user.otp_code = otp
            existing_user.otp_expires_at = datetime.utcnow() + timedelta(minutes=settings.otp_expiry_minutes)
            existing_user.hashed_password = hash_password(user_data.password)
            await existing_user.save()
            
            sent = send_otp_email(existing_user.email, otp, purpose="verify")
            if not sent:
                raise HTTPException(status_code=500, detail="Failed to send verification email. Check SMTP config.")
            
            return {"message": "Verification code sent to your email", "email": existing_user.email}
        
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Generate OTP
    otp = generate_otp()
    
    # Create new user (unverified)
    hashed_pwd = hash_password(user_data.password)
    user = User(
        email=user_data.email,
        hashed_password=hashed_pwd,
        plan="free_trial",
        trial_start=datetime.utcnow(),
        is_verified=False,
        otp_code=otp,
        otp_expires_at=datetime.utcnow() + timedelta(minutes=settings.otp_expiry_minutes)
    )
    await user.insert()
    
    # Send OTP email
    sent = send_otp_email(user.email, otp, purpose="verify")
    if not sent:
        raise HTTPException(status_code=500, detail="Failed to send verification email. Check SMTP config.")
    
    await publish_admin_event("user_signup", {
        "email": user.email,
        "plan": user.plan,
        "role": user.role
    })
    
    return {"message": "Verification code sent to your email", "email": user.email}


@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp(data: VerifyOTPRequest):
    """
    Step 2: Verify OTP code and activate the account.
    Returns JWT token on success.
    """
    user = await User.find_one(User.email == data.email)
    if not user:
        raise HTTPException(status_code=404, detail="Account not found")
    
    if user.is_verified:
        raise HTTPException(status_code=400, detail="Email is already verified")
    
    if not user.otp_code or not user.otp_expires_at:
        raise HTTPException(status_code=400, detail="No OTP was generated. Please request a new one.")
    
    if datetime.utcnow() > user.otp_expires_at:
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")
    
    if user.otp_code != data.otp_code:
        raise HTTPException(status_code=400, detail="Invalid OTP code")
    
    # Activate account
    user.is_verified = True
    user.otp_code = None
    user.otp_expires_at = None
    await user.save()
    
    # Generate JWT
    token = create_access_token(data={"sub": str(user.id), "email": user.email})
    
    user_response = UserResponse(
        id=str(user.id),
        email=user.email,
        plan=user.plan,
        role=user.role,
        analyses_count=user.analyses_count,
        created_at=user.created_at
    )
    
    return {"access_token": token, "token_type": "bearer", "user": user_response}


@router.post("/resend-otp", response_model=MessageResponse)
async def resend_otp(data: ResendOTPRequest):
    """
    Resend a new OTP code to the user's email.
    Invalidates any previous OTP.
    """
    user = await User.find_one(User.email == data.email)
    if not user:
        raise HTTPException(status_code=404, detail="Account not found")
    
    if user.is_verified:
        raise HTTPException(status_code=400, detail="Email is already verified")
    
    # Generate new OTP
    otp = generate_otp()
    user.otp_code = otp
    user.otp_expires_at = datetime.utcnow() + timedelta(minutes=settings.otp_expiry_minutes)
    await user.save()
    
    sent = send_otp_email(user.email, otp, purpose="verify")
    if not sent:
        raise HTTPException(status_code=500, detail="Failed to send email. Check SMTP config.")
    
    return {"message": "New verification code sent", "email": user.email}


@router.post("/login", response_model=TokenResponse)
async def login(user_data: UserLogin):
    """
    Login — blocks unverified accounts.
    """
    user = await User.find_one(User.email == user_data.email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.is_verified:
        # Re-send OTP automatically and tell the user
        otp = generate_otp()
        user.otp_code = otp
        user.otp_expires_at = datetime.utcnow() + timedelta(minutes=settings.otp_expiry_minutes)
        await user.save()
        send_otp_email(user.email, otp, purpose="verify")
        
        raise HTTPException(
            status_code=403,
            detail="Email not verified. A new verification code has been sent to your email."
        )
    
    token = create_access_token(data={"sub": str(user.id), "email": user.email})
    
    user_response = UserResponse(
        id=str(user.id),
        email=user.email,
        plan=user.plan,
        role=user.role,
        analyses_count=user.analyses_count,
        created_at=user.created_at
    )
    
    return {"access_token": token, "token_type": "bearer", "user": user_response}


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(data: ForgotPasswordRequest):
    """
    Send a password reset OTP to the user's email.
    """
    user = await User.find_one(User.email == data.email)
    if not user:
        raise HTTPException(status_code=404, detail="Email address not found")
    
    otp = generate_otp()
    user.otp_code = otp
    user.otp_expires_at = datetime.utcnow() + timedelta(minutes=settings.otp_expiry_minutes)
    await user.save()
    
    send_otp_email(user.email, otp, purpose="reset")
    
    return {"message": "If the email exists, a reset code has been sent", "email": data.email}


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(data: ResetPasswordRequest):
    """
    Verify OTP and set new password.
    """
    user = await User.find_one(User.email == data.email)
    if not user:
        raise HTTPException(status_code=404, detail="Account not found")
    
    if not user.otp_code or not user.otp_expires_at:
        raise HTTPException(status_code=400, detail="No reset code was requested")
    
    if datetime.utcnow() > user.otp_expires_at:
        raise HTTPException(status_code=400, detail="Reset code has expired. Please request a new one.")
    
    if user.otp_code != data.otp_code:
        raise HTTPException(status_code=400, detail="Invalid reset code")
    
    # Update password
    user.hashed_password = hash_password(data.new_password)
    user.otp_code = None
    user.otp_expires_at = None
    user.is_verified = True  # Also verify email if they weren't
    await user.save()
    
    return {"message": "Password reset successfully. You can now log in.", "email": user.email}
