import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://supabase.dmytrotovstytskyi.online';
const supabaseKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MzI0OTcwMCwiZXhwIjo0OTE4OTIzMzAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.QC9C9-CxocHb-jM-lHmXHEjEZV2hCOaSwgfxKLjKoEQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function sampleData() {
    const tables = ['dashboard_metrics', 'v_pub_analytics', 'v_pizza_summary_stats', 'document_rows'];
    let output = '';

    for (const t of tables) {
        output += `\n--- Table: ${t} ---\n`;
        const { data, error } = await supabase.from(t).select('*').limit(1);
        if (error) {
            output += `Error: ${JSON.stringify(error)}\n`;
        } else {
            output += JSON.stringify(data[0], null, 2) + '\n';
        }
    }
    fs.writeFileSync('db_sample.txt', output, 'utf8');
}

sampleData();
