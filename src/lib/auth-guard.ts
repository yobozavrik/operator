import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Перевіряє авторизацію користувача для API-маршрутів.
 * Повертає user або 401 відповідь.
 *
 * Використання:
 *   const auth = await requireAuth();
 *   if (auth.error) return auth.error;
 *   const user = auth.user;
 */
export async function requireAuth() {
    const supabase = await createClient();

    let user = null;
    let cookieError = null;

    // 1. Try Cookie Auth
    try {
        const { data, error } = await supabase.auth.getUser();
        user = data.user;
        cookieError = error;
    } catch (err: any) {
        console.error('[AUTH-GUARD] Cookie auth threw:', err.message);
    }

    if (user) {
        return { user, error: null };
    }

    // 2. Try Bearer Token (if cookie failed)
    const { headers } = await import('next/headers');
    const headerList = await headers();
    const authHeader = headerList.get('Authorization');

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const { data: { user: userFromToken }, error: tokenError } = await supabase.auth.getUser(token);

            if (userFromToken) {
                return { user: userFromToken, error: null };
            }

            console.log('[AUTH-GUARD] Token auth failed:', tokenError?.message);
        } catch (err: any) {
            console.error('[AUTH-GUARD] Token auth threw:', err.message);
        }
    }

    // 🔍 DEBUG LOG
    console.log('[AUTH-GUARD] Auth failed. Cookie error:', cookieError?.message);

    return {
        user: null,
        error: NextResponse.json(
            { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
            { status: 401 }
        ),
    };
}
