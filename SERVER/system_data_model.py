from models import db
from datetime import datetime

class SystemData(db.Model):
    __tablename__ = "system_data"
    id = db.Column(db.Integer, primary_key=True)
    voltage = db.Column(db.Float)
    current = db.Column(db.Float)
    temperature = db.Column(db.Float)
    timestamp = db.Column(db.DateTime)
