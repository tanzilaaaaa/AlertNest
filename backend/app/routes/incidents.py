from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from app.database import get_db
from app.utils.auth import get_current_user
from datetime import datetime, timezone
from bson import ObjectId
from typing import List, Optional
import io
import csv
import uuid

router = APIRouter(prefix="/api/incidents", tags=["incidents"])

class IncidentCreate(BaseModel):
    title: str       = Field(..., max_length=120)
    description: str = Field(..., max_length=2000)
    category: str    = Field(..., max_length=60)
    location: str    = Field(..., max_length=120)

class StatusUpdate(BaseModel):
    status: str

class AssignUpdate(BaseModel):
    assigned_to: str

class CommentCreate(BaseModel):
    text: str

class BulkStatusUpdate(BaseModel):
    incident_ids: List[str]
    status: str

class SavedFilterCreate(BaseModel):
    name: str
    filters: dict

def classify_severity(description: str) -> str:
    desc = description.lower()
    high_keywords = [
        'fire', 'flood', 'emergency', 'critical', 'danger', 'urgent', 'injury',
        'attack', 'explosion', 'collapse', 'trapped', 'unconscious', 'bleeding',
        'smoke', 'gas leak', 'chemical', 'threat', 'violence', 'assault',
        'electrical fire', 'structural damage', 'evacuation', 'ambulance', 'police'
    ]
    medium_keywords = [
        'broken', 'damaged', 'leak', 'fault', 'issue', 'problem', 'failure',
        'not working', 'malfunction', 'crack', 'spill', 'blocked', 'stuck',
        'overheating', 'flooding', 'power outage', 'no power', 'no water',
        'vandalism', 'graffiti', 'missing', 'stolen', 'suspicious', 'noise',
        'smell', 'pest', 'mold', 'broken window', 'broken door', 'broken lock'
    ]
    if any(w in desc for w in high_keywords):
        return 'high'
    if any(w in desc for w in medium_keywords):
        return 'medium'
    return 'low'

