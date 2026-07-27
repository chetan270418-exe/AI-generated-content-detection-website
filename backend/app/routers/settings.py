from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from ..models.user import User
from ..utils.jwt import get_current_user

router = APIRouter()

class UserSettingsResponse(BaseModel):
    email: str
    username: Optional[str] = None
    email_alerts: bool
    push_notifications: bool
    two_factor: bool
    api_access: bool

class UserSettingsUpdate(BaseModel):
    username: Optional[str] = None
    email_alerts: Optional[bool] = None
    push_notifications: Optional[bool] = None
    two_factor: Optional[bool] = None
    api_access: Optional[bool] = None

@router.get("/", response_model=UserSettingsResponse)
async def get_settings(current_user: User = Depends(get_current_user)):
    return UserSettingsResponse(
        email=current_user.email,
        username=current_user.username or current_user.email.split('@')[0],
        email_alerts=current_user.email_alerts,
        push_notifications=current_user.push_notifications,
        two_factor=current_user.two_factor,
        api_access=current_user.api_access
    )

@router.put("/", response_model=UserSettingsResponse)
async def update_settings(data: UserSettingsUpdate, current_user: User = Depends(get_current_user)):
    if data.username is not None:
        current_user.username = data.username
    if data.email_alerts is not None:
        current_user.email_alerts = data.email_alerts
    if data.push_notifications is not None:
        current_user.push_notifications = data.push_notifications
    if data.two_factor is not None:
        current_user.two_factor = data.two_factor
    if data.api_access is not None:
        current_user.api_access = data.api_access

    await current_user.save()

    return UserSettingsResponse(
        email=current_user.email,
        username=current_user.username,
        email_alerts=current_user.email_alerts,
        push_notifications=current_user.push_notifications,
        two_factor=current_user.two_factor,
        api_access=current_user.api_access
    )
