"""
User Management Routes
"""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from database.connection import get_db
from database.models import User
from services.auth import get_current_user, AuthService
from services.schemas import UserResponse, UserUpdate, MessageResponse

router = APIRouter()


@router.get("/profile", response_model=UserResponse)
async def get_profile(
    current_user: Annotated[User, Depends(get_current_user)]
) -> UserResponse:
    """Get current user profile."""
    return UserResponse.model_validate(current_user)


@router.patch("/profile", response_model=UserResponse)
async def update_profile(
    user_data: UserUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
) -> UserResponse:
    """Update current user profile."""
    auth_service = AuthService(db)
    
    updated_user = await auth_service.update_user(current_user.id, user_data)
    return UserResponse.model_validate(updated_user)


@router.delete("/account", response_model=MessageResponse)
async def delete_account(
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
) -> MessageResponse:
    """Delete current user account."""
    auth_service = AuthService(db)
    
    await auth_service.delete_user(current_user.id)
    return MessageResponse(message="Account deleted successfully")
