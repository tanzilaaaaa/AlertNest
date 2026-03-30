from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.database import get_db
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/users", tags=["users"])

class RoleUpdate(BaseModel):
    role: str

def _require_admin(current_user: dict):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admins only")

@router.get("")
async def list_users(current_user: dict = Depends(get_current_user)):
    _require_admin(current_user)
    db = get_db()
    docs = db.collection("users").get()
    return {
        "users": [
            {"id": d.id, **{k: v for k, v in d.to_dict().items() if k != "password"}}
            for d in docs
        ]
    }

@router.get("/{user_id}")
async def get_user(user_id: str, current_user: dict = Depends(get_current_user)):
    _require_admin(current_user)
    db = get_db()
    doc = db.collection("users").document(user_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="User not found")
    user = doc.to_dict()
    return {"user": {"id": doc.id, **{k: v for k, v in user.items() if k != "password"}}}

@router.put("/{user_id}/role")
async def update_role(user_id: str, data: RoleUpdate, current_user: dict = Depends(get_current_user)):
    _require_admin(current_user)
    if data.role not in ("student", "staff", "admin"):
        raise HTTPException(status_code=400, detail="Invalid role")
    db = get_db()
    ref = db.collection("users").document(user_id)
    if not ref.get().exists:
        raise HTTPException(status_code=404, detail="User not found")
    ref.update({"role": data.role})
    return {"message": "Role updated"}

@router.delete("/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(get_current_user)):
    _require_admin(current_user)
    if user_id == current_user["uid"]:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    db = get_db()
    db.collection("users").document(user_id).delete()
    return {"message": "User deleted"}
