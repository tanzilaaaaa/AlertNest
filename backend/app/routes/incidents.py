from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from bson import ObjectId
from app.database import get_db
from app.utils.auth import get_current_user

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

def fmt(incident) -> dict:
    incident["id"] = str(incident.pop("_id"))
    return incident

@router.post("", status_code=201)
async def create_incident(data: IncidentCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    doc = {
        "title": data.title,
        "description": data.description,
        "category": data.category,
        "location": data.location,
        "severity": classify_severity(data.description),
        "status": "reported",
        "reported_by": current_user["user_id"],
        "assigned_to": None,
    }
    result = await db["incidents"].insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return {"message": "Incident reported", "incident": doc}

@router.get("")
async def get_incidents(current_user: dict = Depends(get_current_user)):
    db = get_db()
    if current_user.get("role") == "admin":
        cursor = db["incidents"].find().sort("_id", -1)
    else:
        cursor = db["incidents"].find({"reported_by": current_user["user_id"]}).sort("_id", -1)
    incidents = [fmt(i) async for i in cursor]
    return {"incidents": incidents}

@router.get("/{incident_id}")
async def get_incident(incident_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    incident = await db["incidents"].find_one({"_id": ObjectId(incident_id)})
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    if current_user.get("role") != "admin" and incident["reported_by"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    return {"incident": fmt(incident)}

@router.put("/{incident_id}/assign")
async def assign_incident(incident_id: str, data: AssignUpdate, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admins only")
    db = get_db()
    await db["incidents"].update_one(
        {"_id": ObjectId(incident_id)},
        {"$set": {"assigned_to": data.assigned_to, "status": "in_progress"}}
    )
    return {"message": "Incident assigned"}

@router.put("/{incident_id}/status")
async def update_status(incident_id: str, data: StatusUpdate, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admins only")
    if data.status not in ["reported", "in_progress", "resolved"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    db = get_db()
    await db["incidents"].update_one(
        {"_id": ObjectId(incident_id)},
        {"$set": {"status": data.status}}
    )
    return {"message": "Status updated"}
