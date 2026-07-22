import pytest  
import asyncio
from fastapi.testclient import TestClient
from beanie import init_beanie
from mongomock_motor import AsyncMongoMockClient

from app.main import app
from app.utils.jwt import get_current_user
from app.models.user import User
from app.models.analysis import Analysis
# Subscription isn't defined in the provided code, but the user requested it. Let's see if it exists.
try:
    from app.models.subscription import Subscription
    MODELS = [User, Analysis, Subscription]
except ImportError:
    MODELS = [User, Analysis]

@pytest.fixture(autouse=True, scope="session")
def init_mock_db():
    client = AsyncMongoMockClient()
    asyncio.run(init_beanie(database=client["test_db"], document_models=MODELS))

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
