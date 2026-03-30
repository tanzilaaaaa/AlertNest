import bcrypt
from firebase_admin import auth as firebase_auth
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

bearer_scheme = HTTPBearer()

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    token = credentials.credentials
    try:
        decoded = firebase_auth.verify_id_token(token)
        # Fetch role from Firestore
        from app.database import get_db
        db = get_db()
        user_doc = db.collection("users").document(decoded["uid"]).get()
        if user_doc.exists:
            decoded["role"] = user_doc.to_dict().get("role", "student")
        else:
            decoded["role"] = "student"
        return decoded
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
