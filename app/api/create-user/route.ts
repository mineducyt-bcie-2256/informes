import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const {
      username, nombre, email, password, cargo, rol, activo,
      empresa_supervision, institucion,
      fromRegistro,   // true cuando viene del auto-registro público
    } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña son requeridos' }, { status: 400 })
    }

    let userId: string

    if (fromRegistro) {
      // ── Auto-registro: usar cliente anónimo para que Supabase envíe el email de verificación
      const anonClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const origin = req.headers.get('origin') ?? process.env.NEXT_PUBLIC_SUPABASE_URL!.replace('.supabase.co', '.vercel.app')

      const { data, error: signUpErr } = await anonClient.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${origin}/login`,
          data: { nombre },
        },
      })

      if (signUpErr) {
        const msg = signUpErr.message.includes('already') || signUpErr.message.includes('registered')
          ? 'Ese correo ya está registrado.'
          : signUpErr.message
        return NextResponse.json({ error: msg }, { status: 400 })
      }

      userId = data.user?.id ?? ''
      if (!userId) return NextResponse.json({ error: 'No se pudo obtener el ID del usuario' }, { status: 500 })

    } else {
      // ── Creación por programador/admin: confirmación directa sin email
      const { data, error: authErr } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { nombre },
      })

      if (authErr) {
        const msg = authErr.message.includes('already') || authErr.message.includes('registered')
          ? 'Ese correo ya está registrado.'
          : authErr.message
        return NextResponse.json({ error: msg }, { status: 400 })
      }

      userId = data.user?.id ?? ''
      if (!userId) return NextResponse.json({ error: 'No se pudo obtener el ID del usuario' }, { status: 500 })
    }

    // Actualizar perfil con todos los datos
    const { error: profErr } = await adminClient.from('profiles').update({
      username:            username?.trim().toLowerCase() || null,
      nombre:              nombre   || null,
      cargo:               cargo    || null,
      rol:                 rol      || 'usuario',
      // Auto-registro: activo=true, el email de verificación es el control de acceso
      // Creación manual: usa el valor que pase el programador
      activo:              fromRegistro ? true : (activo ?? true),
      email,
      empresa_supervision: empresa_supervision || null,
      institucion:         institucion         || null,
    }).eq('id', userId)

    if (profErr) {
      return NextResponse.json({ error: 'Usuario creado pero error en perfil: ' + profErr.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, userId })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
