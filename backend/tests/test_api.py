from fastapi.testclient import TestClient

from app.main import app


def test_health() -> None:
    with TestClient(app) as client:
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}


def test_predict_regression() -> None:
    with TestClient(app) as client:
        metadata = client.get("/metadata").json()
        features = metadata["regression_features"]

        payload = {"features": {name: 0.1 for name in features}}
        response = client.post("/predict/regression", json=payload)

        assert response.status_code == 200
        body = response.json()
        assert "prediction" in body


def test_predict_classification() -> None:
    with TestClient(app) as client:
        metadata = client.get("/metadata").json()
        features = metadata["classification_features"]

        payload = {"features": {name: 0.1 for name in features}}
        response = client.post("/predict/classification", json=payload)

        assert response.status_code == 200
        body = response.json()
        assert "label" in body
        assert "probability" in body
