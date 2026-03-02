import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Create a Supabase client with the service role key to bypass RLS for this internal API if needed, 
// or use the regular client. We'll use the regular client but ensure the schema is specified.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
    db: {
        schema: 'ml_forecasting'
    }
});

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');

        let query = supabase.from('predictions').select('*');

        if (date) {
            query = query.eq('prediction_date', date);
        } else {
            // Default to tomorrow's date if no date is provided
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split('T')[0];
            query = query.eq('prediction_date', tomorrowStr);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching ML predictions:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Unexpected error in ML predictions API:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
