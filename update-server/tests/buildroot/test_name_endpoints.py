from otupdate.common import name_management


async def test_name_endpoint(test_cli, monkeypatch):
    async def fake_set_name(app, new_name):
        return new_name + new_name

    monkeypatch.setattr(name_management, "set_name", fake_set_name)

    # Valid:
    to_set = "check out this cool name"
    resp = await test_cli.post("/server/name", json={"name": to_set})
    assert resp.status == 200
    body = await resp.json()
    assert body["name"] == to_set + to_set
    health = await test_cli.get("/server/update/health")
    health_body = await health.json()
    assert health_body["name"] == to_set + to_set
    get_name = await test_cli.get("/server/name")
    name_body = await get_name.json()
    assert name_body["name"] == to_set + to_set

    # Invalid, field is not a str:
    resp = await test_cli.post("/server/name", json={"name": 2})
    assert resp.status == 400
    body = await resp.json()
    assert "message" in body
    health = await test_cli.get("/server/update/health")
    health_body = await health.json()
    assert health_body["name"] == to_set + to_set
    get_name = await test_cli.get("/server/name")
    name_body = await get_name.json()
    assert name_body["name"] == to_set + to_set

    # Invalid, field is missing:
    resp = await test_cli.post("/server/name", json={})
    assert resp.status == 400
    body = await resp.json()
    assert "message" in body
    health = await test_cli.get("/server/update/health")
    health_body = await health.json()
    assert health_body["name"] == to_set + to_set

    # Invalid, body is not JSON:
    resp = await test_cli.post("/server/name", data="bada bing bada boom")
    assert resp.status == 400
    body = await resp.json()
    assert "message" in body
    health = await test_cli.get("/server/update/health")
    health_body = await health.json()
    assert health_body["name"] == to_set + to_set
