const { chromium } = require('playwright');
const path = require('path');

(async () => {
    console.log('Launching browser with persistent context...');
    const userDataDir = path.join('C:', 'Users', 'user', '.gemini', 'antigravity', 'tmp', 'posbox_profile');

    const context = await chromium.launchPersistentContext(userDataDir, {
        headless: false,
        viewport: null, // Default viewport
    });

    // We specify we want to open a new page in this context
    const pages = context.pages();
    const page = pages.length > 0 ? pages[0] : await context.newPage();

    await page.goto('https://my.posbox.ai/login');

    console.log('====================================================');
    console.log('Браузер от Playwright открыт! Пожалуйста, залогиньтесь в систему ПРЯМО В ЭТОМ ОКНЕ.');
    console.log('Окно будет висеть открытым. Как только вы войдете в дашборд и увидите свои данные:');
    console.log('ПРОСТО ЗАКРОЙТЕ ОКНО (нажмите крестик).');
    console.log('====================================================');

    // Wait until the context is closed by the user
    await new Promise(resolve => {
        context.on('close', resolve);
    });

    console.log('Браузер закрыт. Сессия сохранена.');
})();
