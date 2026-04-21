"""Integration tests for API endpoints.

Authenticated endpoints — expect 401 JSON when called without a session.
Public reception endpoints — expect validation errors for bad input,
and correct responses for valid input.
"""

import json
import urllib.error
import urllib.request

import pytest


# ── HTTP helpers ──────────────────────────────────────────────────────────────


def _get(base_url, path):
    try:
        resp = urllib.request.urlopen(f"{base_url}{path}")
        return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.fp.read())
        except Exception:
            return e.code, {}


def _post(base_url, path, body=None):
    data = json.dumps(body or {}).encode()
    req = urllib.request.Request(
        f"{base_url}{path}",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        resp = urllib.request.urlopen(req)
        return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.fp.read())
        except Exception:
            return e.code, {}


# ── Auth-protected endpoints return 401 ───────────────────────────────────────


@pytest.mark.parametrize("path", [
    "/api/audit",
    "/api/bookings",
    "/api/chats",
    "/api/links",
    "/api/customization",
    "/api/notifications",
    "/api/reception/config",
    "/api/reception/leads",
    "/api/bookings/settings",
])
def test_authenticated_endpoints_return_401(base_url, path):
    status, body = _get(base_url, path)
    assert status == 401, f"Expected 401 for GET {path}, got {status}. Body: {body}"
    assert body.get("ok") is False


# ── Public booking availability endpoint ─────────────────────────────────────


def test_availability_missing_slug_returns_400(base_url):
    status, body = _post(base_url, "/api/bookings/availability", {})
    assert status == 400
    assert body.get("ok") is False
    assert "slug" in body.get("error", "").lower()


def test_availability_invalid_slug_returns_404(base_url):
    status, body = _post(
        base_url, "/api/bookings/availability", {"slug": "totally-nonexistent-slug-xyz"}
    )
    assert status == 404
    assert body.get("ok") is False


def test_availability_invalid_json_returns_400(base_url):
    req = urllib.request.Request(
        f"{base_url}/api/bookings/availability",
        data=b"not-json",
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        urllib.request.urlopen(req)
        pytest.fail("Expected 400 error")
    except urllib.error.HTTPError as e:
        assert e.code == 400


def test_availability_valid_slug_returns_slots(base_url, seed_slug):
    status, body = _post(base_url, "/api/bookings/availability", {"slug": seed_slug, "limit": 3})
    assert status == 200
    assert body.get("ok") is True
    assert isinstance(body.get("slots"), list)


def test_availability_invalid_start_from_returns_400(base_url, seed_slug):
    status, body = _post(
        base_url,
        "/api/bookings/availability",
        {"slug": seed_slug, "startFrom": "not-a-date"},
    )
    assert status == 400
    assert body.get("ok") is False


# ── Public chat endpoint ───────────────────────────────────────────────────────


def test_chat_missing_fields_returns_400(base_url):
    status, body = _post(base_url, "/api/reception/chat", {})
    assert status == 400
    assert body.get("ok") is False


def test_chat_invalid_slug_returns_404(base_url):
    status, body = _post(base_url, "/api/reception/chat", {
        "slug": "nonexistent-org-xyz",
        "message": "Hello",
        "sessionId": "test-session-abc",
    })
    assert status == 404
    assert body.get("ok") is False


def test_chat_missing_message_returns_400(base_url):
    status, body = _post(base_url, "/api/reception/chat", {
        "slug": "some-slug",
        "sessionId": "test-session-abc",
    })
    assert status == 400
    assert body.get("ok") is False


def test_chat_missing_session_id_returns_400(base_url):
    status, body = _post(base_url, "/api/reception/chat", {
        "slug": "some-slug",
        "message": "Hello",
    })
    assert status == 400
    assert body.get("ok") is False


# ── Public booking creation (slug-based, no auth required) ────────────────────


def test_create_booking_missing_customer_name_returns_400(base_url):
    # customerName is validated before org lookup, so any slug works here
    status, body = _post(base_url, "/api/bookings", {"slug": "any-slug"})
    assert status == 400
    assert body.get("ok") is False


def test_create_booking_invalid_slug_returns_404(base_url):
    status, body = _post(base_url, "/api/bookings", {
        "slug": "nonexistent-org-xyz",
        "customerName": "Test User",
    })
    assert status == 404
    assert body.get("ok") is False
