const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
    const [key, ...val] = line.split('=');
    if (key && val) acc[key] = val.join('=').trim().replace(/[\"\']/g, '');
    return acc;
}, {});

(async () => {
    const res = await fetch(env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/?apikey=' + env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const json = await res.json();
    const tables = Object.keys(json.definitions || {}).filter(t => !t.startsWith('v_') && !t.startsWith('mv_') && !t.startsWith('dashboard_'));
    console.log(tables);

    for (const t of tables) {
        if (t === 'documents' || t === 'document_metadata' || t === 'document_rows') continue;
        const r = await fetch(env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/' + t + '?limit=1&apikey=' + env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
        const d = await r.json();
        if (d && d.length) console.log(t, '=>', Object.keys(d[0]).join(', '));
    }
})();
