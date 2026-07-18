def test_analyze_image_unauthorized(client):
    # Should fail without auth override
    with open("requirements.txt", "rb") as f:
        response = client.post("/api/analyze/image", files={"file": f})
    assert response.status_code == 401

def test_analyze_image_wrong_file_type(client, override_auth):
    # Pass a txt file to image endpoint
    with open("requirements.txt", "rb") as f:
        response = client.post("/api/analyze/image", files={"file": ("req.txt", f, "text/plain")})
    assert response.status_code == 400
    assert "must be an image" in response.json()["detail"]

def test_analyze_text_success_mocked(client, override_auth, mocker):
    # We mock the Beanie save/insert methods and the ML predict_text
    mocker.patch("app.models.analysis.Analysis.insert")
    mocker.patch("app.models.analysis.Analysis.save")
    mocker.patch("app.models.user.User.save")
    mocker.patch("app.routers.analyze.predict_text", return_value={"verdict": "human_made", "confidence": 0.9})
    
    response = client.post("/api/analyze/text", json={"text": "This is a normal human sentence."})
    assert response.status_code == 200
    data = response.json()
    assert "analysis_id" in data
    assert data["status"] in ["processing", "completed"] # depends on thread scheduling
