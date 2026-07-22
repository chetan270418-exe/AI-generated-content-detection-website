from unittest.mock import patch, AsyncMock

def test_signup_validation(client):
    # Test invalid email
    response = client.post("/api/auth/signup", json={"email": "not-an-email", "password": "password123"})
    assert response.status_code == 422 # Unprocessable Entity

def test_signup_short_password(client):
    # Test short password
    response = client.post("/api/auth/signup", json={"email": "test@example.com", "password": "short"})
    assert response.status_code == 422

@patch("app.routers.auth.User.find_one", new_callable=AsyncMock)
def test_signup_duplicate_email(mock_find_one, client):
    # Mock finding an existing user
    mock_find_one.return_value = {"email": "test@example.com"}
    response = client.post("/api/auth/signup", json={"email": "test@example.com", "password": "password123"})
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]
