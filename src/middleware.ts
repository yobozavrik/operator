import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // 🚧 TEMPORARY: Allow admin bypass
    if (request.cookies.get('bypass_auth')?.value === 'true') {
        return response;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('❌ CRITICAL ERROR [Middleware]: Supabase environment variables are missing!')
    }

    const supabase = createServerClient(
        supabaseUrl || 'https://missing-middleware-url.supabase.co',
        supabaseAnonKey || 'missing-middleware-key',
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value)
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // ПРОТЕКЦІЯ РОУТІВ
    // Якщо користувач не залогінений і намагається зайти на закриті сторінки
    const isProtectedPath =
        request.nextUrl.pathname === '/' ||
        request.nextUrl.pathname.startsWith('/bi') ||
        request.nextUrl.pathname.startsWith('/hub') ||
        request.nextUrl.pathname.startsWith('/production');

    if (!user && isProtectedPath) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // Якщо користувач вже залогінений і намагається зайти на логін
    if (user && request.nextUrl.pathname === '/login') {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
    }

    // Перенаправлення зі старої адреси /bi на нову головну
    if (request.nextUrl.pathname.startsWith('/bi')) {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
    }

    // Перенаправлення зі старої адреси /bi на нову головну
    if (request.nextUrl.pathname.startsWith('/bi')) {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - api/graviton (allow API calls for now, logic will be added later inside API)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
