const { chromium } = require('playwright');
const path = require('path');

(async () => {
    console.log('Launching browser with persistent context...');
    const userDataDir = path.join('C:', 'Users', 'user', '.gemini', 'antigravity', 'tmp', 'posbox_profile');

    const context = await chromium.launchPersistentContext(userDataDir, {
        headless: false,
        viewport: null, // Default viewport
    });

    const page = await context.newPage();
    await page.goto('https://my.posbox.ai/login');

    console.log('====================================================');
    console.log('Браузер открыт! Пожалуйста, залогиньтесь в систему.');
    console.log('Как только вы войдете в дашборд, просто закройте окно браузера.');
    console.log('После этого я смогу использовать эту сессию для аудита.');
    console.log('====================================================');

    // Script will exit automatically when the user closes the browser window (the context).
})();
