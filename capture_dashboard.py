import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1440, "height": 900})

        # Go to app
        await page.goto("http://localhost:3000")
        await page.wait_for_timeout(1000)

        # Log in using guest or default credentials if needed, or register/login
        # Let's check if we can log in with demo/demo or register
        # Or type credentials into login form
        username_input = page.locator("#login-username")
        password_input = page.locator("#login-password")
        login_btn = page.locator("button:has-text('Log In')")

        if await username_input.is_visible():
            await username_input.fill("testuser")
            await password_input.fill("password123")
            await login_btn.click()
            await page.wait_for_timeout(1000)

            # If login failed because user doesn't exist, try register
            reg_username = page.locator("#reg-username")
            if await reg_username.is_visible():
                await reg_username.fill("testuser")
                await page.locator("#reg-password").fill("password123")
                await page.locator("button:has-text('Register Now')").click()
                await page.wait_for_timeout(1000)

        # Wait for main dashboard to load
        await page.wait_for_timeout(2000)

        # Capture full dashboard screenshot
        await page.screenshot(path="dashboard_screenshot.png")
        print("Dashboard screenshot saved to dashboard_screenshot.png")

        # Click Wardrobe / Profile tab if present
        profile_tab = page.locator("a[data-tab='profile'], button[data-tab='profile'], .nav-item:has-text('3D Studio'), .nav-item:has-text('Wardrobe')")
        if await profile_tab.count() > 0:
            await profile_tab.first.click()
            await page.wait_for_timeout(3000) # wait for 3D skin viewer to render
            await page.screenshot(path="studio_screenshot.png")
            print("Studio screenshot saved to studio_screenshot.png")

        await browser.close()

asyncio.run(main())
