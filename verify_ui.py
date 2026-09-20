import time
from playwright.sync_api import sync_playwright

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.set_viewport_size({"width": 1280, "height": 800})

        page.goto("http://localhost:3000")
        page.wait_for_timeout(1000)

        # Register user to test daily reward and customizer
        page.fill("#regUsername", "rewarduser")
        page.fill("#regPassword", "password123")
        page.click("#registerBtn")
        page.wait_for_timeout(1500)

        # Take screenshot of Dashboard
        page.screenshot(path="/home/jules/verification/screenshots/dashboard_v2.png")

        # Navigate to Daily Rewards
        page.click("a[data-section='daily-rewards']")
        page.wait_for_timeout(1000)
        page.screenshot(path="/home/jules/verification/screenshots/daily_rewards_v2.png")

        # Click Claim
        page.click("#claimRewardBtn")
        page.wait_for_timeout(1000)
        page.screenshot(path="/home/jules/verification/screenshots/daily_rewards_claimed.png")

        # Navigate to Skins 3D
        page.click("a[data-section='skins']")
        page.wait_for_timeout(1000)
        page.screenshot(path="/home/jules/verification/screenshots/skins_v2.png")

        browser.close()

if __name__ == "__main__":
    main()
