import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            process.env.SUPABASE_SERVICE_ROLE_KEY || ''
        );

        const { data, error } = await supabase.rpc('exec_sql', {
            query: `
                SELECT 
                    ds.spot_id, 
                    ds.storage_id, 
                    sp.name as spot_name,
                    ds.is_active
                FROM graviton.distribution_shops ds
                JOIN categories.spots sp ON sp.spot_id = ds.spot_id
                WHERE ds.is_active = true
                ORDER BY sp.name ASC
            `
        });

        if (error) throw error;

        return NextResponse.json({
            success: true,
            shops: data || []
        });

    } catch (err: any) {
        console.error('Shops fetch error:', err);
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        );
    }
}
