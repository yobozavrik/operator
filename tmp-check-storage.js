const https = require('https');
const POSTER_TOKEN = '526379:996915581eb0d8885af8187640385157';

async function fetchPoster(method, params = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(`https://galia-baluvana34.joinposter.com/api/${method}`);
        url.searchParams.append('token', POSTER_TOKEN);
        for (const [key, val] of Object.entries(params)) url.searchParams.append(key, val);
        https.get(url.toString(), (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
}
async function run() {
    const manufacturesData = await fetchPoster('storage.getManufactures', { dateFrom: '2026-03-10', dateTo: '2026-03-10', storage_id: '5' });
    const mfs = manufacturesData.response || [];
    let storageIds = {};
    mfs.forEach(m => {
        const sid = String(m.storage_id);
        if (!storageIds[sid]) storageIds[sid] = 0;
        storageIds[sid]++;
    });
    console.log("Storage IDs found in request with storage_id=5:");
    console.log(storageIds);
}
run();
