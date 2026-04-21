import re
import subprocess
import sys
import time
import urllib.request
import pytest
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:3000"


def _server_is_up(url: str, timeout: int = 2) -> bool:
    try:
        urllib.request.urlopen(url, timeout=timeout)
        return True
    except Exception:
        return False


def _wait_for_server(url: str, timeout: int = 90) -> bool:
    deadline = time.time() + timeout
    while time.time() < deadline:
        if _server_is_up(url):
            return True
        time.sleep(1)
    return False


@pytest.fixture(scope="session")
def base_url():
    """Start the Next.js dev server if not already running, yield the base URL."""
    if _server_is_up(BASE_URL):
        yield BASE_URL
        return

    npm = "npm.cmd" if sys.platform == "win32" else "npm"
    proc = subprocess.Popen(
        [npm, "run", "dev"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    if not _wait_for_server(BASE_URL, timeout=90):
        proc.terminate()
        pytest.fail("Next.js dev server did not start within 90 seconds")

    yield BASE_URL

    proc.terminate()
    proc.wait(timeout=10)


@pytest.fixture(scope="session")
def _playwright():
    with sync_playwright() as p:
        yield p


@pytest.fixture(scope="session")
def browser(_playwright):
    b = _playwright.chromium.launch(headless=True)
    yield b
    b.close()


@pytest.fixture
def page(base_url, browser):
    ctx = browser.new_context(base_url=base_url)
    pg = ctx.new_page()
    yield pg
    ctx.close()


@pytest.fixture(scope="session")
def seed_slug(base_url, browser):
    """Reads the first org slug from the public /stats page (OrganizationSnapshotTable).

    The table renders slugs inside <span class="font-mono text-sm"> cells.
    Skips the test module if no organizations exist in the database.
    """
    ctx = browser.new_context(base_url=base_url)
    pg = ctx.new_page()
    pg.goto("/stats")
    pg.wait_for_load_state("networkidle")
    # Second column of the org snapshot table is the Slug column
    slug_cell = pg.locator("table tbody tr td:nth-child(2) span").first
    try:
        slug = slug_cell.inner_text(timeout=5000).strip()
    except Exception:
        slug = ""
    ctx.close()
    if not slug or not re.match(r"^[a-z0-9][a-z0-9-]+$", slug):
        pytest.skip("No seeded organizations found — run `npm run seed:demo` first")
    return slug
