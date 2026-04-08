from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])

class SyncData(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = "student"

@router.post("/sync")
async def sync_user(data: SyncData = SyncData(), current_user: dict = Depends(get_current_user)):
    db = get_db()
    uid = current_user["uid"]
    user_ref = db.collection("users").document(uid)
    doc = user_ref.get()

    # Determine provider from Firebase token
    # If 'firebase' key exists with 'sign_in_provider', use that
    # Otherwise default to 'email' (for email/password auth)
    provider = "email"  # default for email/password
    if "firebase" in current_user and "sign_in_provider" in current_user.get("firebase", {}):
        provider = current_user["firebase"]["sign_in_provider"]

    if not doc.exists:
        user_ref.set({
            "name": data.name or current_user.get("name", current_user.get("email", "")),
            "email": current_user.get("email", ""),
            "role": data.role or "student",
            "provider": provider
        })
    else:
        # Update name if provided and changed
        updates = {}
        existing = doc.to_dict()
        if data.name and data.name != existing.get("name"):
            updates["name"] = data.name
        if data.role and data.role != existing.get("role"):
            updates["role"] = data.role
        if updates:
            user_ref.update(updates)

    user = user_ref.get().to_dict()
    return {
        "user": {
            "id": uid,
            "name": user.get("name"),
            "email": user.get("email"),
            "role": user.get("role", "student")
        }
    }

@router.get("/me")
async def me(current_user: dict = Depends(get_current_user)):
    db = get_db()
    uid = current_user["uid"]
    doc = db.collection("users").document(uid).get()
    if not doc.exists:
        return {"user": {"id": uid, "email": current_user.get("email"), "role": "student"}}
    user = doc.to_dict()
    return {"user": {"id": uid, "name": user.get("name"), "email": user.get("email"), "role": user.get("role", "student")}}
