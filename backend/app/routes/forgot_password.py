from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from app.database import get_db
from app.utils.auth import create_token, decode_token
from app.config import JWT_SECRET, JWT_ALGORITHM
from datetime import datetime, timedelta
from jose import jwt
import re

router = APIRouter(prefix="/api/auth", tags=["auth"])

class ForgotRequest(BaseModel):
    email: EmailStr

class ResetRequest(BaseModel):
    token: str
    new_password: str

@router.post("/forgot-password")
async def forgot_password(body: ForgotRequest):
    db = get_db()
    user = await db["users"].find_one({"email": body.email})
    # Always return success to avoid email enumeration
    if not user:
        return {"message": "If that email exists, a reset token has been sent."}

    # Create a short-lived reset token (15 min)
    payload = {
        "user_id": str(user["_id"]),
        "purpose": "reset",
        "exp": datetime.utcnow() + timedelta(minutes=15)
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

    # In production you'd email this. For now return it directly.
    return {
        "message": "Password reset token generated.",
        "reset_token": token  # Remove this in production, send via email instead
    }

@router.post("/reset-password")
async def reset_password(body: ResetRequest):
    from jose import JWTError
    try:
        payload = jwt.decode(body.token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    if payload.get("purpose") != "reset":
        raise HTTPException(status_code=400, detail="Invalid token purpose")

    from app.utils.auth import hash_password
    from bson import ObjectId
    db = get_db()
    await db["users"].update_one(
        {"_id": ObjectId(payload["user_id"])},
        {"$set": {"password": hash_password(body.new_password)}}
    )
    return {"message": "Password reset successfully"}
