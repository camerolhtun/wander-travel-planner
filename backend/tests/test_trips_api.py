"""End-to-end API tests against a real Postgres (skipped without TEST_DATABASE_URL)."""

TRIP_PAYLOAD = {
    "destination": "Barcelona",
    "start_date": "2026-12-05",
    "end_date": "2026-12-07",
    "budget_total": 900,
    "num_travelers": 1,
    "interests": ["food", "history"],
    "travel_style": "mid",
    "pace": "moderate",
}


async def _create_and_generate(client, headers):
    trip = (await client.post("/trips", json=TRIP_PAYLOAD, headers=headers)).json()
    detail = (
        await client.post(f"/trips/{trip['id']}/generate", headers=headers)
    ).json()
    return detail


async def test_generate_returns_days_and_items(client, auth_headers):
    detail = await _create_and_generate(client, auth_headers)
    assert len(detail["days"]) == 3
    assert all(len(day["items"]) >= 1 for day in detail["days"])
    assert detail["days"][0]["items"][0]["day_id"] == detail["days"][0]["id"]


async def test_list_scoped_to_user(client, auth_headers):
    await _create_and_generate(client, auth_headers)
    mine = (await client.get("/trips", headers=auth_headers)).json()
    assert len(mine) == 1
    other = (
        await client.get(
            "/trips", headers={"X-Dev-User": "22222222-2222-2222-2222-222222222222"}
        )
    ).json()
    assert other == []


async def test_unauthenticated_is_rejected(client):
    assert (await client.get("/trips")).status_code == 401


async def test_rejects_backwards_dates(client, auth_headers):
    bad = {**TRIP_PAYLOAD, "start_date": "2026-12-07", "end_date": "2026-12-05"}
    assert (await client.post("/trips", json=bad, headers=auth_headers)).status_code == 422


async def test_rejects_overlong_trip(client, auth_headers):
    bad = {**TRIP_PAYLOAD, "start_date": "2026-12-01", "end_date": "2027-01-15"}
    assert (await client.post("/trips", json=bad, headers=auth_headers)).status_code == 422


async def test_edit_item_then_regenerate_preserves_day(client, auth_headers):
    detail = await _create_and_generate(client, auth_headers)
    day1 = detail["days"][0]
    item_id = day1["items"][0]["id"]

    patched = (
        await client.patch(
            f"/items/{item_id}",
            json={"title": "Custom stop", "est_cost": 12.5},
            headers=auth_headers,
        )
    ).json()
    assert patched["title"] == "Custom stop"
    assert patched["is_user_edited"] is True

    regenerated = (
        await client.post(f"/trips/{detail['id']}/generate", headers=auth_headers)
    ).json()
    kept = next(d for d in regenerated["days"] if d["day_index"] == 1)
    assert any(i["title"] == "Custom stop" for i in kept["items"])


async def test_reorder_and_delete_item(client, auth_headers):
    detail = await _create_and_generate(client, auth_headers)
    day = detail["days"][0]
    a, b = day["items"][0], day["items"][1]

    resp = await client.post(
        "/items/reorder",
        json={
            "items": [
                {"id": b["id"], "day_id": day["id"], "sort_order": 0},
                {"id": a["id"], "day_id": day["id"], "sort_order": 1},
            ]
        },
        headers=auth_headers,
    )
    assert resp.json() == {"updated": 2}

    assert (
        await client.delete(f"/items/{a['id']}", headers=auth_headers)
    ).status_code == 204

    fresh = (await client.get(f"/trips/{detail['id']}", headers=auth_headers)).json()
    day = fresh["days"][0]
    assert day["items"][0]["id"] == b["id"]
    assert all(i["id"] != a["id"] for i in day["items"])
