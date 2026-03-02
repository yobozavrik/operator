import { NextResponse } from 'next/server';

const KEYCRM_API_URL = 'https://openapi.keycrm.app/v1';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = searchParams.get('limit') || '50';
        const page = searchParams.get('page') || '1';

        // Can add product searching: ?filter[sku]=123
        const sku = searchParams.get('sku');

        const token = process.env.KEYCRM_API_TOKEN;
        if (!token) {
            return NextResponse.json({ error: 'KeyCRM API token is not configured' }, { status: 500 });
        }

        let url = `${KEYCRM_API_URL}/offers?limit=${limit}&page=${page}`;
        if (sku) {
            url += `&filter[sku]=${encodeURIComponent(sku)}`;
        }

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            next: { revalidate: 300 }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('KeyCRM API Error (/offers):', response.status, errorText);
            return NextResponse.json({ error: 'Failed to fetch KeyCRM offers' }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error('Error in KeyCRM /offers Proxy:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
