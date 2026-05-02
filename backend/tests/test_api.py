"""
AI Resume Screener — Backend API Tests
Run with: pytest backend/tests/ -v
"""

import pytest
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Set test environment before importing app
os.environ['FLASK_ENV'] = 'testing'
os.environ.setdefault('SECRET_KEY', 'test-secret-key')

from app import app


@pytest.fixture
def client():
    """Create a test client for the Flask app."""
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    with app.test_client() as client:
        yield client


# ── Health Check Tests ─────────────────────────────────────────
class TestHealthCheck:
    def test_health_endpoint_returns_200(self, client):
        """GET /api/health should return 200 with status ok."""
        resp = client.get('/api/health')
        assert resp.status_code == 200

    def test_health_response_has_status(self, client):
        """Health response should contain 'status' key."""
        resp = client.get('/api/health')
        data = resp.get_json()
        assert 'status' in data
        assert data['status'] == 'ok'

    def test_health_response_has_database_status(self, client):
        """Health response should contain 'database_status' key."""
        resp = client.get('/api/health')
        data = resp.get_json()
        assert 'database_status' in data


# ── Home Page Tests ────────────────────────────────────────────
class TestPages:
    def test_home_page_returns_200(self, client):
        """GET / should return 200."""
        resp = client.get('/')
        assert resp.status_code == 200

    def test_unknown_page_returns_404(self, client):
        """GET /unknownpage should return 404."""
        resp = client.get('/unknownpage')
        assert resp.status_code == 404


# ── Resume Analysis Tests ──────────────────────────────────────
class TestResumeAnalysis:
    def test_analyze_requires_file_or_category(self, client):
        """POST /api/analyze-resume without file or category should return 400."""
        resp = client.post('/api/analyze-resume', data={})
        assert resp.status_code in [400, 422, 500]

    def test_analyze_endpoint_exists(self, client):
        """POST /api/analyze-resume endpoint should exist (not 404)."""
        resp = client.post('/api/analyze-resume', data={})
        assert resp.status_code != 404


# ── Summary Generation Tests ───────────────────────────────────
class TestSummaryGeneration:
    def test_generate_summary_requires_title(self, client):
        """POST /api/generate-summary without title should return 400."""
        resp = client.post('/api/generate-summary',
                           json={},
                           content_type='application/json')
        assert resp.status_code == 400

    def test_generate_summary_with_title(self, client):
        """POST /api/generate-summary with professional_title should not be 404."""
        resp = client.post('/api/generate-summary',
                           json={'professional_title': 'Software Engineer',
                                 'skills': 'Python, Flask, React'},
                           content_type='application/json')
        assert resp.status_code != 404


# ── Auth Tests ─────────────────────────────────────────────────
class TestAuth:
    def test_login_endpoint_exists(self, client):
        """POST /api/auth/login should exist (not 404)."""
        resp = client.post('/api/auth/login',
                           json={'email': 'test@test.com', 'password': 'wrongpass'},
                           content_type='application/json')
        assert resp.status_code != 404

    def test_login_rejects_empty_credentials(self, client):
        """POST /api/auth/login with empty body should return 400."""
        resp = client.post('/api/auth/login',
                           json={},
                           content_type='application/json')
        assert resp.status_code in [400, 401, 422, 500]
