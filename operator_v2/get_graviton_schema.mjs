import fs from 'fs';

const supabaseUrl = 'https://supabase.dmytrotovstytskyi.online';
const supabaseKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MzI0OTcwMCwiZXhwIjo0OTE4OTIzMzAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.QC9C9-CxocHb-jM-lHmXHEjEZV2hCOaSwgfxKLjKoEQ';

async function fetchSchema() {
    console.log("Fetching OpenAPI spec for 'graviton' schema...");
    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Accept-Profile': 'graviton'
            }
        });

        if (!response.ok) {
            console.error(`HTTP Error: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error(text);
            return;
        }

        const data = await response.json();
        fs.writeFileSync('graviton_schema_dump.json', JSON.stringify(data, null, 2), 'utf8');
        console.log("Successfully saved schema to graviton_schema_dump.json");
    } catch (e) {
        console.error(`Fetch error: ${e}`);
    }
}

fetchSchema();
