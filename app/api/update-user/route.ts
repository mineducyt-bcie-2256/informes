import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(req: NextRequest) {
  try {
    const {
      userId, email, password,
      username, nombre, cargo, empresa, empresa_supervision, institucion, rol, activo,
    } = await req.json()

    if (!userId) return NextResponse.json({ error: 'userId requerido' }, { status: 400 })

    // 1. Actualizar perfil en profiles (service role bypasa RLS)
    const profileUpdates: Record<string, any> = {}
    if (username   !== undefined) profileUpdates.username            = username?.trim().toLowerCase() || null
    if (nombre     !== undefined) profileUpdates.nombre              = nombre
    if (cargo      !== undefined) profileUpdates.cargo               = cargo || null
    if (empresa    !== undefined) profileUpdates.empresa             = empresa || null
    if (empresa_supervision !== undefined) profileUpdates.empresa_supervision = empresa_supervision || null
    if (institucion !== undefined) profileUpdates.institucion = institucion || null
    if (rol        !== undefined) profileUpdates.rol                 = rol
    if (activo     !== undefined) profileUpdates.activo              = activo
    if (email      !== undefined) profileUpdates.email               = email?.trim()

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profErr } = await adminClient
        .from('profiles').update(profileUpdates).eq('id', userId)
      if (profErr) return NextResponse.json({ error: profErr.message }, { status: 500 })
    }

    // 2. Actualizar auth (email y/o password) si vienen
    const authUpdates: { email?: string; password?: string } = {}
    if (email)    authUpdates.email    = email.trim()
    if (password) authUpdates.password = password

    if (Object.keys(authUpdates).length > 0) {
      const { error: authErr } = await adminClient.auth.admin.updateUserById(userId, authUpdates)
      if (authErr) return NextResponse.json({ error: authErr.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
