from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
from app.database import get_db
from app.utils.auth import create_token

router = APIRouter(prefix="/api/auth", tags=["auth"])

class GoogleAccessToken(BaseModel):
    access_token: str

@router.post("/google")
async def google_login(body: GoogleAccessToken):
    # Verify token and get user info from Google
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {body.access_token}"}
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    info = resp.json()
    email = info.get("email")
    name = info.get("name", email)

    if not email:
        raise HTTPException(status_code=400, detail="Could not get email from Google")

    db = get_db()
    user = await db["users"].find_one({"email": email})

    if not user:
        result = await db["users"].insert_one({
            "name": name,
            "email": email,
            "password": None,
            "role": "student",
            "provider": "google"
        })
        user_id = str(result.inserted_id)
        role = "student"
    else:
        user_id = str(user["_id"])
        role = user["role"]

    token = create_token({"user_id": user_id, "role": role})
    return {
        "token": token,
        "user": {"id": user_id, "name": name, "email": email, "role": role}
    }
