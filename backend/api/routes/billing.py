"""
Billing Routes - Subscription management and Stripe integration
"""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from database.connection import get_db
from database.models import User
from services.auth import get_current_user
from services.billing import BillingService
from services.schemas import (
    SubscriptionResponse,
    CheckoutSessionResponse,
    MessageResponse,
)
from config import settings

router = APIRouter()


@router.get("/subscription", response_model=SubscriptionResponse)
async def get_subscription(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> SubscriptionResponse:
    """Get current user's subscription details."""
    billing_service = BillingService(db)
    
    subscription = await billing_service.get_subscription(current_user.id)
    return subscription


@router.post("/checkout/pro", response_model=CheckoutSessionResponse)
async def create_pro_checkout(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> CheckoutSessionResponse:
    """Create Stripe checkout session for Pro subscription."""
    billing_service = BillingService(db)
    
    try:
        session = await billing_service.create_checkout_session(
            user_id=current_user.id,
            price_id=settings.STRIPE_PRICE_PRO,
            success_url="http://localhost:3000/billing/success",
            cancel_url="http://localhost:3000/billing/cancel"
        )
        return CheckoutSessionResponse(
            checkout_url=session.url,
            session_id=session.id
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create checkout session"
        )


@router.post("/cancel", response_model=MessageResponse)
async def cancel_subscription(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> MessageResponse:
    """Cancel current subscription."""
    billing_service = BillingService(db)
    
    success = await billing_service.cancel_subscription(current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active subscription to cancel"
        )
    
    return MessageResponse(message="Subscription cancelled successfully")


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Handle Stripe webhook events."""
    billing_service = BillingService(db)
    
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    try:
        await billing_service.handle_webhook(payload, sig_header)
        return {"status": "success"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid webhook payload"
        )
