import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.utils.jwt import get_current_user
from app.models.user import User

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def mock_user():
    # A fake user for testing auth-protected routes
    user = User(
        email="test@example.com",
        hashed_password="fakehash",
        plan="vip"
    )
    user.id = "507f1f77bcf86cd799439011" # Dummy ObjectId
    return user

@pytest.fixture
def override_auth(client, mock_user):
    # Override the JWT dependency to always return our mock_user
    app.dependency_overrides[get_current_user] = lambda: mock_user
    yield
    app.dependency_overrides.clear()
