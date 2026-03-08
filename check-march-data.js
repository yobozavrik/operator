require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
    const { data: mv, error: err1 } = await supabase
        .schema('bakery1')
        .from('mv_craft_daily_mart')
        .select('date')
        .order('date', { ascending: false })
        .limit(1);

    const { data: dist, error: err2 } = await supabase
        .schema('bakery1')
        .from('bread_distribution_fact')
        .select('dist_date')
        .order('dist_date', { ascending: false })
        .limit(1);

    const { data: fresh, error: err3 } = await supabase
        .from('хліб_продажі_свіжі')
        .select('дата')
        .order('дата', { ascending: false })
        .limit(1);

    console.log('MAX DATE in mv_craft_daily_mart:', err1 ? err1.message : mv);
    console.log('MAX DATE in bread_distribution_fact:', err2 ? err2.message : dist);
    console.log('MAX DATE in хліб_продажі_свіжі:', err3 ? err3.message : fresh);
}

check();
