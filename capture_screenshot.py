from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1920, "height": 1080})
    page.goto("https://prium.github.io/falcon/v3.26.0/index.html")
    # Wait for any potential animations or initial data to load
    page.wait_for_timeout(3000)
    page.screenshot(path="falcon_dashboard.png", full_page=True)
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
