from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
import os
from models import db, CompanyProfile, TblUser
import jwt
from datetime import datetime, timedelta

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'secret!')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
CORS(app, origins=["http://localhost:5173", "http://localhost:3000"])

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

@app.route('/api/auth/login', methods=['POST'])
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

@app.route('/api/auth/register', methods=['POST'])
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

@app.route("/")
def home():
    return {"message": "Flask Auth Server is running."}

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
