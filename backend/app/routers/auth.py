from fastapi import APIRouter, HTTPException, status
from ..schemas.user import UserSignup, UserLogin, TokenResponse, UserResponse
from ..models.user import User
from ..utils.security import hash_password, verify_password
from ..utils.jwt import create_access_token
from datetime import datetime

router = APIRouter()

@router.post("/signup", response_model=TokenResponse)
async def signup(user_data: UserSignup):
    # Check if user exists
    existing_user = await User.find_one(User.email == user_data.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    # Create new user
    hashed_pwd = hash_password(user_data.password)
    user = User(
        email=user_data.email,
        hashed_password=hashed_pwd,
        plan="free_trial",
        trial_start=datetime.utcnow()
    )
    await user.insert()
    
    # Generate token
    token = create_access_token(data={"sub": str(user.id), "email": user.email})
    
    user_response = UserResponse(
        id=str(user.id),
        email=user.email,
        plan=user.plan,
        analyses_count=user.analyses_count,
        created_at=user.created_at
    )
    
    return {"access_token": token, "token_type": "bearer", "user": user_response}

@router.post("/login", response_model=TokenResponse)
async def login(user_data: UserLogin):
    user = await User.find_one(User.email == user_data.email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    if not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    token = create_access_token(data={"sub": str(user.id), "email": user.email})
    
    user_response = UserResponse(
        id=str(user.id),
        email=user.email,
        plan=user.plan,
        analyses_count=user.analyses_count,
        created_at=user.created_at
    )
    
    return {"access_token": token, "token_type": "bearer", "user": user_response}
