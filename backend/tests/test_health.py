from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health() -> None:
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_trips_requires_auth() -> None:
    resp = client.get("/trips")
    assert resp.status_code == 401
