"""Integration tests verifying all protected routes redirect unauthenticated users.

proxy.ts (the Clerk middleware) matches /:slug/dashboard(.*)  and redirects
unauthenticated requests to / (the landing page) — not to /sign-in.  The
/post-auth route handler is not middleware-protected; it redirects to /sign-in
itself.

We use wait_until="domcontentloaded" to capture the URL immediately after the
server-side redirect, before any further client-side navigation occurs.
"""

import pytest

SLUG = "unauthenticated-test-slug"

DASHBOARD_PATHS = [
    "/dashboard",
    "/dashboard/analytics",
    "/dashboard/bookings",
    "/dashboard/leads",
    "/dashboard/chats",
    "/dashboard/settings",
    "/dashboard/billing",
    "/dashboard/organization",
    "/dashboard/notifications",
    "/dashboard/audit",
    "/dashboard/enquiries",
    "/dashboard/links",
    "/dashboard/customization",
    "/dashboard/receptionist",
]


@pytest.mark.parametrize("path", DASHBOARD_PATHS)
def test_dashboard_redirects_unauthenticated_to_landing(page, path):
    """Middleware redirects unauthenticated /{slug}/dashboard/* requests to /."""
    page.goto(f"/{SLUG}{path}", wait_until="domcontentloaded")
    # Must NOT remain at the protected path
    assert f"/{SLUG}{path}" not in page.url
    # Must land at / (or / with a hash fragment for anchor redirects)
    assert page.url.rstrip("/") in (
        "http://localhost:3000",
        "http://localhost:3000/",
    ) or page.url.startswith("http://localhost:3000/#"), (
        f"Expected redirect to / for /{SLUG}{path}, got {page.url}"
    )


def test_post_auth_redirects_to_sign_in_when_unauthenticated(page):
    """/post-auth is not middleware-protected; its route handler redirects to /sign-in."""
    page.goto("/post-auth", wait_until="domcontentloaded")
    assert "/sign-in" in page.url, f"Expected /sign-in redirect, got {page.url}"


def test_landing_page_renders_at_middleware_redirect_destination(page):
    """The landing page that unauthenticated users reach shows the marketing content."""
    page.goto(f"/{SLUG}/dashboard", wait_until="domcontentloaded")
    assert page.url.rstrip("/") in ("http://localhost:3000", "http://localhost:3000/")
    page.wait_for_selector("h1")
    assert page.get_by_text("zero missed opportunities", exact=False).count() > 0
