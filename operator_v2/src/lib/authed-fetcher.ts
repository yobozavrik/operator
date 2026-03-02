import { createClient } from '@/utils/supabase/client';

/**
 * SWR fetcher з автоматичною авторизацією.
 * Бере access_token із supabase.auth.getSession() і шле Authorization: Bearer <token>.
 */
export const authedFetcher = async (url: string) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.getSession();

    // 🔍 TEMP DEBUG LOG
    console.log('[authedFetcher] url=', url, 'hasSession=', !!data.session, 'err=', error?.message);

    const token = data.session?.access_token;

    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
        credentials: 'include', // keep include for cookie flow backup
        headers,
    });

    if (!res.ok) {
        const errorVal = new Error('Fetch failed');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (errorVal as any).status = res.status;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (errorVal as any).info = await res.json().catch(() => ({}));
        throw errorVal;
    }

    return res.json();
};
