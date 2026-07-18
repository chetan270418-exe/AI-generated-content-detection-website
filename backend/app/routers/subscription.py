from fastapi import APIRouter, Depends, HTTPException, Request
from ..models.user import User
from ..models.subscription import Subscription
from ..utils.jwt import get_current_user
from ..config import get_settings
from datetime import datetime, timedelta
import razorpay

router = APIRouter()
settings = get_settings()

if settings.razorpay_key_id and settings.razorpay_key_secret:
    razorpay_client = razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))
else:
    razorpay_client = None

@router.get("/status")
async def get_subscription_status(current_user: User = Depends(get_current_user)):
    # Get active subscription
    sub = await Subscription.find_one({"user_id": str(current_user.id), "status": "active"})
    return {
        "plan": current_user.plan,
        "analyses_count": current_user.analyses_count,
        "active_subscription": sub is not None,
        "expires_at": sub.expires_at if sub else None
    }

@router.post("/create-order")
async def create_order(current_user: User = Depends(get_current_user)):
    if not razorpay_client:
        raise HTTPException(status_code=500, detail="Razorpay not configured")
        
    amount = 999 * 100 # Rs 999
    
    data = {
        "amount": amount,
        "currency": "INR",
        "receipt": f"receipt_{current_user.id}"
    }
    
    try:
        order = razorpay_client.order.create(data=data)
        
        # Save pending subscription order
        sub = Subscription(
            user_id=str(current_user.id),
            status="pending",
            amount=999,
            razorpay_order_id=order["id"]
        )
        await sub.insert()
        
        return {"order_id": order["id"], "amount": amount, "currency": "INR", "key_id": settings.razorpay_key_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create order: {str(e)}")

@router.post("/verify-payment")
async def verify_payment(request: Request, current_user: User = Depends(get_current_user)):
    if not razorpay_client:
        raise HTTPException(status_code=500, detail="Razorpay not configured")
        
    body = await request.json()
    order_id = body.get("razorpay_order_id")
    payment_id = body.get("razorpay_payment_id")
    signature = body.get("razorpay_signature")
    
    try:
        razorpay_client.utility.verify_payment_signature({
            'razorpay_order_id': order_id,
            'razorpay_payment_id': payment_id,
            'razorpay_signature': signature
        })
        
        # Update subscription
        sub = await Subscription.find_one({"razorpay_order_id": order_id})
        if not sub:
            raise HTTPException(status_code=404, detail="Order not found")
            
        sub.status = "active"
        sub.razorpay_payment_id = payment_id
        sub.razorpay_signature = signature
        sub.expires_at = datetime.utcnow() + timedelta(days=30)
        await sub.save()
        
        # Update user plan
        current_user.plan = "vip"
        await current_user.save()
        
        return {"status": "success", "message": "Payment verified successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Payment verification failed: {str(e)}")
