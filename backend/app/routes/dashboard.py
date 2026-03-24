from fastapi import APIRouter, Depends
from app.database import get_db
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/summary")
async def get_summary(current_user: dict = Depends(get_current_user)):
    db = get_db()
    total = await db["incidents"].count_documents({})
    reported = await db["incidents"].count_documents({"status": "reported"})
    in_progress = await db["incidents"].count_documents({"status": "in_progress"})
    resolved = await db["incidents"].count_documents({"status": "resolved"})
    high = await db["incidents"].count_documents({"severity": "high"})
    medium = await db["incidents"].count_documents({"severity": "medium"})
    low = await db["incidents"].count_documents({"severity": "low"})
    return {
        "total": total,
        "reported": reported,
        "in_progress": in_progress,
        "resolved": resolved,
        "high": high,
        "medium": medium,
        "low": low,
        "resolution_rate": round((resolved / total * 100) if total > 0 else 0)
    }

@router.get("/recent")
async def get_recent(current_user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db["incidents"].find().sort("_id", -1).limit(5)
    incidents = []
    async for i in cursor:
        incidents.append({
            "id": str(i["_id"]),
            "title": i["title"],
            "category": i["category"],
            "severity": i["severity"],
            "status": i["status"],
            "location": i.get("location", ""),
        })
    return {"incidents": incidents}
