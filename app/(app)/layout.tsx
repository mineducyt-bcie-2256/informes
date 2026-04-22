import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import type { Profile } from '@/types'

const DEV_PROFILE: Profile = {
  id: 'dev-user',
  nombre: 'Desarrollador',
  email: 'dev@local.com',
  rol: 'programador',
  cargo: 'Administrador del Sistema',
  grupo_id: null,
  activo: true,
  created_at: new Date().toISOString(),
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Bypass de autenticación para desarrollo local
  if (process.env.DEV_BYPASS_AUTH === 'true') {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar profile={DEV_PROFILE} />
        <main className="flex-1 overflow-y-auto bg-slate-50">
          {children}
        </main>
      </div>
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile: Profile | null = null
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    profile = data
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar profile={profile} />
      <main className="flex-1 overflow-y-auto bg-slate-50">
        {children}
      </main>
    </div>
  )
}
