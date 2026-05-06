import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ── Rutas públicas (no requieren sesión) ──────────────────────────
const PUBLIC_PATHS = ['/login', '/registro', '/recuperar', '/reset-password']

// ── Acceso por rol ────────────────────────────────────────────────
const ROUTE_ROLES: { pattern: RegExp; roles: string[] }[] = [
  // Solo programador
  { pattern: /^\/usuarios/, roles: ['programador'] },

  // Programador + administrador (usuario NO tiene dashboard)
  { pattern: /^\/dashboard/, roles: ['programador', 'administrador'] },

  // Programador + administrador
  { pattern: /^\/escuelas/, roles: ['programador', 'administrador'] },

  // Formularios de informe: programador + administrador + usuario
  {
    pattern: /^\/informes\/[^/]+\/(portada|c1317|hsso|garo|pgr|mcear|pppi|maqr|prt|cct|cumplimiento_ambiental)$/,
    roles: ['programador', 'administrador', 'usuario'],
  },
]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Bypass de auth para desarrollo local
  if (process.env.DEV_BYPASS_AUTH === 'true') return NextResponse.next()

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Rutas públicas — dejar pasar sin verificar sesión
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    const { data: { user } } = await supabase.auth.getUser()
    // Si ya tiene sesión activa y va al login → redirigir al dashboard
    if (user && pathname.startsWith('/login')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return supabaseResponse
  }

  // Verificar sesión
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Obtener perfil y rol
  const { data: profile } = await supabase
    .from('profiles')
    .select('rol, activo')
    .eq('id', user.id)
    .single()

  // Cuenta inactiva → redirigir con aviso
  if (!profile?.activo) {
    await supabase.auth.signOut()
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('error', 'cuenta_inactiva')
    return NextResponse.redirect(loginUrl)
  }

  const rol = profile?.rol ?? 'usuario'

  // Verificar acceso a la ruta según rol
  for (const { pattern, roles } of ROUTE_ROLES) {
    if (pattern.test(pathname)) {
      if (!roles.includes(rol)) {
        const fallback = new URL(rol === 'usuario' ? '/informes' : '/dashboard', request.url)
        fallback.searchParams.set('error', 'sin_permiso')
        return NextResponse.redirect(fallback)
      }
      break
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
