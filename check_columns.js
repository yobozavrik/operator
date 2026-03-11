const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
    const [key, ...val] = line.split('=');
    if (key && val) acc[key] = val.join('=').trim().replace(/[\"\']/g, '');
    return acc;
}, {});

(async () => {
    const res = await fetch(env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/temp_import?limit=1&apikey=' + env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const data = await res.json();
    if (data && data.length) console.log('temp_import:', Object.keys(data[0]).join(', '));

    const res2 = await fetch(env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/v_graviton_production_tasks?limit=1&apikey=' + env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const data2 = await res2.json();
    if (data2 && data2.length) console.log('tasks:', Object.keys(data2[0]).join(', '));

    const res3 = await fetch(env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/documents?limit=1&apikey=' + env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const data3 = await res3.json();
    if (data3 && data3.length) console.log('documents:', Object.keys(data3[0]).join(', '));

})();
