const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
    const [key, ...val] = line.split('=');
    if (key && val) acc[key] = val.join('=').trim().replace(/[\"\']/g, '');
    return acc;
}, {});

(async () => {
    try {
        const url = `https://galia-baluvana34.joinposter.com/api/storage.getStorages?token=${env.POSTER_TOKEN}`;
        const res = await fetch(url);
        const data = await res.json();
        console.log('Storages:');
        console.log(JSON.stringify(data.response, null, 2));
    } catch (e) {
        console.error(e);
    }
})();
