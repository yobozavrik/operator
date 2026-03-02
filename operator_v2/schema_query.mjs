import fs from 'fs';

const supabaseUrl = 'https://supabase.dmytrotovstytskyi.online';
const supabaseKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MzI0OTcwMCwiZXhwIjo0OTE4OTIzMzAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.QC9C9-CxocHb-jM-lHmXHEjEZV2hCOaSwgfxKLjKoEQ';

async function fetchSchema() {
    let out = "Fetching OpenAPI spec for 'categories' schema...\n";
    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Accept-Profile': 'categories'
            }
        });

        if (!response.ok) {
            out += `HTTP Error: ${response.status} ${response.statusText}\n`;
            const text = await response.text();
            out += text + '\n';
            fs.writeFileSync('categories_spec.txt', out, 'utf8');
            return;
        }

        const data = await response.json();
        const entities = Object.keys(data.definitions || {});
        out += "Exposed Tables/Views in Categories:\n";
        entities.forEach(e => out += e + '\n');

        for (const e of entities) {
            out += `\n--- ${e} ---\n`;
            const props = data.definitions[e].properties;
            if (props) {
                for (const [colName, colDef] of Object.entries(props)) {
                    // @ts-ignore
                    out += `  ${colName}: ${colDef.type || colDef.format}\n`;
                }
            } else {
                out += "  No properties found.\n";
            }
        }
        fs.writeFileSync('categories_spec.txt', out, 'utf8');
    } catch (e) {
        out += `Fetch error: ${e}\n`;
        fs.writeFileSync('categories_spec.txt', out, 'utf8');
    }
}

fetchSchema();
