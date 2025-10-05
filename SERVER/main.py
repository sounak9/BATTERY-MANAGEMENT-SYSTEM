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

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'secret!')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
# Session cookie settings
# Configure session cookie behavior. For local development we want cookies
# to be sent on the OAuth redirect back from Google. Use environment vars to
# control these values. If SESSION_COOKIE_SAMESITE is set to the string
# 'None' we treat it as Python None.
samesite = os.getenv('SESSION_COOKIE_SAMESITE', 'Lax')
if samesite == 'None':
    samesite = None
app.config['SESSION_COOKIE_SAMESITE'] = samesite
app.config['SESSION_COOKIE_SECURE'] = os.getenv('SESSION_COOKIE_SECURE', 'False').lower() == 'true'
# Recommend HttpOnly for session cookies
app.config['SESSION_COOKIE_HTTPONLY'] = True

# CORS
CORS(app, origins=[
    os.getenv("CORS_ORIGIN1", "http://localhost:5173"),
    os.getenv("CORS_ORIGIN2", "http://localhost:3000"),
    os.getenv("CORS_ORIGIN3", "http://127.0.0.1:5173"),
    os.getenv("CORS_ORIGIN4", "http://127.0.0.1:3000")
], supports_credentials=True,
   methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
   allow_headers=["Content-Type", "Authorization"])

db.init_app(app)

JWT_SECRET = os.getenv('JWT_SECRET', 'dev_secret')
JWT_EXPIRY_MINUTES = int(os.getenv('JWT_EXPIRY_MINUTES', 60))

# Google OAuth
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')
GOOGLE_DISCOVERY_URL = os.getenv(
    'GOOGLE_DISCOVERY_URL',
    "https://accounts.google.com/.well-known/openid-configuration"
)

oauth = OAuth(app)
google = oauth.register(
    name='google',
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    server_metadata_url=GOOGLE_DISCOVERY_URL,
    client_kwargs={'scope': 'openid email profile'}
)

if google is None:
    raise RuntimeError("Google OAuth registration failed. Check your environment variables.")


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
    redirect_uri = os.getenv('OAUTH_REDIRECT_URI') or url_for('google_callback', _external=True)
    app.logger.debug('Starting Google OAuth, redirect_uri=%s', redirect_uri)
    try:
        app.logger.debug('Session before redirect: %s', dict(session))
    except Exception:
        app.logger.debug('Session not serializable for logging')
    return google.authorize_redirect(redirect_uri)


@app.route('/api/auth/google/callback')
def google_callback():
    frontend = os.getenv('FRONTEND_URL', 'http://localhost:3000')
    try:
        token = google.authorize_access_token()
    except MismatchingStateError as mse:
        # Log details for debugging
        app.logger.warning('MismatchingStateError during OAuth callback: %s', mse)
        app.logger.debug('Callback request args: %s', request.args.to_dict())
        try:
            app.logger.debug('Session at callback: %s', dict(session))
        except Exception:
            app.logger.debug('Session not serializable for logging')

        # Developer convenience: optionally allow a fallback to accept the
        # returned state and retry the token exchange. THIS WEAKENS CSRF
        # PROTECTION and should only be enabled for local development.
        if os.getenv('OAUTH_DEV_FALLBACK', 'False').lower() == 'true':
            fallback_state = request.args.get('state')
            if fallback_state:
                app.logger.warning('Applying OAUTH_DEV_FALLBACK: setting session oauth_state=%s', fallback_state)
                session['oauth_state'] = fallback_state
            try:
                token = google.authorize_access_token()
            except Exception as e:
                app.logger.exception('Fallback token exchange failed: %s', e)
                return redirect(f"{frontend}/qauth?error=oauth_state_mismatch")
        else:
            # Redirect to QAuth with error
            return redirect(f"{frontend}/qauth?error=oauth_state_mismatch")

    if not token:
        return jsonify({"error": "Failed to get access token"}), 400

    userinfo = google.parse_id_token(token)
    if not userinfo:
        return jsonify({"error": "Failed to parse user info"}), 400

    email = userinfo.get('email')
    username = userinfo.get('name', email.split('@')[0])
    user = TblUser.query.filter_by(email=email).first()

    if user:
        access_token = create_jwt(user)
        # Redirect to QAuth with JWT token
        return redirect(f"{frontend}/qauth?token={quote_plus(access_token)}")
    else:
        # Redirect to register page with prefilled email & name
        return redirect(f"{frontend}/register?email={quote_plus(email)}&name={quote_plus(username)}")


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
