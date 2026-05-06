import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { username, nombre, email, password, cargo, rol, activo, empresa_supervision, institucion } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña son requeridos' }, { status: 400 })
    }

    // 1. Crear usuario en Auth (sin afectar la sesión actual)
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

    const userId = data.user?.id
    if (!userId) return NextResponse.json({ error: 'No se pudo obtener el ID del usuario' }, { status: 500 })

    // 2. Actualizar perfil con todos los datos
    const { error: profErr } = await adminClient.from('profiles').update({
      username:            username?.trim().toLowerCase() || null,
      nombre:              nombre  || null,
      cargo:               cargo   || null,
      rol:                 rol     || 'usuario',
      activo:              activo  ?? true,
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
