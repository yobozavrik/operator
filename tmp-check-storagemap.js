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
    const storages = await fetchPoster('storage.getStorages');
    console.log("Storages Map:");
    if (storages.response) {
        storages.response.forEach(s => {
            console.log(`- ID: ${s.storage_id} = ${s.storage_name}`);
        });
    }
}
run();
