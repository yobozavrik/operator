/**
 * Audit Logger Utility
 * Logs all user actions for security monitoring and compliance.
 * 
 * Usage:
 *   import { auditLog } from '@/lib/logger';
 *   await auditLog('LOGIN', 'auth', { email: user.email });
 */

import { supabase } from './supabase';

export type AuditAction =
    | 'LOGIN'
    | 'LOGOUT'
    | 'VIEW_METRICS'
    | 'VIEW_DEFICIT'
    | 'EXPORT_EXCEL'
    | 'SHARE_ORDER'
    | 'CHANGE_STORE'
    | 'API_ACCESS'
    | 'ERROR';

export interface AuditLogEntry {
    user_id: string | null;
    action: AuditAction;
    target: string;
    metadata?: Record<string, unknown>;
    ip_address?: string;
    user_agent?: string;
}

/**
 * Log an action to the audit_logs table in Supabase.
 * Falls back to console.log if Supabase insert fails.
 */
export async function auditLog(
    action: AuditAction,
    target: string,
    metadata?: Record<string, unknown>,
    userId?: string | null
): Promise<void> {
    const entry: AuditLogEntry = {
        user_id: userId ?? null,
        action,
        target,
        metadata,
    };

    // Attempt to get user agent from browser context
    if (typeof window !== 'undefined') {
        entry.user_agent = navigator.userAgent;
    }

    const timestamp = new Date().toISOString();

    try {
        const { error } = await supabase
            .from('audit_logs')
            .insert({
                ...entry,
                created_at: timestamp,
            });

        if (error) {
            console.warn('[AuditLog] Supabase insert failed:', error.message);
            // Fallback: log to console for debugging
            console.log('[AuditLog]', timestamp, entry);
        }
    } catch (err) {
        console.error('[AuditLog] Exception:', err);
        console.log('[AuditLog]', timestamp, entry);
    }
}

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
        const { error } = await supabase.from('audit_logs').insert(entry);

        if (error) {
            console.warn('[ServerAuditLog] Supabase insert failed:', error.message);
            console.log('[ServerAuditLog]', entry);
        }
    } catch (err) {
        console.error('[ServerAuditLog] Exception:', err);
        console.log('[ServerAuditLog]', entry);
    }
}

/**
 * Quick console logger for development.
 * Use this for non-critical logs that don't need to be stored.
 */
export function devLog(category: string, message: string, data?: unknown): void {
    if (process.env.NODE_ENV === 'development') {
        console.log(`[${category}] ${message}`, data ?? '');
    }
}
