"""Integration tests for the public /stats page."""


def _load(page):
    page.goto("/stats")
    page.wait_for_load_state("networkidle")


def test_stats_page_loads(page):
    _load(page)
    assert page.locator("h1").count() > 0


def test_stats_main_heading(page):
    _load(page)
    assert page.get_by_text("Live signup and usage totals").count() > 0


def test_stats_label(page):
    _load(page)
    assert page.get_by_text("Deskcaptain Stats").count() > 0


def test_stats_back_to_landing_link(page):
    _load(page)
    link = page.get_by_text("Back to Landing")
    assert link.count() > 0
    assert link.first.get_attribute("href") == "/"


def test_stats_shows_user_count_stat(page):
    _load(page)
    assert page.get_by_text("Total Signups (Users)").count() > 0


def test_stats_shows_org_count_stat(page):
    _load(page)
    assert page.get_by_text("Organizations").count() > 0


def test_stats_shows_membership_stat(page):
    _load(page)
    assert page.get_by_text("Memberships").count() > 0


def test_stats_shows_paid_effective_card(page):
    _load(page)
    assert page.get_by_text("Paid-effective organizations").count() > 0


def test_stats_shows_free_effective_card(page):
    _load(page)
    assert page.get_by_text("Free-effective organizations").count() > 0


def test_stats_shows_tracked_subscriptions_card(page):
    _load(page)
    assert page.get_by_text("Tracked subscriptions").count() > 0


def test_stats_org_snapshot_section(page):
    _load(page)
    assert page.get_by_text("Organization snapshot").count() > 0


def test_stats_org_snapshot_description(page):
    _load(page)
    assert page.get_by_text("First 12 organizations").count() > 0
