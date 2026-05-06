import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const USERS = [
  {
    email:    'admin@bcie-scas.local',
    password: '4321abcd',
    username: 'admin',
    nombre:   'Administrador SCAS',
    cargo:    'Administrador del Sistema',
    rol:      'administrador',
    activo:   true,
  },
  {
    email:    'user1@bcie-scas.local',
    password: '1234abcd',
    username: 'user1',
    nombre:   'Usuario de Prueba',
    cargo:    'Especialista Ambiental',
    rol:      'usuario',
    activo:   true,
  },
]

export async function GET() {
  const resultados: any[] = []

  for (const u of USERS) {
    // 1. Crear en Auth
    const { data, error: authErr } = await adminClient.auth.admin.createUser({
      email:             u.email,
      password:          u.password,
      email_confirm:     true,
      user_metadata:     { nombre: u.nombre },
    })

    if (authErr) {
      // Si ya existe, intentar obtenerlo
      if (authErr.message.includes('already been registered') || authErr.message.includes('already exists')) {
        resultados.push({ username: u.username, status: 'ya existía — se actualizará el perfil' })
        // Buscar usuario existente por email
        const { data: list } = await adminClient.auth.admin.listUsers()
        const existing = list?.users?.find(usr => usr.email === u.email)
        if (existing) {
          await adminClient.from('profiles').update({
            username: u.username,
            nombre:   u.nombre,
            cargo:    u.cargo,
            rol:      u.rol,
            activo:   u.activo,
            email:    u.email,
          }).eq('id', existing.id)
        }
        continue
      }
      resultados.push({ username: u.username, status: `error auth: ${authErr.message}` })
      continue
    }

    // 2. Actualizar profile
    const userId = data.user?.id
    if (userId) {
      const { error: profErr } = await adminClient.from('profiles').update({
        username: u.username,
        nombre:   u.nombre,
        cargo:    u.cargo,
        rol:      u.rol,
        activo:   u.activo,
        email:    u.email,
      }).eq('id', userId)

      resultados.push({
        username: u.username,
        rol:      u.rol,
        status:   profErr ? `perfil error: ${profErr.message}` : '✓ creado',
      })
    }
  }

  return NextResponse.json({ ok: true, resultados })
}
