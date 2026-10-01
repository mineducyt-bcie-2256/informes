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

    if (error) {
      return NextResponse.json({ error: 'Error al verificar usuario: ' + error.message }, { status: 500 })
    }

    // Si hay resultados, el usuario ya existe
    if (data && data.length > 0) {
      return NextResponse.json({ available: false }, { status: 200 })
    }

    // Si no hay resultados, el usuario está disponible
    return NextResponse.json({ available: true }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
