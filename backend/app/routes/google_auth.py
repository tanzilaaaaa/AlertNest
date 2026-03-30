from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.database import get_db

router = APIRouter(prefix="/api/auth", tags=["auth"])

class GoogleSyncData(BaseModel):
    uid: str
    email: str
    name: str | None = None
    role: str = "student"

@router.post("/google-sync")
async def google_sync(body: GoogleSyncData):
    """
    Called after Firebase Google sign-in on the frontend.
    Creates the user doc in Firestore if it doesn't exist.
    """
    db = get_db()
    user_ref = db.collection("users").document(body.uid)
    doc = user_ref.get()

    if not doc.exists:
        user_ref.set({
            "name": body.name or body.email,
            "email": body.email,
            "role": body.role,
            "provider": "google"
        })

    user = user_ref.get().to_dict()
    return {
        "user": {
            "id": body.uid,
            "name": user.get("name"),
            "email": user.get("email"),
            "role": user.get("role", "student")
        }
    }
