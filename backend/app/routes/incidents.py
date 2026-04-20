from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File, Form
from pydantic import BaseModel, Field
from app.database import get_db
from app.utils.auth import get_current_user
from datetime import datetime, timezone
from bson import ObjectId
from typing import List, Optional
import uuid
import base64

router = APIRouter(prefix="/api/incidents", tags=["incidents"])

# ── Pydantic models ──────────────────────────────────────────────────────────
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

# ── RBAC helpers ─────────────────────────────────────────────────────────────
def require_admin(current_user: dict):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admins only")

def require_admin_or_staff(current_user: dict):
    if current_user.get("role") not in ("admin", "staff"):
        raise HTTPException(status_code=403, detail="Admins and staff only")

# ── Severity classifier ──────────────────────────────────────────────────────
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

# ════════════════════════════════════════════════════════════════════════════
# STATIC ROUTES (must come before /{incident_id})
# ════════════════════════════════════════════════════════════════════════════

# ── Create incident ──────────────────────────────────────────────────────────
# WHO: student, staff, admin (all authenticated users can report)
@router.post("", status_code=201)
async def create_incident(
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    location: str = Form(...),
    media: List[UploadFile] = File(default=[]),
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    media_files = []
    for f in media:
        content = await f.read()
        if len(content) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail=f"File {f.filename} exceeds 10MB limit")
        encoded = base64.b64encode(content).decode('utf-8')
        media_files.append({
            "id": str(uuid.uuid4()),
            "filename": f.filename,
            "content_type": f.content_type,
            "data": encoded,
        })

    doc = {
        "title": title,
        "description": description,
        "category": category,
        "location": location,
        "severity": classify_severity(description),
        "status": "reported",
        "reported_by": current_user["uid"],
        "assigned_to": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "media": media_files,
    }
    result = db.incidents.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    doc["media"] = [{"id": m["id"], "filename": m["filename"], "content_type": m["content_type"]} for m in media_files]
    return {"message": "Incident reported", "incident": doc}

# ── List incidents ───────────────────────────────────────────────────────────
# WHO: admin sees all | staff sees own + assigned | student sees own only
@router.get("")
async def get_incidents(
    current_user: dict = Depends(get_current_user),
    status:      str = Query(None),
    severity:    str = Query(None),
    category:    str = Query(None),
    date_from:   str = Query(None),
    date_to:     str = Query(None),
    assigned_to: str = Query(None),
    sort_by:     str = Query("created_at"),
    sort_order:  str = Query("desc"),
):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

    role = current_user.get("role", "student")
    uid  = current_user["uid"]

    if role == "admin":
        incidents = list(db.incidents.find({}))
    elif role == "staff":
        own      = list(db.incidents.find({"reported_by": uid}))
        assigned = list(db.incidents.find({"assigned_to": uid}))
        seen, incidents = set(), []
        for doc in own + assigned:
            key = str(doc["_id"])
            if key not in seen:
                seen.add(key)
                incidents.append(doc)
    else:  # student
        incidents = list(db.incidents.find({"reported_by": uid}))

    result = []
    for inc in incidents:
        inc["id"] = str(inc["_id"])
        del inc["_id"]
        if status      and inc.get("status")             != status:                    continue
        if severity    and inc.get("severity")           != severity:                  continue
        if category    and inc.get("category","").lower()!= category.lower():          continue
        if assigned_to and inc.get("assigned_to")        != assigned_to:               continue
        if date_from:
            try:
                if inc.get("created_at","") < date_from: continue
            except: pass
        if date_to:
            try:
                if inc.get("created_at","") > date_to: continue
            except: pass
        result.append(inc)

    reverse = sort_order == "desc"
    if sort_by == "severity":
        sev_order = {"high": 3, "medium": 2, "low": 1}
        result.sort(key=lambda x: sev_order.get(x.get("severity","low"), 0), reverse=reverse)
    elif sort_by == "status":
        result.sort(key=lambda x: x.get("status",""), reverse=reverse)
    else:
        result.sort(key=lambda x: x.get("created_at",""), reverse=reverse)

    return {"incidents": result}

