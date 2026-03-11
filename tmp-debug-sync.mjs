
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const POSTER_TOKEN = process.env.POSTER_TOKEN;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function check() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    console.log("--- Supabase Shops ---");
    const { data: shops, error: shopsError } = await supabase
        .from('distribution_shops')
        .select('*')
        .schema('graviton');

    if (shopsError) {
        console.error("Shops error:", shopsError);
    } else {
        console.table(shops);
    }

    console.log("\n--- Poster Storages ---");
    const resp = await fetch(`https://galia-baluvana34.joinposter.com/api/storage.getStorages?token=${POSTER_TOKEN}`);
    const data = await resp.json();
    if (data.response) {
        const storages = data.response.map(s => ({ id: s.storage_id, name: s.storage_name }));
        console.table(storages);
    } else {
        console.error("Poster error:", data);
    }
}

check();
