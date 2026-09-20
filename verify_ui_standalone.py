import time
from playwright.sync_api import sync_playwright

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.set_viewport_size({"width": 1280, "height": 800})

        page.goto("http://localhost:3000")
        page.wait_for_timeout(1000)

        # Take screenshot of Landing / Auth view
        page.screenshot(path="/home/jules/verification/screenshots/auth_v2.png")

        # Force show sidebar & daily rewards section to verify UI rendering without MongoDB
        page.evaluate("document.getElementById('sidebar').style.display = 'flex'; showSection('daily-rewards');")
        page.wait_for_timeout(500)
        page.screenshot(path="/home/jules/verification/screenshots/daily_rewards_v2.png")

        # Test cracking animation click
        page.click("#claimRewardBtn")
        page.wait_for_timeout(300)
        page.screenshot(path="/home/jules/verification/screenshots/crack_animation.png")

        # Show skins section
        page.evaluate("showSection('skins');")
        page.wait_for_timeout(500)
        page.screenshot(path="/home/jules/verification/screenshots/skins_v2.png")

        browser.close()

if __name__ == "__main__":
    main()
