from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.database import get_db
from app.utils.auth import get_current_user
from datetime import datetime, timezone

router = APIRouter(prefix="/api/incidents", tags=["incidents"])

class IncidentCreate(BaseModel):
    title: str
    description: str
    category: str
    location: str

class StatusUpdate(BaseModel):
    status: str

class AssignUpdate(BaseModel):
    assigned_to: str

def classify_severity(description: str) -> str:
    desc = description.lower()
    if any(w in desc for w in ['fire', 'flood', 'emergency', 'critical', 'danger', 'urgent', 'injury', 'attack']):
        return 'high'
    if any(w in desc for w in ['broken', 'damaged', 'leak', 'fault', 'issue', 'problem', 'failure']):
        return 'medium'
    return 'low'

@router.post("", status_code=201)
async def create_incident(data: IncidentCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    doc_ref = db.collection("incidents").document()
    doc = {
        "title": data.title,
        "description": data.description,
        "category": data.category,
        "location": data.location,
        "severity": classify_severity(data.description),
        "status": "reported",
        "reported_by": current_user["uid"],
        "assigned_to": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    doc_ref.set(doc)
    doc["id"] = doc_ref.id
    return {"message": "Incident reported", "incident": doc}

@router.get("")
async def get_incidents(current_user: dict = Depends(get_current_user)):
    db = get_db()
    role = current_user.get("role", "student")
    uid = current_user["uid"]
    if role == "admin":
        docs = db.collection("incidents").get()
    elif role == "staff":
        # staff sees their own + incidents assigned to them
        own = db.collection("incidents").where("reported_by", "==", uid).get()
        assigned = db.collection("incidents").where("assigned_to", "==", uid).get()
        seen = set()
        incidents = []
        for d in list(own) + list(assigned):
            if d.id not in seen:
                seen.add(d.id)
                incidents.append({**d.to_dict(), "id": d.id})
        return {"incidents": incidents}
    else:
        docs = db.collection("incidents").where("reported_by", "==", uid).get()
    incidents = [{**d.to_dict(), "id": d.id} for d in docs]
    return {"incidents": incidents}

@router.get("/{incident_id}")
async def get_incident(incident_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    doc = db.collection("incidents").document(incident_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Incident not found")
    incident = {**doc.to_dict(), "id": doc.id}
    if current_user.get("role") != "admin" and incident["reported_by"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    return {"incident": incident}

@router.put("/{incident_id}/assign")
async def assign_incident(incident_id: str, data: AssignUpdate, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admins only")
    db = get_db()
    db.collection("incidents").document(incident_id).update(
        {"assigned_to": data.assigned_to, "status": "in_progress"}
    )
    return {"message": "Incident assigned"}

@router.put("/{incident_id}/status")
async def update_status(incident_id: str, data: StatusUpdate, current_user: dict = Depends(get_current_user)):
    role = current_user.get("role", "student")
    db = get_db()
    doc = db.collection("incidents").document(incident_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Incident not found")
    incident = doc.to_dict()
    # admin can update any, staff can update only assigned to them
    if role == "admin":
        pass
    elif role == "staff" and incident.get("assigned_to") == current_user["uid"]:
        pass
    else:
        raise HTTPException(status_code=403, detail="Not authorized to update this incident")
    if data.status not in ["reported", "in_progress", "resolved"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    db.collection("incidents").document(incident_id).update({"status": data.status})
    return {"message": "Status updated"}
