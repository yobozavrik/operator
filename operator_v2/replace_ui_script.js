const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'app', 'dashboard', 'galya-baluvana', 'konditerka');

function walk(directory) {
    const files = fs.readdirSync(directory);
    for (const file of files) {
        const fullPath = path.join(directory, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {

            let content = fs.readFileSync(fullPath, 'utf-8');
            content = content
                .replace(/PizzaDashboardPage/g, 'KonditerkaDashboardPage')
                .replace(/\/api\/pizza/g, '/api/konditerka')
                .replace(/Піца Дашборд/g, 'Кондитерка Дашборд')
                .replace(/Завантаження піци/g, 'Завантаження кондитерки')
                .replace(/transformPizzaData/g, 'transformKonditerkaData')
                .replace(/v_pizza_/g, 'v_konditerka_');

            fs.writeFileSync(fullPath, content);
            console.log('Processed', fullPath);
        }
    }
}

walk(dir);
