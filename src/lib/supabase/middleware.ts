import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse
  }

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid calling other code between createServerClient and getUser.
  // Using getUser() validates with the Supabase Auth server.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isLoginPage = pathname === '/login'
  const isAuthCallback = pathname.startsWith('/auth')
  const isStaticResource =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/machines') ||
    pathname === '/favicon.ico' ||
    pathname.includes('.')

  const isDevPreview =
    process.env.NODE_ENV === 'development' &&
    (request.nextUrl.searchParams.get('preview') === '1' ||
      request.cookies.get('preview')?.value === '1')

  if (request.nextUrl.searchParams.get('preview') === '1') {
    supabaseResponse.cookies.set('preview', '1', { path: '/' })
  }

  if (!user && !isLoginPage && !isAuthCallback && !isStaticResource && !isDevPreview) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isLoginPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
