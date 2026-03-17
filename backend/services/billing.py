"""
Billing Service - Subscription management and Stripe integration
"""
import uuid
from datetime import datetime
from typing import Optional

import stripe
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database.models import User, Subscription, SubscriptionTier
from services.schemas import SubscriptionResponse

# Configure Stripe
if settings.STRIPE_SECRET_KEY:
    stripe.api_key = settings.STRIPE_SECRET_KEY


class BillingService:
    """Service for billing and subscription management."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_subscription(self, user_id: uuid.UUID) -> SubscriptionResponse:
        """Get user subscription details."""
        result = await self.db.execute(
            select(Subscription).where(Subscription.user_id == user_id)
        )
        subscription = result.scalar_one_or_none()
        
        if not subscription:
            # Create default free subscription
            subscription = Subscription(
                user_id=user_id,
                tier=SubscriptionTier.FREE,
                training_jobs_limit=5,
            )
            self.db.add(subscription)
            await self.db.commit()
            await self.db.refresh(subscription)
        
        is_unlimited = subscription.tier == SubscriptionTier.PRO
        
        return SubscriptionResponse(
            tier=subscription.tier.value,
            training_jobs_used=subscription.training_jobs_used,
            training_jobs_limit=subscription.training_jobs_limit,
            is_unlimited=is_unlimited,
            current_period_end=subscription.current_period_end,
        )
    
    async def can_train_model(self, user_id: uuid.UUID) -> bool:
        """Check if user can train a model."""
        subscription = await self.get_subscription(user_id)
        
        if subscription.is_unlimited:
            return True
        
        return subscription.training_jobs_used < subscription.training_jobs_limit
    
    async def increment_training_count(self, user_id: uuid.UUID):
        """Increment training job counter."""
        result = await self.db.execute(
            select(Subscription).where(Subscription.user_id == user_id)
        )
        subscription = result.scalar_one_or_none()
        
        if subscription:
            subscription.training_jobs_used += 1
            await self.db.commit()
    
    async def create_checkout_session(
        self,
        user_id: uuid.UUID,
        price_id: str,
        success_url: str,
        cancel_url: str
    ):
        """Create Stripe checkout session for subscription."""
        if not settings.STRIPE_SECRET_KEY:
            raise ValueError("Stripe is not configured")
        
        # Get or create Stripe customer
        result = await self.db.execute(
            select(Subscription).where(Subscription.user_id == user_id)
        )
        subscription = result.scalar_one_or_none()
        
        user_result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        user = user_result.scalar_one()
        
        if subscription and subscription.stripe_customer_id:
            customer_id = subscription.stripe_customer_id
        else:
            # Create new Stripe customer
            customer = stripe.Customer.create(
                email=user.email,
                metadata={"user_id": str(user_id)},
            )
            customer_id = customer.id
            
            if subscription:
                subscription.stripe_customer_id = customer_id
                await self.db.commit()
        
        # Create checkout session
        session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=["card"],
            line_items=[{"price": price_id, "quantity": 1}],
            mode="subscription",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={"user_id": str(user_id)},
        )
        
        return session
    
    async def cancel_subscription(self, user_id: uuid.UUID) -> bool:
        """Cancel user's subscription."""
        result = await self.db.execute(
            select(Subscription).where(Subscription.user_id == user_id)
        )
        subscription = result.scalar_one_or_none()
        
        if not subscription or not subscription.stripe_subscription_id:
            return False
        
        if settings.STRIPE_SECRET_KEY:
            # Cancel in Stripe
            stripe.Subscription.modify(
                subscription.stripe_subscription_id,
                cancel_at_period_end=True,
            )
        
        return True
    
    async def handle_webhook(self, payload: bytes, sig_header: str):
        """Handle Stripe webhook events."""
        if not settings.STRIPE_WEBHOOK_SECRET:
            raise ValueError("Webhook secret not configured")
        
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
        
        if event["type"] == "checkout.session.completed":
            session = event["data"]["object"]
            await self._handle_checkout_complete(session)
        
        elif event["type"] == "customer.subscription.updated":
            subscription = event["data"]["object"]
            await self._handle_subscription_updated(subscription)
        
        elif event["type"] == "customer.subscription.deleted":
            subscription = event["data"]["object"]
            await self._handle_subscription_deleted(subscription)
    
    async def _handle_checkout_complete(self, session: dict):
        """Handle successful checkout."""
        user_id = session.get("metadata", {}).get("user_id")
        if not user_id:
            return
        
        result = await self.db.execute(
            select(Subscription).where(Subscription.user_id == uuid.UUID(user_id))
        )
        subscription = result.scalar_one_or_none()
        
        if subscription:
            subscription.tier = SubscriptionTier.PRO
            subscription.stripe_subscription_id = session.get("subscription")
            subscription.training_jobs_limit = 999999  # Unlimited
            await self.db.commit()
    
    async def _handle_subscription_updated(self, stripe_sub: dict):
        """Handle subscription update."""
        result = await self.db.execute(
            select(Subscription).where(
                Subscription.stripe_subscription_id == stripe_sub["id"]
            )
        )
        subscription = result.scalar_one_or_none()
        
        if subscription:
            subscription.current_period_start = datetime.fromtimestamp(
                stripe_sub["current_period_start"]
            )
            subscription.current_period_end = datetime.fromtimestamp(
                stripe_sub["current_period_end"]
            )
            await self.db.commit()
    
    async def _handle_subscription_deleted(self, stripe_sub: dict):
        """Handle subscription cancellation."""
        result = await self.db.execute(
            select(Subscription).where(
                Subscription.stripe_subscription_id == stripe_sub["id"]
            )
        )
        subscription = result.scalar_one_or_none()
        
        if subscription:
            subscription.tier = SubscriptionTier.FREE
            subscription.stripe_subscription_id = None
            subscription.training_jobs_limit = 5
            subscription.training_jobs_used = 0
            await self.db.commit()
