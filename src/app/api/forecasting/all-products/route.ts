import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth-guard';

export async function GET() {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    try {
        const supabase = await createClient();

        // Fetch all products across all categories
        // We join categories.products with categories.categories to get the readable category name
        const { data: products, error: prodError } = await supabase
            .schema('categories')
            .from('products')
            .select(`
                id,
                name,
                weight_flag,
                category_id
            `);

        if (prodError) {
            console.error('Supabase products error:', prodError);
            return NextResponse.json({ error: prodError.message }, { status: 500 });
        }

        const { data: categories, error: catError } = await supabase
            .schema('categories')
            .from('categories')
            .select(`
                category_id,
                category_name
            `);

        if (catError) {
            console.error('Supabase categories error:', catError);
            return NextResponse.json({ error: catError.message }, { status: 500 });
        }

        // Map category names to products
        const catMap = new Map(categories.map(c => [c.category_id, c.category_name]));

        const mappedData = products.map((row) => ({
            код_продукту: row.id,
            назва_продукту: row.name,
            category_name: catMap.get(row.category_id) || 'Інше',
            weight_flag: row.weight_flag,
        }));

        return NextResponse.json(mappedData);
    } catch (err: any) {
        console.error('Critical API Error:', err);
        return NextResponse.json({
            error: 'Internal Server Error',
            message: err.message,
            stack: err.stack
        }, { status: 500 });
    }
}
