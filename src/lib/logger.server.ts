import { createClient as createServerSupabase } from '@/utils/supabase/server';
import { AuditAction } from './logger';

/**
 * Server-side audit log (for API routes).
 * Captures IP address from request headers.
 */
export async function serverAuditLog(
    action: AuditAction,
    target: string,
    request: Request,
    metadata?: Record<string, unknown>,
    userId?: string | null
): Promise<void> {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const entry = {
        user_id: userId ?? null,
        action,
        target,
        metadata,
        ip_address: ip,
        user_agent: userAgent,
        created_at: new Date().toISOString(),
    };

    try {
        const supabase = await createServerSupabase();
        const { error } = await supabase.from('audit_logs').insert(entry);

        if (error) {
            console.warn('[ServerAuditLog] Supabase insert failed:', error.message || error.code || JSON.stringify(error));
            console.log('[ServerAuditLog]', entry);
        }
    } catch (err: any) {
        console.error('[ServerAuditLog] Exception:', err.message || err);
        console.log('[ServerAuditLog]', entry);
    }
}
