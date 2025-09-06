


import os
from flask import Blueprint, request, jsonify, url_for, redirect, session
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, CompanyProfile, TblUser
import jwt
from datetime import datetime, timedelta
from functools import wraps
from flask_dance.contrib.google import make_google_blueprint, google

auth_bp = Blueprint('auth', __name__)

JWT_SECRET = os.environ.get('JWT_SECRET', 'dev_secret')
JWT_EXPIRY_MINUTES = int(os.environ.get('JWT_EXPIRY_MINUTES', 60))

def create_jwt(user):
    payload = {
        'u_id': user.u_id,
        'username': user.username,
        'email': user.email,
        'exp': datetime.utcnow() + timedelta(minutes=JWT_EXPIRY_MINUTES)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = TblUser.query.filter_by(email=data.get('email')).first()
    if user and check_password_hash(user.password, data.get('password')):
        company_info = {
            "company_id": user.company.company_id,
            "company_name": user.company.company_name,
        } if user.company else None
        token = create_jwt(user)
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'u_id': user.u_id,
            'username': user.username,
            'email': user.email,
            'company': company_info
        })
    return jsonify({'error': 'Invalid credentials'}), 401

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No input data provided'}), 400
    required_fields = ("username", "email", "password", "company_id")
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing fields'}), 400
    if TblUser.query.filter((TblUser.username == data['username']) | (TblUser.email == data['email'])).first():
        return jsonify({'error': 'User already exists'}), 409
    hashed_pw = generate_password_hash(data['password'])
    user = TblUser()
    user.username = data['username']
    user.email = data['email']
    user.password = hashed_pw
    user.company_id = data['company_id']
    user.security_qn = data.get('security_qn')
    try:
        db.session.add(user)
        db.session.commit()
        token = create_jwt(user)
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Database error', 'details': str(e)}), 500
    return jsonify({'message': 'User registered successfully', 'token': token}), 201

# --- Google OAuth ---
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET')
google_bp = make_google_blueprint(
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    scope=["profile", "email"],
    redirect_url="/auth/google/callback"
)

@auth_bp.route('/google')
def google_login():
    if not google.authorized:
        return redirect(url_for("google.login"))
    resp = google.get("/oauth2/v2/userinfo")
    if not resp.ok:
        return jsonify({'error': 'Failed to fetch user info from Google'}), 400
    info = resp.json()
    email = info.get('email')
    user = TblUser.query.filter_by(email=email).first()
    if not user:
        # Auto-register user with Google info (no password)
        user = TblUser()
        user.username = info.get('name', email)
        user.email = email
        user.password = generate_password_hash(os.urandom(16).hex())
        user.company_id = None
        db.session.add(user)
        db.session.commit()
    token = create_jwt(user)
    return jsonify({'message': 'Google login successful', 'token': token, 'email': email, 'username': user.username})