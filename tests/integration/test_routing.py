"""Integration tests for routing and redirects."""


def test_pricing_redirects_to_landing_hash(page):
    """/pricing should redirect to /#pricing."""
    page.goto("/pricing")
    page.wait_for_load_state("networkidle")
    assert "#pricing" in page.url


def test_404_shows_not_found_page(page):
    """A route with no matching page should render the not-found UI."""
    page.goto("/this-page-absolutely-does-not-exist")
    page.wait_for_load_state("domcontentloaded")
    assert page.get_by_text("Page not found").count() > 0
    assert page.get_by_text("This page doesn't exist").count() > 0


def test_404_has_go_home_link(page):
    page.goto("/this-page-absolutely-does-not-exist")
    page.wait_for_load_state("domcontentloaded")
    go_home = page.get_by_text("Go home")
    assert go_home.count() > 0
    assert go_home.first.get_attribute("href") == "/"


def test_404_has_cancel_redirect_button(page):
    """The 404 page shows an auto-redirect countdown and a cancel button."""
    page.goto("/this-page-absolutely-does-not-exist")
    page.wait_for_load_state("domcontentloaded")
    assert page.get_by_text("Cancel redirect").count() > 0


def test_404_countdown_text_visible(page):
    page.goto("/this-page-absolutely-does-not-exist")
    page.wait_for_load_state("domcontentloaded")
    assert page.get_by_text("Redirecting you home in", exact=False).count() > 0


def test_receptionist_path_covered_by_middleware(page, seed_slug):
    """/dashboard/receptionist is inside /:slug/dashboard(.*) so the middleware
    redirects unauthenticated users to / before the page redirect to /settings runs.
    """
    page.goto(f"/{seed_slug}/dashboard/receptionist", wait_until="domcontentloaded")
    assert f"/{seed_slug}/dashboard/receptionist" not in page.url
