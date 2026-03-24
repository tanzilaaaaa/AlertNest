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

    if not doc.exists:
        user_ref.set({
            "name": data.name or current_user.get("name", current_user.get("email", "")),
            "email": current_user.get("email", ""),
            "role": data.role or "student",
            "provider": current_user.get("firebase", {}).get("sign_in_provider", "password")
        })

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
