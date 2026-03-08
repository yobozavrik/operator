const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim();
});

const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
    try {
        // Find which table is the source of v_today_distribution
        // Because we don't know the exact names, let's query information_schema or just try standard names
        console.log("Querying data...");
        // Usually such views are created on "pizza_distribution_results" or "distribution_results"
        const { data, error } = await supabase.from('distribution_results').select('*').limit(5);
        if (error) console.error("Error distribution_results:", error.message);
        else console.log("Results from distribution_results:", data);

        const { data: d2, error: e2 } = await supabase.from('pizza_distribution_results').select('*').limit(5);
        if (e2) console.error("Error pizza_distribution_results:", e2.message);
        else console.log("Results from pizza_distribution_results:", d2);

        const { data: d3, error: e3 } = await supabase.from('v_today_distribution').select('*').limit(5);
        if (e3) console.error("Error v_today_distribution:", e3.message);
        else console.log("Results from v_today_distribution:", d3);
    } catch (e) {
        console.error(e);
    }
}
run();
