from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class CompanyProfile(db.Model):
    __tablename__ = 'tbl_company_profile'
    company_id = db.Column(db.Integer, primary_key=True)
    company_name = db.Column(db.String(100), nullable=False)
    gstin = db.Column(db.String(20))
    address = db.Column(db.Text)
    geo_tag = db.Column(db.String(100))
    emergency_contact = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    email = db.Column(db.String(100))

class TblUser(db.Model):
    __tablename__ = 'tbl_user'
    u_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), nullable=False)
    password = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    ph_no = db.Column(db.String(15))
    security_qn = db.Column(db.Text)
    ip = db.Column(db.String(45))
    role = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    company_id = db.Column(db.Integer, db.ForeignKey('tbl_company_profile.company_id'))
    last_login = db.Column(db.DateTime)
    company = db.relationship('CompanyProfile', backref='users')
