"""Integration tests for public org pages: /{slug}/landing and /{slug}/links."""

import pytest

INVALID_SLUG = "this-org-absolutely-does-not-exist-xyz123"


# ── Landing page ─────────────────────────────────────────────────────────────


def test_landing_page_loads(page, seed_slug):
    page.goto(f"/{seed_slug}/landing")
    page.wait_for_load_state("networkidle")
    assert page.locator("h1").count() > 0


def test_landing_shows_org_name_in_header(page, seed_slug):
    page.goto(f"/{seed_slug}/landing")
    page.wait_for_load_state("networkidle")
    header = page.locator("header").first
    # Org name is displayed as uppercase small label in the header
    assert header.locator("p").count() > 0


def test_landing_live_workspace_badge(page, seed_slug):
    page.goto(f"/{seed_slug}/landing")
    page.wait_for_load_state("networkidle")
    assert page.get_by_text("Live workspace").count() > 0


def test_landing_coverage_card(page, seed_slug):
    page.goto(f"/{seed_slug}/landing")
    page.wait_for_load_state("networkidle")
    assert page.get_by_text("Coverage").count() > 0
    assert page.get_by_text("24/7 inbound").count() > 0


def test_landing_phone_card(page, seed_slug):
    page.goto(f"/{seed_slug}/landing")
    page.wait_for_load_state("networkidle")
    assert page.get_by_text("Phone extension").count() > 0


def test_landing_concierge_card(page, seed_slug):
    page.goto(f"/{seed_slug}/landing")
    page.wait_for_load_state("networkidle")
    assert page.get_by_text("AI concierge").count() > 0


def test_landing_need_something_else_card(page, seed_slug):
    page.goto(f"/{seed_slug}/landing")
    page.wait_for_load_state("networkidle")
    assert page.get_by_text("Need something else?").count() > 0


def test_landing_dashboard_link_in_header(page, seed_slug):
    page.goto(f"/{seed_slug}/landing")
    page.wait_for_load_state("networkidle")
    dashboard_link = page.get_by_text("Dashboard")
    assert dashboard_link.count() > 0
    assert dashboard_link.first.get_attribute("href") == f"/{seed_slug}/dashboard"


def test_landing_recording_disclosure_badge(page, seed_slug):
    page.goto(f"/{seed_slug}/landing")
    page.wait_for_load_state("networkidle")
    assert page.get_by_text("Recording disclosure enabled").count() > 0


def test_landing_invalid_slug_shows_404(page):
    page.goto(f"/{INVALID_SLUG}/landing")
    page.wait_for_load_state("domcontentloaded")
    assert page.get_by_text("Page not found").count() > 0


# ── Links page ────────────────────────────────────────────────────────────────


def test_links_page_loads(page, seed_slug):
    page.goto(f"/{seed_slug}/links")
    page.wait_for_load_state("networkidle")
    assert page.locator("h1").count() > 0


def test_links_page_has_title(page, seed_slug):
    page.goto(f"/{seed_slug}/links")
    page.wait_for_load_state("networkidle")
    # Links page renders the linksTitle as h1
    assert page.locator("h1").first.inner_text().strip() != ""


def test_links_page_has_bio(page, seed_slug):
    page.goto(f"/{seed_slug}/landing")
    page.wait_for_load_state("networkidle")
    # Org has a bio set from seed — ensure there is some description text
    assert page.locator("main p").count() > 0


def test_links_back_link_exists(page, seed_slug):
    page.goto(f"/{seed_slug}/links")
    page.wait_for_load_state("networkidle")
    back = page.get_by_text("Back to", exact=False)
    assert back.count() > 0
    assert back.first.get_attribute("href") == f"/{seed_slug}/landing"


def test_links_shows_link_buttons_or_empty_state(page, seed_slug):
    """Either seeded link buttons or the 'no public links' message must appear."""
    page.goto(f"/{seed_slug}/links")
    page.wait_for_load_state("networkidle")
    has_links = page.locator("a[href]").count() > 2  # >2 to exclude nav links
    has_empty = page.get_by_text("No public links have been published yet").count() > 0
    assert has_links or has_empty, "Links page should show links or the empty-state message"


def test_links_invalid_slug_shows_404(page):
    page.goto(f"/{INVALID_SLUG}/links")
    page.wait_for_load_state("domcontentloaded")
    assert page.get_by_text("Page not found").count() > 0
