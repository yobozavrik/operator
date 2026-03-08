const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'app', 'api', 'konditerka');

function walk(directory) {
    const files = fs.readdirSync(directory);
    for (const file of files) {
        const fullPath = path.join(directory, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else if (fullPath.endsWith('.ts')) {
            // Skip the ones we already fixed manually
            if (fullPath.includes('orders') || fullPath.includes('summary') || fullPath.includes('update-stock')) {
                continue;
            }

            let content = fs.readFileSync(fullPath, 'utf-8');
            content = content
                .replace(/v_pizza_/g, 'v_konditerka_')
                .replace(/pizza-dashboard/g, 'konditerka-dashboard')
                .replace(/\/pizza\//g, '/konditerka/')
                .replace(/Pizza/g, 'Konditerka')
                .replace(/Піца/g, 'Кондитерка')
                .replace(/pizza1\./g, 'konditerka1.');

            fs.writeFileSync(fullPath, content);
            console.log('Processed', fullPath);
        }
    }
}

walk(dir);
