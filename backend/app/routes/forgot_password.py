from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from firebase_admin import auth as firebase_auth

router = APIRouter(prefix="/api/auth", tags=["auth"])

class ForgotRequest(BaseModel):
    email: EmailStr

@router.post("/forgot-password")
async def forgot_password(body: ForgotRequest):
    """
    Generates a Firebase password reset link for the given email.
    In production, send this via your email provider.
    """
    try:
        link = firebase_auth.generate_password_reset_link(body.email)
        # TODO: send via email provider (SendGrid, SES, etc.)
        # For now, return the link directly (dev only)
        return {"message": "Password reset link generated.", "reset_link": link}
    except firebase_auth.UserNotFoundError:
        # Don't reveal whether email exists
        return {"message": "If that email exists, a reset link has been sent."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
