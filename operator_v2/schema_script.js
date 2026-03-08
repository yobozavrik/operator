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
            let content = fs.readFileSync(fullPath, 'utf-8');

            // Replaces "from('v_konditerka_...')" with "from('konditerka1.v_konditerka_...')"
            // Note: Supabase `.from()` usually just takes the table name if it's in public. 
            // Better practice when crossing schemas is providing the schema via `.schema('konditerka1').from('v_konditerka_...')`
            content = content
                .replace(/\.from\('v_konditerka_/g, ".schema('konditerka1').from('v_konditerka_")
                .replace(/\.from\('konditerka1\.v_konditerka_/g, ".schema('konditerka1').from('v_konditerka_"); // safety catch

            fs.writeFileSync(fullPath, content);
            console.log('Fixed schema referencing in', fullPath);
        }
    }
}

walk(dir);
