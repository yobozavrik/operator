import fs from 'fs';

const supabaseUrl = 'https://supabase.dmytrotovstytskyi.online/rest/v1/';
const supabaseKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MzI0OTcwMCwiZXhwIjo0OTE4OTIzMzAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.QC9C9-CxocHb-jM-lHmXHEjEZV2hCOaSwgfxKLjKoEQ';

async function fetchSchema() {
    try {
        const response = await fetch(supabaseUrl, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            }
        });
        const data = await response.json();

        const entities = Object.keys(data.definitions || {});
        console.log("Exposed Tables/Views:");
        entities.forEach(e => console.log(e));

        fs.writeFileSync('schema_definitions.json', JSON.stringify(data.definitions, null, 2));
    } catch (e) {
        console.error(e);
    }
}

fetchSchema();
