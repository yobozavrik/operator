import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Mocking some common env if needed
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

async function checkView() {
    console.log('Querying v_konditerka_distribution_stats...');
    const { data, error } = await supabase
        .schema('konditerka1')
        .from('v_konditerka_distribution_stats')
        .select('*')
        .limit(10);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Sample data:');
    console.table(data.map(r => ({
        name: r.product_name,
        spot: r.spot_name,
        stock: r.stock_now,
        id: r.product_id
    })));
}

checkView();
