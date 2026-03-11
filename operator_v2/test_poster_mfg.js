const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim();
});
const POSTER_TOKEN = env.POSTER_TOKEN;
const POSTER_ACCOUNT = 'galia-baluvana34';

async function posterRequest(method, params = {}) {
    const url = new URL(`https://${POSTER_ACCOUNT}.joinposter.com/api/${method}`);
    url.searchParams.append('token', POSTER_TOKEN);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

    const response = await fetch(url.toString());
    const data = await response.json();
    return data;
}

async function run() {
    const dateStr = new Date().toISOString().split('T')[0];
    const data = await posterRequest('storage.getManufactures', { dateFrom: dateStr, dateTo: dateStr });
    console.log(JSON.stringify((data.response || []).slice(0, 2), null, 2));
}
run();
