import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data: cols, error: colErr } = await supabase.rpc('exec_sql', {
        query: `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'excel_продажі'
    `});

    if (colErr) console.error("Col Error:", colErr);
    else console.log("excel_продажі Columns:", cols);

    const { data: sample, error: sampErr } = await supabase.rpc('exec_sql', {
        query: `
        SELECT * FROM public."excel_продажі" 
        WHERE "Категорії" ILIKE '%піц%' 
        LIMIT 1
    `});

    if (sampErr) console.error("Samp Error:", sampErr);
    else console.log("Sample Pizza Row:", sample);
}

run().catch(console.error);
