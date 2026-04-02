"""
Database models and helpers for AIResume.
Uses MySQL via Flask-SQLAlchemy + PyMySQL driver.
"""

import json
from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()


class User(db.Model):
    """Registered user account."""
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    full_name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(200), unique=True, nullable=False, index=True)
    mobile = db.Column(db.String(20), nullable=True)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationship — one user has many resumes
    resumes = db.relationship("Resume", back_populates="user", lazy="dynamic", cascade="all, delete-orphan")

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "full_name": self.full_name,
            "email": self.email,
            "mobile": self.mobile,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Resume(db.Model):
    """Stored resume data for a user."""
    __tablename__ = "resumes"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    title = db.Column(db.String(200), nullable=False, default="Untitled Resume")
    resume_json = db.Column(db.Text, nullable=True)       # JSON blob of the resume builder data
    resume_text = db.Column(db.Text, nullable=True)        # Plain text extracted from uploads
    ats_score = db.Column(db.Float, nullable=True)
    category = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = db.relationship("User", back_populates="resumes")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "resume_json": self.resume_json,
            "resume_text": self.resume_text,
            "ats_score": self.ats_score,
            "category": self.category,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
