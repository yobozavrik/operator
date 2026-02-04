import { supabase } from './src/lib/supabase';

async function checkMetrics() {
    const { data, error } = await supabase
        .from('dashboard_metrics')
        .select('*')
        .single();

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Data:', data);
    }
}

checkMetrics();
