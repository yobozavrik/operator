const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
    const [key, ...val] = line.split('=');
    if (key && val) acc[key] = val.join('=').trim().replace(/[\"\']/g, '');
    return acc;
}, {});

(async () => {
    const res = await fetch(env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/?apikey=' + env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const json = await res.json();
    const tables = Object.keys(json.definitions || {});
    console.log(tables.join('\n'));
})();
