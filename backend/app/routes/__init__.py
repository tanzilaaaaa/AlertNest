from flask import Blueprint, jsonify
from datetime import datetime

health_bp = Blueprint('health', __name__)

@health_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'AlertNest Backend',
        'timestamp': datetime.utcnow().isoformat()
    }), 200

@health_bp.route('/api/ping', methods=['GET'])
def ping():
    """Ping endpoint for connectivity test"""
    return jsonify({
        'message': 'pong',
        'service': 'AlertNest API',
        'timestamp': datetime.utcnow().isoformat()
    }), 200
