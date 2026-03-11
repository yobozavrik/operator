const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
    const [key, ...val] = line.split('=');
    if (key && val) acc[key] = val.join('=').trim().replace(/[\"\']/g, '');
    return acc;
}, {});

(async () => {
    const dateStr = new Date().toISOString().split('T')[0];
    const url = `https://galia-baluvana34.joinposter.com/api/storage.getManufactures?token=${env.POSTER_TOKEN}&dateFrom=${dateStr}&dateTo=${dateStr}`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        const manufactures = data.response || [];

        const stats = {};
        manufactures.forEach(m => {
            const sid = m.storage_id;
            const sname = m.storage_name;
            const key = `${sid}: ${sname}`;
            stats[key] = (stats[key] || 0) + 1;
        });

        console.log('Manufacture counts by storage_id:');
        console.log(JSON.stringify(stats, null, 2));
    } catch (e) {
        console.error(e);
    }
})();
