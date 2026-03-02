import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context()
        page = await context.new_page()
        
        print("Opening Streamline...")
        await page.goto("https://app.streamlineplan.com/")
        
        print("Waiting 180 seconds for you to log in...")
        await asyncio.sleep(180)
        
        print("Capturing data...")
        await page.screenshot(path="streamline_dashboard.png", full_page=True)
        html = await page.content()
        with open("streamline_dashboard.html", "w", encoding="utf-8") as f:
            f.write(html)
            
        print("Done! Saved as streamline_dashboard.png and streamline_dashboard.html")
        await browser.close()

asyncio.run(run())