@router.post("", status_code=201)
async def create_incident(data: IncidentCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    incidents_collection = db.incidents
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
    result = incidents_collection.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return {"message": "Incident reported", "incident": doc}

@router.get("")
async def get_incidents(
    current_user: dict = Depends(get_current_user),
    status:   str = Query(None),
    severity: str = Query(None),
    category: str = Query(None),
    date_from: str = Query(None),
    date_to: str = Query(None),
    assigned_to: str = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    role = current_user.get("role", "student")
    uid = current_user["uid"]
    incidents_collection = db.incidents

    if role == "admin":
        incidents = list(incidents_collection.find({}))
    elif role == "staff":
        own      = list(incidents_collection.find({"reported_by": uid}))
        assigned = list(incidents_collection.find({"assigned_to": uid}))
        seen = set()
        incidents = []
        for doc in own + assigned:
            doc_id = str(doc["_id"])
            if doc_id not in seen:
                seen.add(doc_id)
                incidents.append(doc)
    else:
        incidents = list(incidents_collection.find({"reported_by": uid}))

    result = []
    for inc in incidents:
        inc["id"] = str(inc["_id"])
        del inc["_id"]
        if status and inc.get("status") != status:
            continue
        if severity and inc.get("severity") != severity:
            continue
        if category and inc.get("category", "").lower() != category.lower():
            continue
        if assigned_to and inc.get("assigned_to") != assigned_to:
            continue
        if date_from:
            try:
                if inc.get("created_at", "") < date_from:
                    continue
            except:
                pass
        if date_to:
            try:
                if inc.get("created_at", "") > date_to:
                    continue
            except:
                pass
        result.append(inc)
    
    reverse = sort_order == "desc"
    if sort_by == "severity":
        sev_order = {"high": 3, "medium": 2, "low": 1}
        result.sort(key=lambda x: sev_order.get(x.get("severity", "low"), 0), reverse=reverse)
    elif sort_by == "status":
        result.sort(key=lambda x: x.get("status", ""), reverse=reverse)
    else:
        result.sort(key=lambda x: x.get("created_at", ""), reverse=reverse)
    
    return {"incidents": result}

# ── EXPORT (must be before /{incident_id}) ──
@router.get("/export")
async def export_incidents(
    format: str = Query("csv"),
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    role = current_user.get("role", "student")
    uid = current_user["uid"]
    incidents_collection = db.incidents

    if role == "admin":
        incidents = list(incidents_collection.find({}))
    elif role == "staff":
        own = list(incidents_collection.find({"reported_by": uid}))
        assigned = list(incidents_collection.find({"assigned_to": uid}))
        seen = set()
        incidents = []
        for doc in own + assigned:
            doc_id = str(doc["_id"])
            if doc_id not in seen:
                seen.add(doc_id)
                incidents.append(doc)
    else:
        incidents = list(incidents_collection.find({"reported_by": uid}))

    for inc in incidents:
        inc["id"] = str(inc["_id"])
        del inc["_id"]

    if format == "csv":
        output = io.StringIO()
        if incidents:
            fieldnames = ["id", "title", "description", "category", "location", "severity", "status", "reported_by", "assigned_to", "created_at"]
            writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction='ignore')
            writer.writeheader()
            for inc in incidents:
                writer.writerow(inc)
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=incidents.csv"}
        )
    else:
        raise HTTPException(status_code=400, detail="Only CSV export supported")

# ── BULK UPDATE (must be before /{incident_id}) ──
@router.post("/bulk-update")
async def bulk_update_status(data: BulkStatusUpdate, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admins only")
    if data.status not in ["reported", "in_progress", "resolved"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    db = get_db()
    incidents_collection = db.incidents
    updated_count = 0
    for inc_id in data.incident_ids:
        try:
            result = incidents_collection.update_one(
                {"_id": ObjectId(inc_id)},
                {"$set": {"status": data.status, "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
            if result.matched_count > 0:
                updated_count += 1
        except:
            continue
    return {"message": f"Updated {updated_count} incidents"}

# ── SAVED FILTERS (must be before /{incident_id}) ──
@router.post("/filters", status_code=201)
async def save_filter(data: SavedFilterCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    saved_filter = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["uid"],
        "name": data.name,
        "filters": data.filters,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    db.saved_filters.insert_one(saved_filter)
    return {"message": "Filter saved", "filter": saved_filter}

@router.get("/filters")
async def get_saved_filters(current_user: dict = Depends(get_current_user)):
    db = get_db()
    filters = list(db.saved_filters.find({"user_id": current_user["uid"]}))
    for f in filters:
        f.pop("_id", None)
    return {"filters": filters}

@router.delete("/filters/{filter_id}")
async def delete_saved_filter(filter_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    result = db.saved_filters.delete_one({"id": filter_id, "user_id": current_user["uid"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Filter not found")
    return {"message": "Filter deleted"}

# ── DYNAMIC ROUTES (/{incident_id} must come AFTER all static routes) ──

@router.get("/{incident_id}")
async def get_incident(incident_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    incidents_collection = db.incidents
    try:
        incident = incidents_collection.find_one({"_id": ObjectId(incident_id)})
    except:
        raise HTTPException(status_code=404, detail="Incident not found")
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    incident["id"] = str(incident["_id"])
    del incident["_id"]
    role = current_user.get("role", "student")
    if role != "admin" and incident["reported_by"] != current_user["uid"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    return {"incident": incident}

@router.put("/{incident_id}/assign")
async def assign_incident(incident_id: str, data: AssignUpdate, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admins only")
    db = get_db()
    incidents_collection = db.incidents
    try:
        result = incidents_collection.update_one(
            {"_id": ObjectId(incident_id)},
            {"$set": {
                "assigned_to": data.assigned_to,
                "status": "in_progress",
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Incident not found")
    except:
        raise HTTPException(status_code=404, detail="Incident not found")
    return {"message": "Incident assigned"}

@router.put("/{incident_id}/status")
async def update_status(incident_id: str, data: StatusUpdate, current_user: dict = Depends(get_current_user)):
    role = current_user.get("role", "student")
    db = get_db()
    incidents_collection = db.incidents
    try:
        incident = incidents_collection.find_one({"_id": ObjectId(incident_id)})
    except:
        raise HTTPException(status_code=404, detail="Incident not found")
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    if role == "admin":
        pass
    elif role == "staff" and incident.get("assigned_to") == current_user["uid"]:
        pass
    else:
        raise HTTPException(status_code=403, detail="Not authorized to update this incident")
    if data.status not in ["reported", "in_progress", "resolved"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    incidents_collection.update_one(
        {"_id": ObjectId(incident_id)},
        {"$set": {"status": data.status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Status updated"}

@router.delete("/{incident_id}")
async def delete_incident(incident_id: str, current_user: dict = Depends(get_current_user)):
    role = current_user.get("role", "student")
    db = get_db()
    incidents_collection = db.incidents
    try:
        incident = incidents_collection.find_one({"_id": ObjectId(incident_id)})
    except:
        raise HTTPException(status_code=404, detail="Incident not found")
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    if role == "admin":
        pass
    elif role == "student" and incident.get("reported_by") == current_user["uid"] and incident.get("status") == "reported":
        pass
    else:
        raise HTTPException(status_code=403, detail="Not authorized to delete this incident")
    incidents_collection.delete_one({"_id": ObjectId(incident_id)})
    db.comments.delete_many({"incident_id": incident_id})
    db.attachments.delete_many({"incident_id": incident_id})
    return {"message": "Incident deleted"}

# ── COMMENTS ──
@router.post("/{incident_id}/comments", status_code=201)
async def add_comment(incident_id: str, data: CommentCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    incidents_collection = db.incidents
    try:
        incident = incidents_collection.find_one({"_id": ObjectId(incident_id)})
    except:
        raise HTTPException(status_code=404, detail="Incident not found")
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    comment = {
        "id": str(uuid.uuid4()),
        "incident_id": incident_id,
        "user_id": current_user["uid"],
        "user_name": current_user.get("name", "Unknown"),
        "text": data.text,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    db.comments.insert_one(comment)
    return {"message": "Comment added", "comment": comment}

@router.get("/{incident_id}/comments")
async def get_comments(incident_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    comments = list(db.comments.find({"incident_id": incident_id}))
    for c in comments:
        c.pop("_id", None)
    comments.sort(key=lambda x: x.get("created_at", ""))
    return {"comments": comments}

# ── ATTACHMENTS ──
@router.post("/{incident_id}/attachments", status_code=201)
async def upload_attachment(incident_id: str, file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    db = get_db()
    incidents_collection = db.incidents
    try:
        incident = incidents_collection.find_one({"_id": ObjectId(incident_id)})
    except:
        raise HTTPException(status_code=404, detail="Incident not found")
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    attachment = {
        "id": str(uuid.uuid4()),
        "incident_id": incident_id,
        "filename": file.filename,
        "file_url": f"/uploads/{incident_id}/{file.filename}",
        "uploaded_by": current_user["uid"],
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
    }
    db.attachments.insert_one(attachment)
    return {"message": "File uploaded", "attachment": attachment}

@router.get("/{incident_id}/attachments")
async def get_attachments(incident_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    attachments = list(db.attachments.find({"incident_id": incident_id}))
    for a in attachments:
        a.pop("_id", None)
    return {"attachments": attachments}

@router.get("")
async def get_incidents(
    current_user: dict = Depends(get_current_user),
    status:   str = Query(None),
    severity: str = Query(None),
    category: str = Query(None),
    date_from: str = Query(None),
    date_to: str = Query(None),
    assigned_to: str = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    role = current_user.get("role", "student")
    uid = current_user["uid"]
    incidents_collection = db.incidents

    if role == "admin":
        incidents = list(incidents_collection.find({}))
    elif role == "staff":
        own      = list(incidents_collection.find({"reported_by": uid}))
        assigned = list(incidents_collection.find({"assigned_to": uid}))
        seen = set()
        incidents = []
        for doc in own + assigned:
            doc_id = str(doc["_id"])
            if doc_id not in seen:
                seen.add(doc_id)
                incidents.append(doc)
    else:
        incidents = list(incidents_collection.find({"reported_by": uid}))

    # Convert ObjectId to string and apply filters
    result = []
    for inc in incidents:
        inc["id"] = str(inc["_id"])
        del inc["_id"]
        
        if status and inc.get("status") != status:
            continue
        if severity and inc.get("severity") != severity:
            continue
        if category and inc.get("category", "").lower() != category.lower():
            continue
        if assigned_to and inc.get("assigned_to") != assigned_to:
            continue
        if date_from:
            try:
                if inc.get("created_at", "") < date_from:
                    continue
            except:
                pass
        if date_to:
            try:
                if inc.get("created_at", "") > date_to:
                    continue
            except:
                pass
        result.append(inc)
    
    # Sort
    reverse = sort_order == "desc"
    if sort_by == "severity":
        sev_order = {"high": 3, "medium": 2, "low": 1}
        result.sort(key=lambda x: sev_order.get(x.get("severity", "low"), 0), reverse=reverse)
    elif sort_by == "status":
        result.sort(key=lambda x: x.get("status", ""), reverse=reverse)
    else:  # created_at
        result.sort(key=lambda x: x.get("created_at", ""), reverse=reverse)
    
    return {"incidents": result}

@router.get("/{incident_id}")
async def get_incident(incident_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    incidents_collection = db.incidents
    try:
        incident = incidents_collection.find_one({"_id": ObjectId(incident_id)})
    except:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    incident["id"] = str(incident["_id"])
    del incident["_id"]
    
    role = current_user.get("role", "student")
    if role != "admin" and incident["reported_by"] != current_user["uid"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    return {"incident": incident}

@router.put("/{incident_id}/assign")
async def assign_incident(incident_id: str, data: AssignUpdate, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admins only")
    db = get_db()
    incidents_collection = db.incidents
    try:
        result = incidents_collection.update_one(
            {"_id": ObjectId(incident_id)},
            {"$set": {
                "assigned_to": data.assigned_to,
                "status": "in_progress",
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Incident not found")
    except:
        raise HTTPException(status_code=404, detail="Incident not found")
    return {"message": "Incident assigned"}

@router.put("/{incident_id}/status")
async def update_status(incident_id: str, data: StatusUpdate, current_user: dict = Depends(get_current_user)):
    role = current_user.get("role", "student")
    db = get_db()
    incidents_collection = db.incidents
    try:
        incident = incidents_collection.find_one({"_id": ObjectId(incident_id)})
    except:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    if role == "admin":
        pass
    elif role == "staff" and incident.get("assigned_to") == current_user["uid"]:
        pass
    else:
        raise HTTPException(status_code=403, detail="Not authorized to update this incident")
    
    if data.status not in ["reported", "in_progress", "resolved"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    incidents_collection.update_one(
        {"_id": ObjectId(incident_id)},
        {"$set": {
            "status": data.status,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }}
    )
    return {"message": "Status updated"}

@router.delete("/{incident_id}")
async def delete_incident(incident_id: str, current_user: dict = Depends(get_current_user)):
    role = current_user.get("role", "student")
    db = get_db()
    incidents_collection = db.incidents
    try:
        incident = incidents_collection.find_one({"_id": ObjectId(incident_id)})
    except:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    # admin can delete any; student can delete their own unreported ones
    if role == "admin":
        pass
    elif role == "student" and incident.get("reported_by") == current_user["uid"] and incident.get("status") == "reported":
        pass
    else:
        raise HTTPException(status_code=403, detail="Not authorized to delete this incident")
    
    incidents_collection.delete_one({"_id": ObjectId(incident_id)})
    # Also delete comments and attachments
    db.comments.delete_many({"incident_id": incident_id})
    db.attachments.delete_many({"incident_id": incident_id})
    return {"message": "Incident deleted"}

# ── COMMENTS ──
@router.post("/{incident_id}/comments", status_code=201)
async def add_comment(incident_id: str, data: CommentCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    incidents_collection = db.incidents
    try:
        incident = incidents_collection.find_one({"_id": ObjectId(incident_id)})
    except:
        raise HTTPException(status_code=404, detail="Incident not found")
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    comment = {
        "id": str(uuid.uuid4()),
        "incident_id": incident_id,
        "user_id": current_user["uid"],
        "user_name": current_user.get("name", "Unknown"),
        "text": data.text,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    db.comments.insert_one(comment)
    return {"message": "Comment added", "comment": comment}

@router.get("/{incident_id}/comments")
async def get_comments(incident_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    comments = list(db.comments.find({"incident_id": incident_id}))
    for c in comments:
        c.pop("_id", None)
    comments.sort(key=lambda x: x.get("created_at", ""))
    return {"comments": comments}

# ── ATTACHMENTS ──
@router.post("/{incident_id}/attachments", status_code=201)
async def upload_attachment(incident_id: str, file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    db = get_db()
    incidents_collection = db.incidents
    try:
        incident = incidents_collection.find_one({"_id": ObjectId(incident_id)})
    except:
        raise HTTPException(status_code=404, detail="Incident not found")
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    # For demo: just store filename and a fake URL (in production, upload to S3/cloud storage)
    attachment = {
        "id": str(uuid.uuid4()),
        "incident_id": incident_id,
        "filename": file.filename,
        "file_url": f"/uploads/{incident_id}/{file.filename}",  # fake URL
        "uploaded_by": current_user["uid"],
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
    }
    db.attachments.insert_one(attachment)
    return {"message": "File uploaded", "attachment": attachment}

@router.get("/{incident_id}/attachments")
async def get_attachments(incident_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    attachments = list(db.attachments.find({"incident_id": incident_id}))
    for a in attachments:
        a.pop("_id", None)
    return {"attachments": attachments}

# ── BULK ACTIONS ──
@router.post("/bulk-update")
async def bulk_update_status(data: BulkStatusUpdate, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admins only")
    if data.status not in ["reported", "in_progress", "resolved"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    db = get_db()
    incidents_collection = db.incidents
    updated_count = 0
    for inc_id in data.incident_ids:
        try:
            result = incidents_collection.update_one(
                {"_id": ObjectId(inc_id)},
                {"$set": {"status": data.status, "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
            if result.matched_count > 0:
                updated_count += 1
        except:
            continue
    return {"message": f"Updated {updated_count} incidents"}

# ── EXPORT ──
@router.get("/export")
async def export_incidents(
    format: str = Query("csv"),
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    role = current_user.get("role", "student")
    uid = current_user["uid"]
    incidents_collection = db.incidents

    if role == "admin":
        incidents = list(incidents_collection.find({}))
    elif role == "staff":
        own = list(incidents_collection.find({"reported_by": uid}))
        assigned = list(incidents_collection.find({"assigned_to": uid}))
        seen = set()
        incidents = []
        for doc in own + assigned:
            doc_id = str(doc["_id"])
            if doc_id not in seen:
                seen.add(doc_id)
                incidents.append(doc)
    else:
        incidents = list(incidents_collection.find({"reported_by": uid}))

    for inc in incidents:
        inc["id"] = str(inc["_id"])
        del inc["_id"]

    if format == "csv":
        output = io.StringIO()
        if incidents:
            fieldnames = ["id", "title", "description", "category", "location", "severity", "status", "reported_by", "assigned_to", "created_at"]
            writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction='ignore')
            writer.writeheader()
            for inc in incidents:
                writer.writerow(inc)
        
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=incidents.csv"}
        )
    else:
        raise HTTPException(status_code=400, detail="Only CSV export supported")

# ── SAVED FILTERS ──
@router.post("/filters", status_code=201)
async def save_filter(data: SavedFilterCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    saved_filter = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["uid"],
        "name": data.name,
        "filters": data.filters,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    db.saved_filters.insert_one(saved_filter)
    return {"message": "Filter saved", "filter": saved_filter}

@router.get("/filters")
async def get_saved_filters(current_user: dict = Depends(get_current_user)):
    db = get_db()
    filters = list(db.saved_filters.find({"user_id": current_user["uid"]}))
    for f in filters:
        f.pop("_id", None)
    return {"filters": filters}

@router.delete("/filters/{filter_id}")
async def delete_saved_filter(filter_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    result = db.saved_filters.delete_one({"id": filter_id, "user_id": current_user["uid"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Filter not found")
    return {"message": "Filter deleted"}
