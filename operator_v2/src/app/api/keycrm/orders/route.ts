import { NextResponse } from 'next/server';

const KEYCRM_API_URL = 'https://openapi.keycrm.app/v1';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = searchParams.get('limit') || '50';
        const page = searchParams.get('page') || '1';

        const token = process.env.KEYCRM_API_TOKEN;
        if (!token) {
            return NextResponse.json({ error: 'KeyCRM API token is not configured' }, { status: 500 });
        }

        const response = await fetch(`${KEYCRM_API_URL}/order?limit=${limit}&page=${page}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            // Cache settings - revalidate every 5 minutes to keep dashboard fresh but avoid rate limits
            next: { revalidate: 300 }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('KeyCRM API Error (/order):', response.status, errorText);
            return NextResponse.json({ error: 'Failed to fetch KeyCRM orders' }, { status: response.status });
        }

        const data = await response.json();

        // Structure the data to include raw KeyCRM response and some aggregations if needed
        return NextResponse.json(data);

    } catch (error: any) {
        console.error('Error in KeyCRM /orders Proxy:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
