"""Integration tests for sign-in and sign-up pages."""


def test_sign_in_heading(page):
    page.goto("/sign-in")
    page.wait_for_selector("h1")
    assert page.get_by_text("Welcome back").count() > 0


def test_sign_in_description(page):
    page.goto("/sign-in")
    page.wait_for_selector("h1")
    assert page.get_by_text("Sign in to manage your bookings").count() > 0


def test_sign_in_sidebar_features(page):
    """AuthShell sidebar lists feature bullets on large screens."""
    page.set_viewport_size({"width": 1280, "height": 800})
    page.goto("/sign-in")
    page.wait_for_selector("h1")
    assert page.get_by_text("24/7 AI phone receptionist").count() > 0


def test_sign_up_heading(page):
    page.goto("/sign-up")
    page.wait_for_selector("h1")
    assert page.get_by_text("Create your account").count() > 0


def test_sign_up_description(page):
    page.goto("/sign-up")
    page.wait_for_selector("h1")
    assert page.get_by_text("Set up your workspace").count() > 0


def test_auth_pages_link_back_to_home(page):
    """Logo in AuthShell should link back to the landing page."""
    page.goto("/sign-in")
    page.wait_for_selector("h1")
    home_links = page.locator('a[href="/"]')
    assert home_links.count() > 0
