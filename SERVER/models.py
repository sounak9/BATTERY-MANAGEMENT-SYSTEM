from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


class CompanyProfile(db.Model):
    __tablename__ = "tbl_company_profile"

    company_id = db.Column(db.Integer, primary_key=True)
    company_name = db.Column(db.String(100), nullable=False)
    gstin = db.Column(db.String(20))
    address = db.Column(db.Text)
    geo_tag = db.Column(db.String(100))
    emergency_contact = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    email = db.Column(db.String(100))

    users = db.relationship("TblUser", back_populates="company", cascade="all, delete-orphan")
    products = db.relationship("Product", back_populates="company", cascade="all, delete-orphan")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)


class TblUser(db.Model):
    __tablename__ = "tbl_user"

    u_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), nullable=False, unique=True)
    password = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    phone = db.Column(db.String(15))
    security_qn = db.Column(db.Text)
    security_ans = db.Column(db.String(255))
    # ip = db.Column(db.String(50))
    role = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    company_id = db.Column(db.Integer, db.ForeignKey("tbl_company_profile.company_id"))
    last_login = db.Column(db.DateTime)

    company = db.relationship("CompanyProfile", back_populates="users")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)


class Product(db.Model):
    __tablename__ = "product"

    product_sl_no = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey("tbl_company_profile.company_id"))
    total_capacity = db.Column(db.Numeric)
    total_voltage = db.Column(db.Numeric)
    no_of_batt = db.Column(db.Integer)
    batt_type = db.Column(db.String(50))
    subscription_type = db.Column(db.String(50))
    firmware_version = db.Column(db.String(50))

    company = db.relationship("CompanyProfile", back_populates="products")
    batt_descriptions = db.relationship("BattDescription", back_populates="product", cascade="all, delete-orphan")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)


class BattDescription(db.Model):
    __tablename__ = "batt_description"

    batt_uid = db.Column(db.Integer, primary_key=True)
    product_sl_no = db.Column(db.Integer, db.ForeignKey("product.product_sl_no"))
    batt_voltage = db.Column(db.Numeric)
    batt_capacity = db.Column(db.Numeric)
    batt_temp = db.Column(db.Numeric)
    batt_mfg_date = db.Column(db.Date)
    batt_install_date = db.Column(db.Date)
    is_warranty = db.Column(db.Boolean, default=False)
    status = db.Column(db.String(50))

    product = db.relationship("Product", back_populates="batt_descriptions")
    health_logs = db.relationship("BattHealth", back_populates="battery", cascade="all, delete-orphan")
    fault_logs = db.relationship("BattFaultLog", back_populates="battery", cascade="all, delete-orphan")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)


class BattHealth(db.Model):
    __tablename__ = "batt_health"

    measurement_id = db.Column(db.Integer, primary_key=True)
    batt_uid = db.Column(db.Integer, db.ForeignKey("batt_description.batt_uid"))
    batt_volt = db.Column(db.Numeric)
    batt_current = db.Column(db.Numeric)
    batt_temp = db.Column(db.Numeric)
    soc = db.Column(db.Numeric)
    position = db.Column(db.String(50))
    batt_remaining_time = db.Column(db.Interval)
    batt_severity = db.Column(db.String(50))

    battery = db.relationship("BattDescription", back_populates="health_logs")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)


class BattFaultLog(db.Model):
    __tablename__ = "batt_fault_log"

    fault_id = db.Column(db.Integer, primary_key=True)
    batt_uid = db.Column(db.Integer, db.ForeignKey("batt_description.batt_uid"))
    fault_type = db.Column(db.String(100))
    detected_at = db.Column(db.DateTime, default=datetime.utcnow)
    severity = db.Column(db.String(50))
    predicted_by = db.Column(db.String(50))
    resolve_text = db.Column(db.Text)
    note = db.Column(db.Text)

    battery = db.relationship("BattDescription", back_populates="fault_logs")

class MqttData(db.Model):
    __tablename__ = "mqtt_data"

    id = db.Column(db.Integer, primary_key=True)
    ts = db.Column(db.DateTime(timezone=True), nullable=False)
    topic = db.Column(db.Text)
    device_id = db.Column(db.Text)
    battery_id = db.Column(db.Integer)
    voltage = db.Column(db.Numeric(6, 3))
    current = db.Column(db.Numeric(8, 3))
    temperature = db.Column(db.Numeric(6, 3))
    payload_json = db.Column(db.JSON)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)