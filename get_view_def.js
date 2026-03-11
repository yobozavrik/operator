
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const { data, error } = await supabase.rpc('exec_sql', {
        query: "SELECT view_definition FROM information_schema.views WHERE table_name = 'v_pizza_distribution_stats';"
    });

    if (error) {
        console.error('Error fetching view definition:', error);
        return;
    }

    console.log('View Definition for v_pizza_distribution_stats:');
    console.log(data?.[0]?.view_definition || 'View not found or definition unavailable.');
}

main();
