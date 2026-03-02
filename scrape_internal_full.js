const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
    const userDataDir = path.join('C:', 'Users', 'user', '.gemini', 'antigravity', 'tmp', 'posbox_profile');
    const context = await chromium.launchPersistentContext(userDataDir, {
        headless: false, // Use false to ensure it uses the authenticated session properly
        viewport: { width: 1440, height: 900 }
    });

    const pages = context.pages();
    const page = pages.length > 0 ? pages[0] : await context.newPage();

    // 1. Dashboard
    console.log('Navigating to dashboard...');
    await page.goto('https://my.posbox.ai/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'C:\\Users\\user\\.gemini\\antigravity\\brain\\c62be5f7-506a-4559-a68b-14be8de16da9\\auth_dashboard.png', fullPage: true });
    const dashText = await page.evaluate(() => document.body.innerText);
    fs.writeFileSync('C:\\Users\\user\\.gemini\\antigravity\\tmp\\auth_dashboard.txt', dashText);

    // Collect all links to understand the actual routing structure
    const allLinks = await page.$$eval('a', links => links.map(a => ({ text: a.innerText.trim(), href: a.href })).filter(l => l.href.includes('my.posbox.ai')));
    fs.writeFileSync('C:\\Users\\user\\.gemini\\antigravity\\tmp\\auth_links.json', JSON.stringify(allLinks, null, 2));

    // 2. Organization (Points)
    console.log('Navigating to Organization...');
    const orgLink = allLinks.find(l => l.text.toLowerCase().includes('організація') || l.href.includes('organization'));
    if (orgLink) {
        await page.goto(orgLink.href, { waitUntil: 'networkidle' });
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'C:\\Users\\user\\.gemini\\antigravity\\brain\\c62be5f7-506a-4559-a68b-14be8de16da9\\auth_organization.png', fullPage: true });
        const orgText = await page.evaluate(() => document.body.innerText);
        fs.writeFileSync('C:\\Users\\user\\.gemini\\antigravity\\tmp\\auth_organization.txt', orgText);
    } else {
        // fallback
        await page.goto('https://my.posbox.ai/organization', { waitUntil: 'networkidle' });
        await page.waitForTimeout(3000);
        const orgText = await page.evaluate(() => document.body.innerText);
        fs.writeFileSync('C:\\Users\\user\\.gemini\\antigravity\\tmp\\auth_organization.txt', orgText);
    }

    // 3. Inventory (Items)
    console.log('Navigating to Inventory...');
    const invLink = allLinks.find(l => l.text.toLowerCase().includes('склад') || l.href.includes('inventory'));
    if (invLink) {
        await page.goto(invLink.href, { waitUntil: 'networkidle' });
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'C:\\Users\\user\\.gemini\\antigravity\\brain\\c62be5f7-506a-4559-a68b-14be8de16da9\\auth_inventory.png', fullPage: true });
        const invText = await page.evaluate(() => document.body.innerText);
        fs.writeFileSync('C:\\Users\\user\\.gemini\\antigravity\\tmp\\auth_inventory.txt', invText);
    } else {
        await page.goto('https://my.posbox.ai/inventory', { waitUntil: 'networkidle' });
        await page.waitForTimeout(3000);
        const invText = await page.evaluate(() => document.body.innerText);
        fs.writeFileSync('C:\\Users\\user\\.gemini\\antigravity\\tmp\\auth_inventory.txt', invText);
    }

    // 4. Reports
    console.log('Navigating to Reports...');
    const repLink = allLinks.find(l => l.text.toLowerCase().includes('звіти') || l.href.includes('reports') || l.href.includes('analytics'));
    if (repLink) {
        await page.goto(repLink.href, { waitUntil: 'networkidle' });
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'C:\\Users\\user\\.gemini\\antigravity\\brain\\c62be5f7-506a-4559-a68b-14be8de16da9\\auth_reports.png', fullPage: true });
        const repText = await page.evaluate(() => document.body.innerText);
        fs.writeFileSync('C:\\Users\\user\\.gemini\\antigravity\\tmp\\auth_reports.txt', repText);
    } else {
        await page.goto('https://my.posbox.ai/reports', { waitUntil: 'networkidle' });
        await page.waitForTimeout(3000);
        const repText = await page.evaluate(() => document.body.innerText);
        fs.writeFileSync('C:\\Users\\user\\.gemini\\antigravity\\tmp\\auth_reports.txt', repText);
    }

    await context.close();
})();
