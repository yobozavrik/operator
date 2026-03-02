const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
    const userDataDir = path.join('C:', 'Users', 'user', '.gemini', 'antigravity', 'tmp', 'posbox_profile');
    const context = await chromium.launchPersistentContext(userDataDir, {
        headless: true,
        viewport: { width: 1440, height: 900 }
    });

    const page = await context.newPage();

    console.log('Navigating to dashboard...');
    await page.goto('https://my.posbox.ai/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000); // Wait for data to load

    // Take dashboard screenshot
    await page.screenshot({ path: 'C:\\Users\\user\\.gemini\\antigravity\\brain\\c62be5f7-506a-4559-a68b-14be8de16da9\\internal_dashboard.png', fullPage: true });
    console.log('Dashboard screenshot saved.');

    // Extract sidebar links
    const navLinks = await page.$$eval('a', links => {
        return links.map(a => ({ text: a.innerText.trim(), href: a.href })).filter(l => l.href.includes('my.posbox.ai'));
    });

    fs.writeFileSync('C:\\Users\\user\\.gemini\\antigravity\\tmp\\posbox_internal_links.json', JSON.stringify(navLinks, null, 2));
    console.log('Links extracted.');

    // Extract visible text on dashboard
    const text = await page.evaluate(() => document.body.innerText);
    fs.writeFileSync('C:\\Users\\user\\.gemini\\antigravity\\tmp\\posbox_dashboard.txt', text);

    await context.close();
})();
