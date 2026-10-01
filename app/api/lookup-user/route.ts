import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json()

    if (!username || username.length < 2) {
      return NextResponse.json({ error: 'Username inválido' }, { status: 400 })
    }

    // Buscar si el usuario existe
    const { data, error } = await adminClient
      .from('profiles')
      .select('id')
      .eq('username', username.toLowerCase().trim())
      .single()

    // Si hay error de "no rows", el usuario está disponible
    if (error && error.code === 'PGRST116') {
      return NextResponse.json({ available: true }, { status: 200 })
    }

    // Si encontró un registro, el usuario ya existe
    if (data) {
      return NextResponse.json({ available: false }, { status: 200 })
    }

    // Error inesperado
    return NextResponse.json({ error: 'Error al verificar usuario' }, { status: 500 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
