import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data: spots, error: spotsError } = await supabase.rpc('exec_sql', {
        query: `
        SELECT spot_id, name
        FROM categories.spots
        WHERE name IN ('Кварц', 'Руська', 'Садгора', 'Хотинська', 'Компас', 'Білоруська', 'Гравітон')
        ORDER BY spot_id
    `});

    if (spotsError) console.error("Spots Error:", spotsError);
    else console.log("Matching Spots:", spots);

    const { data: storages, error: storagesError } = await supabase.rpc('exec_sql', {
        query: `
        SELECT storage_id, storage_name
        FROM categories.storages
        WHERE storage_name ILIKE '%Кварц%'
           OR storage_name ILIKE '%Руська%'
           OR storage_name ILIKE '%Садгора%'
           OR storage_name ILIKE '%Хотинська%'
           OR storage_name ILIKE '%Компас%'
           OR storage_name ILIKE '%Білоруська%'
           OR storage_name ILIKE '%Гравітон%'
        ORDER BY storage_id
    `});

    if (storagesError) console.error("Storages Error:", storagesError);
    else console.log("Matching Storages:", storages);

    // Also, verify mapping in transactions using the old spot_id=3 vs spot_id=1 for 'Кварц'
    const { data: tx, error: txError } = await supabase.rpc('exec_sql', {
        query: `
        SELECT t.spot_id, COUNT(*) as tx_count
        FROM categories.transactions t
        WHERE t.date_close >= CURRENT_DATE - INTERVAL '1 days'
          AND t.spot_id IN (1, 3, 5, 6, 10, 16, 17, 20)
        GROUP BY t.spot_id
    `});

    if (txError) console.error("TX Error:", txError);
    else console.log("Transactions per spot:", tx);
}

run().catch(console.error);
