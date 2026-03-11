const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
    const [key, ...val] = line.split('=');
    if (key && val) acc[key] = val.join('=').trim().replace(/[\"\']/g, '');
    return acc;
}, {});

(async () => {
    const dateStr = new Date().toISOString().split('T')[0];
    const ids = ['2', '15'];
    for (const id of ids) {
        console.log(`Checking manufactures for storage_id: ${id}`);
        const url = `https://galia-baluvana34.joinposter.com/api/storage.getManufactures?token=${env.POSTER_TOKEN}&dateFrom=${dateStr}&dateTo=${dateStr}&storage_id=${id}`;
        try {
            const res = await fetch(url);
            const data = await res.json();
            console.log(`Count for ${id}:`, data.response?.length || 0);
            if (data.response && data.response.length > 0) {
                console.log('First entry sample:');
                console.log(JSON.stringify(data.response[0], null, 2));
            }
        } catch (e) {
            console.error(e);
        }
    }
})();
