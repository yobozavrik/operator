const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });

    // 1. Login page check
    console.log('Navigating to login...');
    let page = await context.newPage();
    await page.goto('https://my.posbox.ai/login', { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'C:\\Users\\user\\.gemini\\antigravity\\brain\\c62be5f7-506a-4559-a68b-14be8de16da9\\login_page.png' });
    let html = await page.content();
    console.log('Login requires phone?', html.toLowerCase().includes('телефон') ? 'Yes' : 'No');

    // 2. Main Page
    console.log('Navigating to main page...');
    await page.goto('https://posbox.ai/', { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'C:\\Users\\user\\.gemini\\antigravity\\brain\\c62be5f7-506a-4559-a68b-14be8de16da9\\main_page.png' });

    // Extract links
    const links = await page.$$eval('a', as => as.map(a => ({ text: a.innerText.trim(), href: a.href })));
    console.log('Links found:', JSON.stringify(links.filter(l => l.text && l.href.includes('posbox')), null, 2));

    // Extract all text content
    const text = await page.evaluate(() => document.body.innerText);
    fs.writeFileSync('C:\\Users\\user\\.gemini\\antigravity\\tmp\\posbox_main.txt', text);

    await browser.close();
})();