# ── Bulk status update ───────────────────────────────────────────────────────
# WHO: admin only
@router.post("/bulk-update")
async def bulk_update_status(data: BulkStatusUpdate, current_user: dict = Depends(get_current_user)):
    require_admin(current_user)
    if data.status not in ["reported", "in_progress", "resolved"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    db = get_db()
    updated = 0
    for inc_id in data.incident_ids:
        try:
            r = db.incidents.update_one(
                {"_id": ObjectId(inc_id)},
                {"$set": {"status": data.status, "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
            if r.matched_count > 0:
                updated += 1
        except: continue
    return {"message": f"Updated {updated} incidents"}

# ── Saved filters ────────────────────────────────────────────────────────────
# WHO: any authenticated user (personal filters)
@router.post("/filters", status_code=201)
async def save_filter(data: SavedFilterCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    saved = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["uid"],
        "name": data.name,
        "filters": data.filters,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    db.saved_filters.insert_one(saved)
    return {"message": "Filter saved", "filter": saved}

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

# ════════════════════════════════════════════════════════════════════════════
# DYNAMIC ROUTES (/{incident_id} — must come AFTER all static routes)
# ════════════════════════════════════════════════════════════════════════════

# ── Serve media (no auth — public URL for images/videos) ────────────────────
@router.get("/{incident_id}/media/{media_id}")
async def get_media(incident_id: str, media_id: str):
    from fastapi.responses import Response
    db = get_db()
    try:
        incident = db.incidents.find_one({"_id": ObjectId(incident_id)})
    except:
        raise HTTPException(status_code=404, detail="Not found")
    if not incident:
        raise HTTPException(status_code=404, detail="Not found")
    for m in incident.get("media", []):
        if m["id"] == media_id:
            return Response(content=base64.b64decode(m["data"]), media_type=m["content_type"])
    raise HTTPException(status_code=404, detail="Media not found")

# ── Get single incident ──────────────────────────────────────────────────────
# WHO: admin sees any | staff sees own/assigned | student sees own only
@router.get("/{incident_id}")
async def get_incident(incident_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        incident = db.incidents.find_one({"_id": ObjectId(incident_id)})
    except:
        raise HTTPException(status_code=404, detail="Incident not found")
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    incident["id"] = str(incident["_id"])
    del incident["_id"]

    role = current_user.get("role", "student")
    uid  = current_user["uid"]

    if role == "admin":
        pass
    elif role == "staff" and (incident["reported_by"] == uid or incident.get("assigned_to") == uid):
        pass
    elif role == "student" and incident["reported_by"] == uid:
        pass
    else:
        raise HTTPException(status_code=403, detail="Access denied")

    return {"incident": incident}

# ── Assign incident ──────────────────────────────────────────────────────────
# WHO: admin only
@router.put("/{incident_id}/assign")
async def assign_incident(incident_id: str, data: AssignUpdate, current_user: dict = Depends(get_current_user)):
    require_admin(current_user)
    db = get_db()
    try:
        result = db.incidents.update_one(
            {"_id": ObjectId(incident_id)},
            {"$set": {
                "assigned_to": data.assigned_to,
                "status": "in_progress",
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Incident not found")
    except HTTPException:
        raise
    except:
        raise HTTPException(status_code=404, detail="Incident not found")
    return {"message": "Incident assigned"}

# ── Update status ────────────────────────────────────────────────────────────
# WHO: admin can set any status
#      staff can only set in_progress or resolved (only on assigned incidents)
#      student CANNOT change status
@router.put("/{incident_id}/status")
async def update_status(incident_id: str, data: StatusUpdate, current_user: dict = Depends(get_current_user)):
    role = current_user.get("role", "student")
    uid  = current_user["uid"]

    # Students cannot change status at all
    if role == "student":
        raise HTTPException(status_code=403, detail="Students cannot update incident status")

    if data.status not in ["reported", "in_progress", "resolved"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    db = get_db()
    try:
        incident = db.incidents.find_one({"_id": ObjectId(incident_id)})
    except:
        raise HTTPException(status_code=404, detail="Incident not found")
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    if role == "admin":
        # Admin can set any status
        pass
    elif role == "staff":
        # Staff can only update incidents assigned to them
        if incident.get("assigned_to") != uid:
            raise HTTPException(status_code=403, detail="You can only update incidents assigned to you")
        # Staff can only set in_progress or resolved (not revert to reported)
        if data.status == "reported":
            raise HTTPException(status_code=403, detail="Staff cannot revert status to reported")

    db.incidents.update_one(
        {"_id": ObjectId(incident_id)},
        {"$set": {"status": data.status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Status updated"}

# ── Delete incident ──────────────────────────────────────────────────────────
# WHO: admin can delete any
#      student can delete their own ONLY if status is still "reported"
#      staff CANNOT delete
@router.delete("/{incident_id}")
async def delete_incident(incident_id: str, current_user: dict = Depends(get_current_user)):
    role = current_user.get("role", "student")
    uid  = current_user["uid"]

    if role == "staff":
        raise HTTPException(status_code=403, detail="Staff cannot delete incidents")

    db = get_db()
    try:
        incident = db.incidents.find_one({"_id": ObjectId(incident_id)})
    except:
        raise HTTPException(status_code=404, detail="Incident not found")
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    if role == "admin":
        pass
    elif role == "student":
        if incident.get("reported_by") != uid:
            raise HTTPException(status_code=403, detail="You can only delete your own incidents")
        if incident.get("status") != "reported":
            raise HTTPException(status_code=403, detail="Cannot delete an incident that is already in progress or resolved")

    db.incidents.delete_one({"_id": ObjectId(incident_id)})
    db.comments.delete_many({"incident_id": incident_id})
    db.attachments.delete_many({"incident_id": incident_id})
    return {"message": "Incident deleted"}

# ── Comments ─────────────────────────────────────────────────────────────────
# WHO: admin, staff, and the student who reported can comment
@router.post("/{incident_id}/comments", status_code=201)
async def add_comment(incident_id: str, data: CommentCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        incident = db.incidents.find_one({"_id": ObjectId(incident_id)})
    except:
        raise HTTPException(status_code=404, detail="Incident not found")
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    role = current_user.get("role", "student")
    uid  = current_user["uid"]

    # Students can only comment on their own incidents
    if role == "student" and incident.get("reported_by") != uid:
        raise HTTPException(status_code=403, detail="You can only comment on your own incidents")

    comment = {
        "id": str(uuid.uuid4()),
        "incident_id": incident_id,
        "user_id": uid,
        "user_name": current_user.get("name", "Unknown"),
        "role": role,
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

# ── Attachments ──────────────────────────────────────────────────────────────
# WHO: admin and staff can upload attachments; student can upload to their own incidents
@router.post("/{incident_id}/attachments", status_code=201)
async def upload_attachment(incident_id: str, file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        incident = db.incidents.find_one({"_id": ObjectId(incident_id)})
    except:
        raise HTTPException(status_code=404, detail="Incident not found")
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    role = current_user.get("role", "student")
    uid  = current_user["uid"]

    if role == "student" and incident.get("reported_by") != uid:
        raise HTTPException(status_code=403, detail="You can only attach files to your own incidents")

    attachment = {
        "id": str(uuid.uuid4()),
        "incident_id": incident_id,
        "filename": file.filename,
        "file_url": f"/uploads/{incident_id}/{file.filename}",
        "uploaded_by": uid,
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
