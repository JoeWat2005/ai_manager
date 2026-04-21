"""Integration tests for the DeskCaptain landing page (/)."""

FEATURES = [
    "24/7 AI phone receptionist",
    "Intelligent web chat",
    "Instant booking confirmation",
    "Unified operations dashboard",
    "Lead qualification engine",
    "Audit log and compliance",
]


def _load(page):
    page.goto("/")
    page.wait_for_load_state("networkidle")


def test_page_loads(page):
    _load(page)
    assert page.locator("h1").count() > 0


def test_hero_headline(page):
    _load(page)
    assert "zero missed opportunities" in page.locator("h1").first.inner_text().lower()


def test_create_workspace_links_to_signup(page):
    _load(page)
    href = page.get_by_text("Create workspace").first.get_attribute("href")
    assert href == "/sign-up"


def test_view_plans_anchor(page):
    _load(page)
    href = page.get_by_text("View plans").first.get_attribute("href")
    assert href == "#pricing"


def test_all_six_features_visible(page):
    _load(page)
    page.locator("#features").scroll_into_view_if_needed()
    for feature in FEATURES:
        assert page.get_by_text(feature).count() > 0, f"Missing feature: {feature}"


def test_pricing_starter_plan(page):
    _load(page)
    page.locator("#pricing").scroll_into_view_if_needed()
    assert page.get_by_text("Starter").count() > 0
    assert page.get_by_text("£0").count() > 0


def test_pricing_pro_plan(page):
    _load(page)
    page.locator("#pricing").scroll_into_view_if_needed()
    assert page.get_by_text("Pro").count() > 0
    assert page.get_by_text("£79").count() > 0


def test_pricing_scale_plan(page):
    _load(page)
    page.locator("#pricing").scroll_into_view_if_needed()
    assert page.get_by_text("Scale").count() > 0
    # "Custom" as an exact price span — use a loose count check
    assert page.get_by_text("Custom", exact=True).count() > 0


def test_pro_plan_most_popular_badge(page):
    _load(page)
    assert page.get_by_text("Most popular").count() > 0


def test_footer_sign_in_link(page):
    _load(page)
    sign_in = page.locator("footer").get_by_text("Sign in")
    assert sign_in.count() > 0
    assert sign_in.first.get_attribute("href") == "/sign-in"


def test_cta_section_create_workspace_link(page):
    _load(page)
    # Bottom CTA section also has a "Create your workspace" button
    assert page.get_by_text("Create your workspace").count() > 0
