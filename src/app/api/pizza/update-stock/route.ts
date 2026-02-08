import { NextRequest, NextResponse } from 'next/server';

// Same webhook URLs as Graviton dashboard
const WEBHOOK_URLS = [
    'http://localhost:5678/webhook-test/pizza1',
    'https://n8n.dmytrotovstytskyi.online/webhook/pizza1'
];

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        console.log('[Pizza Stock Update] Triggering n8n webhook...', body);

        // Call both webhooks in parallel (same as Graviton)
        const results = await Promise.allSettled(
            WEBHOOK_URLS.map(url =>
                fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'refresh_stock',
                        source: 'pizza-dashboard',
                        timestamp: body.timestamp || new Date().toISOString()
                    })
                })
            )
        );

        // Check if at least one request was successful
        const hasSuccess = results.some(r => r.status === 'fulfilled' && r.value.ok);

        if (hasSuccess) {
            console.log('[Pizza Stock Update] Webhook success');

            // Wait 4 seconds for data to update (same as Graviton)
            await new Promise(resolve => setTimeout(resolve, 4000));

            return NextResponse.json({
                success: true,
                message: 'Stock update triggered successfully'
            });
        } else {
            console.error('[Pizza Stock Update] All webhooks failed:', results);
            return NextResponse.json(
                { success: false, error: 'All webhooks failed' },
                { status: 502 }
            );
        }

    } catch (error) {
        console.error('[Pizza Stock Update] Error:', error);
        return NextResponse.json(
            { success: false, error: String(error) },
            { status: 500 }
        );
    }
}
