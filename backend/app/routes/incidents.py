from flask import Blueprint, request, jsonify
from app import db
from app.models.incident import Incident
from app.routes.auth import token_required, admin_required

incidents_bp = Blueprint('incidents', __name__, url_prefix='/api/incidents')

def classify_severity(description):
    """Simple keyword-based severity classification"""
    description_lower = description.lower()
    high_keywords = ['fire', 'flood', 'emergency', 'critical', 'danger', 'urgent', 'injury', 'attack']
    medium_keywords = ['broken', 'damaged', 'leak', 'fault', 'issue', 'problem', 'failure']
    for word in high_keywords:
        if word in description_lower:
            return 'high'
    for word in medium_keywords:
        if word in description_lower:
            return 'medium'
    return 'low'

@incidents_bp.route('', methods=['POST'])
@token_required
def create_incident(current_user):
    data = request.get_json()
    required = ['title', 'description', 'category', 'location']
    if not all(k in data for k in required):
        return jsonify({'error': 'Missing required fields'}), 400

    severity = classify_severity(data['description'])
    incident = Incident(
        title=data['title'],
        description=data['description'],
        category=data['category'],
        location=data['location'],
        severity=severity,
        reported_by=current_user.id
    )
    db.session.add(incident)
    db.session.commit()
    return jsonify({'message': 'Incident reported', 'incident': incident.to_dict()}), 201

@incidents_bp.route('', methods=['GET'])
@token_required
def get_incidents(current_user):
    if current_user.role == 'admin':
        incidents = Incident.query.order_by(Incident.created_at.desc()).all()
    else:
        incidents = Incident.query.filter_by(reported_by=current_user.id).order_by(Incident.created_at.desc()).all()
    return jsonify({'incidents': [i.to_dict() for i in incidents]}), 200

@incidents_bp.route('/<int:incident_id>', methods=['GET'])
@token_required
def get_incident(current_user, incident_id):
    incident = Incident.query.get_or_404(incident_id)
    if current_user.role != 'admin' and incident.reported_by != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    return jsonify({'incident': incident.to_dict()}), 200

@incidents_bp.route('/<int:incident_id>/assign', methods=['PUT'])
@admin_required
def assign_incident(current_user, incident_id):
    incident = Incident.query.get_or_404(incident_id)
    data = request.get_json()
    incident.assigned_to = data.get('assigned_to')
    incident.status = 'in_progress'
    db.session.commit()
    return jsonify({'message': 'Incident assigned', 'incident': incident.to_dict()}), 200

@incidents_bp.route('/<int:incident_id>/status', methods=['PUT'])
@admin_required
def update_status(current_user, incident_id):
    incident = Incident.query.get_or_404(incident_id)
    data = request.get_json()
    status = data.get('status')
    if status not in ['reported', 'in_progress', 'resolved']:
        return jsonify({'error': 'Invalid status'}), 400
    incident.status = status
    db.session.commit()
    return jsonify({'message': 'Status updated', 'incident': incident.to_dict()}), 200
