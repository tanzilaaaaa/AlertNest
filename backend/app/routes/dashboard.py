from fastapi import APIRouter, Depends
from app.database import get_db
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

def compute_summary(incidents: list) -> dict:
    total       = len(incidents)
    reported    = sum(1 for i in incidents if i.get("status") == "reported")
    in_progress = sum(1 for i in incidents if i.get("status") == "in_progress")
    resolved    = sum(1 for i in incidents if i.get("status") == "resolved")
    high        = sum(1 for i in incidents if i.get("severity") == "high")
    medium      = sum(1 for i in incidents if i.get("severity") == "medium")
    low         = sum(1 for i in incidents if i.get("severity") == "low")
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

@router.get("/summary")
async def get_summary(current_user: dict = Depends(get_current_user)):
    db   = get_db()
    role = current_user.get("role", "student")
    uid  = current_user["uid"]

    if role == "admin":
        # admin sees everything
        docs = db.collection("incidents").get()
        incidents = [d.to_dict() for d in docs]

    elif role == "staff":
        # staff sees own + assigned
        own      = db.collection("incidents").where("reported_by", "==", uid).get()
        assigned = db.collection("incidents").where("assigned_to", "==", uid).get()
        seen, incidents = set(), []
        for d in list(own) + list(assigned):
            if d.id not in seen:
                seen.add(d.id)
                incidents.append(d.to_dict())

    else:
        # student sees only their own
        docs = db.collection("incidents").where("reported_by", "==", uid).get()
        incidents = [d.to_dict() for d in docs]

    return compute_summary(incidents)

@router.get("/recent")
async def get_recent(current_user: dict = Depends(get_current_user)):
    db   = get_db()
    role = current_user.get("role", "student")
    uid  = current_user["uid"]

    if role == "admin":
        docs = db.collection("incidents").limit(5).get()
        incidents = [d for d in docs]

    elif role == "staff":
        own      = db.collection("incidents").where("reported_by", "==", uid).get()
        assigned = db.collection("incidents").where("assigned_to", "==", uid).get()
        seen, incidents = set(), []
        for d in list(own) + list(assigned):
            if d.id not in seen:
                seen.add(d.id)
                incidents.append(d)
        incidents = incidents[:5]

    else:
        docs = db.collection("incidents").where("reported_by", "==", uid).limit(5).get()
        incidents = [d for d in docs]

    return {
        "incidents": [{
            "id": d.id,
            "title": d.to_dict().get("title"),
            "category": d.to_dict().get("category"),
            "severity": d.to_dict().get("severity"),
            "status": d.to_dict().get("status"),
            "location": d.to_dict().get("location", ""),
            "created_at": d.to_dict().get("created_at"),
        } for d in incidents]
    }
