const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    let page = await context.newPage();

    // Prices
    await page.goto('https://posbox.ai/prices/', { waitUntil: 'networkidle' });
    let text = await page.evaluate(() => document.body.innerText);
    fs.writeFileSync('C:\\Users\\user\\.gemini\\antigravity\\tmp\\posbox_prices.txt', text);
    await page.screenshot({ path: 'C:\\Users\\user\\.gemini\\antigravity\\brain\\c62be5f7-506a-4559-a68b-14be8de16da9\\prices_page.png' });

    // Clothes
    await page.goto('https://posbox.ai/clothes/', { waitUntil: 'networkidle' });
    text = await page.evaluate(() => document.body.innerText);
    fs.writeFileSync('C:\\Users\\user\\.gemini\\antigravity\\tmp\\posbox_clothes.txt', text);

    // Wiki
    await page.goto('https://wiki.posbox.ai/uk/home', { waitUntil: 'networkidle' });
    text = await page.evaluate(() => document.body.innerText);
    fs.writeFileSync('C:\\Users\\user\\.gemini\\antigravity\\tmp\\posbox_wiki.txt', text);
    const wikiLinks = await page.$$eval('a', as => as.map(a => ({ text: a.innerText.trim(), href: a.href })));
    fs.writeFileSync('C:\\Users\\user\\.gemini\\antigravity\\tmp\\posbox_wiki_links.json', JSON.stringify(wikiLinks, null, 2));

    await browser.close();
})();
