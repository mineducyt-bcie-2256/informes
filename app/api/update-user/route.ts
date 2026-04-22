import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(req: NextRequest) {
  try {
    const { userId, email, password } = await req.json()
    if (!userId) return NextResponse.json({ error: 'userId requerido' }, { status: 400 })

    const updates: { email?: string; password?: string } = {}
    if (email)    updates.email    = email
    if (password) updates.password = password

    if (!Object.keys(updates).length)
      return NextResponse.json({ ok: true }) // nada que cambiar en auth

    const { error } = await adminClient.auth.admin.updateUserById(userId, updates)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
