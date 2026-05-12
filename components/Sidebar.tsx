'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, School, FileText, Users, LogOut, ChevronRight
} from 'lucide-react'
import type { Profile } from '@/types'
import ThemeToggle from '@/components/ThemeToggle'

const ALL_NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['programador', 'administrador', 'visitante'] },
  { href: '/informes',  label: 'Informes',  icon: FileText,         roles: ['programador', 'administrador', 'usuario', 'visitante'] },
  { href: '/escuelas',  label: 'Escuelas',  icon: School,           roles: ['programador', 'administrador', 'visitante'] },
  { href: '/usuarios',  label: 'Usuarios',  icon: Users,            roles: ['programador'] },
]

const ROL_BADGE: Record<string, { label: string; color: string }> = {
  programador:   { label: 'Programador',   color: 'bg-violet-500' },
  administrador: { label: 'Administrador', color: 'bg-red-500'    },
  usuario:       { label: 'Usuario',       color: 'bg-blue-500'   },
  visitante:     { label: 'Visitante',     color: 'bg-green-500'  },
}

export default function Sidebar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const rol = profile?.rol ?? 'usuario'
  const navItems = ALL_NAV.filter(n => n.roles.includes(rol))

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-64 h-full flex-shrink-0 flex flex-col overflow-y-auto" style={{ backgroundColor: '#1e3a5f' }}>
      {/* Logo */}
      <div className="px-5 py-4 border-b border-blue-800">
        <div className="flex items-center gap-2 mb-3">
          <img src="/logo-mineducyt.png" alt="MINEDUCYT" className="h-8 object-contain brightness-0 invert opacity-90" />
          <div className="w-px h-6 bg-blue-600" />
          <img src="/logo-bcie.png" alt="BCIE" className="h-6 object-contain brightness-0 invert opacity-90" />
        </div>
        <p className="text-white font-bold text-sm leading-tight">SISCAS</p>
        <p className="text-blue-300 text-xs leading-snug mt-0.5">Sistema de Seguimiento de<br/>Condiciones Ambientales y Sociales</p>
        <p className="text-blue-400 text-xs mt-1">Programa Mi Nueva Escuela</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              }`}
            >
              <Icon size={18} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight size={14} />}
            </Link>
          )
        })}
      </nav>

      {/* User info + logout */}
      <div className="px-4 py-4 border-t border-blue-800">
        {profile && (
          <div className="mb-3 px-2">
            <p className="text-white text-sm font-medium truncate">{profile.nombre}</p>
            {profile.username && (
              <p className="text-blue-400 text-xs font-mono">@{profile.username}</p>
            )}
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`w-2 h-2 rounded-full ${ROL_BADGE[profile.rol]?.color ?? 'bg-slate-400'}`} />
              <p className="text-blue-300 text-xs">{ROL_BADGE[profile.rol]?.label ?? profile.rol}</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 flex-1 px-3 py-2 rounded-lg text-blue-200 hover:bg-blue-800 hover:text-white text-sm transition-colors"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  )
}
