import { supabase } from './src/lib/supabase';

async function checkDeficit() {
    const { data, error } = await supabase
        .from('dashboard_deficit')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Sample Row:', data[0]);
    }
}

checkDeficit();
