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

    // Buscar usuario por username y retornar email para login
    const { data, error } = await adminClient
      .from('profiles')
      .select('id, email')
      .eq('username', username.toLowerCase().trim())

    if (error) {
      return NextResponse.json({ error: 'Error al verificar usuario: ' + error.message }, { status: 500 })
    }

    // Si hay resultados, retornar email para login
    if (data && data.length > 0) {
      return NextResponse.json({ email: data[0].email, available: false }, { status: 200 })
    }

    // Si no hay resultados, usuario no existe (disponible para registro)
    return NextResponse.json({ available: true }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
