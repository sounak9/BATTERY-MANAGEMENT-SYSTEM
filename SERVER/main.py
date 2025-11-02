from flask import Flask, request, jsonify, redirect, url_for, session
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
import os
from models import (
    db,
    CompanyProfile,
    TblUser,
    Product,
    BattDescription,
    BattHealth,
    BattFaultLog,
    MqttData
)
import jwt
from datetime import datetime, timedelta
from authlib.integrations.flask_client import OAuth
from authlib.integrations.base_client.errors import MismatchingStateError
from urllib.parse import quote_plus
from typing import Any, cast
from authlib.integrations.flask_client import OAuth, FlaskOAuth2App
from functools import wraps

# Load environment variables
load_dotenv()
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'secret!')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        # Get the token from Authorization header
        if "Authorization" in request.headers:
            parts = request.headers["Authorization"].split()
            if len(parts) == 2 and parts[0].lower() == "bearer":
                token = parts[1]

        if not token:
            return jsonify({"message": "Missing token"}), 401

        try:
            # ✅ Use JWT_SECRET (not SECRET_KEY)
            data = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])

            # Retrieve user from DB
            current_user = TblUser.query.get(data.get("u_id"))
            if not current_user:
                return jsonify({"message": "User not found"}), 404

        except jwt.ExpiredSignatureError:
            return jsonify({"message": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"message": "Invalid token"}), 401
        except Exception as e:
            return jsonify({"message": f"Token validation failed: {str(e)}"}), 401

        return f(current_user, *args, **kwargs)

    return decorated


# Session configuration
app.config.update(
    # Session cookie settings
    SESSION_COOKIE_SAMESITE=os.getenv('SESSION_COOKIE_SAMESITE', 'Lax'),
    SESSION_COOKIE_SECURE=os.getenv('SESSION_COOKIE_SECURE', 'False').lower() == 'true',
    SESSION_COOKIE_HTTPONLY=True,
    # Make cookies work with OAuth flow
    SESSION_COOKIE_PATH='/',
    # Increase session lifetime for OAuth flow
    PERMANENT_SESSION_LIFETIME=timedelta(minutes=5),
    # Session key prefix to avoid conflicts
    SESSION_KEY_PREFIX='bms_auth_'
)

# CORS setup
CORS_ORIGINS = [
    os.getenv("CORS_ORIGIN1", "http://localhost:5173"),
    os.getenv("CORS_ORIGIN2", "http://localhost:3000"),
    os.getenv("CORS_ORIGIN3", "http://127.0.0.1:5173"),
    os.getenv("CORS_ORIGIN4", "http://127.0.0.1:3000")
]
app.config['CORS_ORIGINS'] = CORS_ORIGINS

CORS(app, 
     origins=CORS_ORIGINS,
     supports_credentials=True,
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization"],
     expose_headers=["Set-Cookie"])

db.init_app(app)

JWT_SECRET = os.getenv('JWT_SECRET', 'dev_secret')
JWT_EXPIRY_MINUTES = int(os.getenv('JWT_EXPIRY_MINUTES', 60))

# Google OAuth Configuration
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')
GOOGLE_DISCOVERY_URL = os.getenv(
    'GOOGLE_DISCOVERY_URL',
    "https://accounts.google.com/.well-known/openid-configuration"
)

if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
    raise RuntimeError("Google OAuth credentials not configured. Check your .env file.")

# Initialize OAuth with app
oauth = OAuth(app)

# Configure Google OAuth
google = oauth.register(
    name='google',
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    server_metadata_url=GOOGLE_DISCOVERY_URL,
    client_kwargs={
        'scope': 'openid email profile',
        'prompt': 'select_account'  # Always show account selector
    },
    authorize_params={
        'access_type': 'offline'    # Get refresh token
    }
)




