import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data, error } = await supabase.rpc('f_plan_production_ndays', { p_days: 3, p_capacity: 320 });
  console.log('Result for 320:', data ? data.slice(0, 2) : error);
  
  const { data: data2, error: error2 } = await supabase.rpc('f_plan_production_ndays', { p_days: 3, p_capacity: 500 });
  console.log('Result for 500:', data2 ? data2.slice(0, 2) : error2);
}

main();
