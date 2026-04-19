from database import db
from flask_login import UserMixin
from datetime import datetime

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(150), nullable=False)
    name = db.Column(db.String(100))
    role = db.Column(db.String(20), default='owner') # 'admin' ou 'owner'
    properties = db.relationship('Property', backref='owner', lazy=True)

class Property(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    location = db.Column(db.String(200))
    commission_rate = db.Column(db.Float, default=0.20)
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    records = db.relationship('FinancialRecord', backref='property', lazy=True)

class FinancialRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float, nullable=False)
    type = db.Column(db.String(20)) # 'revenue' ou 'expense'
    description = db.Column(db.String(200))
    date = db.Column(db.DateTime, default=datetime.utcnow)
    property_id = db.Column(db.Integer, db.ForeignKey('property.id'))