# ---------------- JWT Helper ----------------
def create_jwt(user):
    payload = {
        'u_id': user.u_id,
        'username': user.username,
        'email': user.email,
        'exp': datetime.utcnow() + timedelta(minutes=JWT_EXPIRY_MINUTES)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')


# ---------------- AUTH ROUTES ----------------
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    user = TblUser.query.filter_by(email=data.get('email')).first()

    if user and check_password_hash(user.password, data.get('password')):
        token = create_jwt(user)
        user.last_login = datetime.utcnow()
        db.session.commit()

        company_info = None
        if user.company:
            company_info = {
                "company_id": user.company.company_id,
                "company_name": user.company.company_name,
                "email": user.company.email,
                "is_active": user.company.is_active,
                "created_at": user.company.created_at.isoformat() if user.company.created_at else None,
            }

        return jsonify({
            'message': 'Login successful',
            'token': token,
            'u_id': user.u_id,
            'username': user.username,
            'email': user.email,
            'company': company_info
        }), 200

    return jsonify({'error': 'Invalid credentials'}), 401


@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No input data provided'}), 400

    required_fields = ("username", "email", "password")
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400

    if TblUser.query.filter(
        (TblUser.username == data['username']) | (TblUser.email == data['email'])
    ).first():
        return jsonify({'error': 'User already exists'}), 409

    # Handle company_id
    company_id = data.get("company_id")
    company = None
    if company_id:
        company = CompanyProfile.query.get(company_id)
        if not company:
            return jsonify({'error': f'Company with ID {company_id} does not exist'}), 400
    else:
        company = CompanyProfile(company_name="Default Company", email="default@company.com")
        db.session.add(company)
        db.session.flush()
        company_id = company.company_id

    hashed_pw = generate_password_hash(data['password'])
    user = TblUser(
        username=data['username'],
        email=data['email'],
        password=hashed_pw,
        company_id=company_id,
        phone=data.get('ph_no'),
        security_qn=data.get('security_qn'),
        security_ans=data.get('security_ans'),
        role=data.get('role', 'user'),
    )

    try:
        db.session.add(user)
        db.session.commit()
        token = create_jwt(user)
        company_info = {
            "company_id": company.company_id,
            "company_name": company.company_name,
            "email": company.email,
            "is_active": company.is_active,
            "created_at": company.created_at.isoformat() if company.created_at else None,
        }
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Database error', 'details': str(e)}), 500

    return jsonify({
        'message': 'User registered successfully',
        'token': token,
        'u_id': user.u_id,
        'username': user.username,
        'email': user.email,
        'company': company_info
    }), 201


@app.route('/api/auth/google')
def google_login():
    # Always use the configured redirect URI
    redirect_uri = os.getenv('OAUTH_REDIRECT_URI')
    if not redirect_uri:
        app.logger.error('OAUTH_REDIRECT_URI not configured!')
        return jsonify({"error": "OAuth configuration error"}), 500
        
    app.logger.info('Starting Google OAuth, redirect_uri=%s', redirect_uri)
    
    # Clear any existing session data
    session.clear()
    
    # Log request details
    app.logger.info('Request headers: %s', dict(request.headers))
    app.logger.info('Initial session: %s', dict(session))
    app.logger.info('Request cookies: %s', dict(request.cookies))
    
    # Create/update session
    try:
        session['oauth_initiated'] = True
        session['oauth_start_time'] = datetime.utcnow().isoformat()
        session.modified = True
        app.logger.info('Session initialized - oauth_initiated=True, time=%s', session['oauth_start_time'])
    except Exception as e:
        app.logger.error('Failed to modify session: %s', str(e))

    try:
        # Get the response with the OAuth redirect
        resp = google.authorize_redirect(redirect_uri)
        
        # Log full response details
        app.logger.info('OAuth redirect response:')
        app.logger.info('Status: %s', resp.status_code)
        app.logger.info('Headers: %s', dict(resp.headers))
        app.logger.info('Updated session after redirect: %s', dict(session))
        
        # Add CORS headers that might help with cookie handling
        resp.headers['Access-Control-Allow-Credentials'] = 'true'
        origins = app.config.get('CORS_ORIGINS', [
            "http://localhost:5173",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:3000"
        ])
        if request.headers.get('Origin') in origins:
            resp.headers['Access-Control-Allow-Origin'] = request.headers['Origin']
            
        return resp
        
    except Exception as e:
        app.logger.error('Failed to create OAuth redirect: %s', str(e))
        raise


@app.route('/api/auth/google/callback')
def google_callback():
    frontend = os.getenv('FRONTEND_URL', 'http://localhost:3000/')
    
    # Log full callback request details
    app.logger.info('OAuth callback received:')
    app.logger.info('URL: %s', request.url)
    app.logger.info('Args: %s', request.args.to_dict())
    app.logger.info('Headers: %s', dict(request.headers))
    app.logger.info('Cookies: %s', dict(request.cookies))
    
    # Get the state and code from the request
    callback_state = request.args.get('state')
    callback_code = request.args.get('code')
    
    if not callback_state or not callback_code:
        app.logger.error('Missing state or code in callback')
        return redirect(f"{frontend}/qauth?error=invalid_callback")
    
    try:
        # First attempt - try normal flow
        token = google.authorize_access_token()
        app.logger.info('Successfully obtained token through normal flow')
    except MismatchingStateError as mse:
        app.logger.warning('Initial state mismatch, attempting recovery...')
        
        try:
            # Clear any existing session
            session.clear()
            # Set the received state
            session['oauth_state'] = callback_state
            # Force session save
            session.modified = True
            
            # Try to authorize again
            token = google.authorize_access_token()
            app.logger.info('Successfully recovered from state mismatch')
        except Exception as e:
            app.logger.error('Recovery failed: %s', str(e))
            
            # If we're in development, try one last time with a fresh session
            if os.getenv('OAUTH_DEV_FALLBACK', 'False').lower() == 'true':
                try:
                    # Clear session and try one more time
                    session.clear()
                    session['oauth_state'] = callback_state
                    session.modified = True
                    
                    token = google.authorize_access_token()
                    app.logger.info('Dev fallback succeeded')
                except Exception as e:
                    app.logger.error('Dev fallback failed: %s', str(e))
                    # Instead of redirecting to a new OAuth flow, redirect with the error
                    return redirect(f"{frontend}/qauth?error=auth_failed&message={str(e)}")
            else:
                return redirect(f"{frontend}/qauth?error=auth_failed&message={str(e)}")

    if not token:
        return jsonify({"error": "Failed to get access token"}), 400

    try:
        userinfo = token.get('userinfo')
        if not userinfo:
            # Fallback to parsing ID token if userinfo not available
            userinfo = google.parse_id_token(token, nonce=session.get('nonce'))
        if not userinfo:
            return jsonify({"error": "Failed to get user info"}), 400
    except Exception as e:
        app.logger.error(f"Failed to parse user info: {str(e)}")
        return jsonify({"error": "Failed to parse user info"}), 400

    email = str(userinfo.get('email', ''))
    if not email:
        return jsonify({"error": "No email in user info"}), 400

    name = str(userinfo.get('name', ''))
    username = name if name else email.split('@')[0]

    user = TblUser.query.filter_by(email=email).first()

    if user:
        access_token = create_jwt(user)
        # ✅ Send user back to frontend OAuth success route
        redirect_url = f"http://localhost:3000/oauth-callback?token={quote_plus(access_token)}"
        app.logger.info(f"Redirecting existing user to: {redirect_url}")
        return redirect(redirect_url)
    else:
        # ✅ Redirect to register page with prefilled info
        redirect_url = f"http://localhost:3000/register?email={quote_plus(email)}&name={quote_plus(username)}"
        app.logger.info(f"Redirecting new user to: {redirect_url}")
        return redirect(redirect_url)


@app.route("/api/auth/check-email", methods=["GET"])
def check_email():
    email = request.args.get("email")
    if not email:
        return jsonify({"error": "Email required"}), 400
    user = TblUser.query.filter_by(email=email).first()
    if user:
        return jsonify({"exists": True, "user": {"u_id": user.u_id, "username": user.username, "email": user.email}}), 200
    return jsonify({"exists": False}), 200


@app.route("/api/auth/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json()
    email = data.get("email")
    if not email:
        return jsonify({"error": "Email is required"}), 400

    user = TblUser.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({"security_qn": user.security_qn}), 200


@app.route("/api/auth/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json()
    email = data.get("email")
    answer = data.get("security_ans")
    new_password = data.get("new_password")

    if not all([email, answer, new_password]):
        return jsonify({"error": "All fields are required"}), 400

    user = TblUser.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    if user.security_ans.strip().lower() != answer.strip().lower():
        return jsonify({"error": "Incorrect security answer"}), 400

    user.password = generate_password_hash(new_password)
    db.session.commit()
    return jsonify({"message": "Password reset successful"}), 200

@app.route("/api/auth/me", methods=["GET"])
@token_required
def get_me(current_user):
    """Return current logged-in user details"""
    company = None
    if current_user.company_id:
        company = CompanyProfile.query.get(current_user.company_id)

    return jsonify({
        "u_id": current_user.u_id,
        "username": current_user.username,
        "email": current_user.email,
        "ph_no": current_user.phone,
        "role": current_user.role,
        "security_qn": current_user.security_qn,
        "ip": request.remote_addr,
        "company": {
            "company_name": company.company_name if company else None,
            "email": company.email if company else None,
            "is_active": company.is_active if company else None,
        } if company else None,
    })
# ---------------- DATALOG ROUTE ----------------
@app.route("/api/datalogs", methods=["GET"])
def get_datalogs():
    start_date = request.args.get("start")
    end_date = request.args.get("end")
    battery_id = request.args.get("battery_id")

    query = db.session.query(MqttData)

    if start_date:
        try:
            query = query.filter(MqttData.ts >= datetime.fromisoformat(start_date))
        except Exception:
            pass

    if end_date:
        try:
            query = query.filter(MqttData.ts <= datetime.fromisoformat(end_date))
        except Exception:
            pass

    if battery_id and battery_id.lower() != "all":
        try:
            query = query.filter(MqttData.battery_id == int(battery_id))
        except ValueError:
            pass

    logs = query.order_by(MqttData.ts.desc()).all()
    data = [{
        "timestamp": log.ts.isoformat(sep=" ", timespec="seconds"),
        "current": str(log.current),
        "temperature": str(log.temperature),
        "voltage": str(log.voltage),
        "batteryId": str(log.battery_id)
    } for log in logs]

    return jsonify(data), 200


# ---------------- ROOT ROUTE ----------------
@app.route("/")
def home():
    return {"message": "Flask Auth Server is running."}


# ---------------- RUN APP ----------------
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(
        host=os.getenv("FLASK_RUN_HOST", "0.0.0.0"),
        port=int(os.getenv("FLASK_RUN_PORT", 8000))
    )