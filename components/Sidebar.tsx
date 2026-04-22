'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, School, FileText, Users, LogOut, ChevronRight
} from 'lucide-react'
import type { Profile } from '@/types'

const navItems = [
  { href: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/informes',   label: 'Informes',    icon: FileText },
  { href: '/escuelas',   label: 'Escuelas',    icon: School },
  { href: '/usuarios',   label: 'Usuarios',    icon: Users },
]

export default function Sidebar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-64 h-full flex-shrink-0 flex flex-col overflow-y-auto" style={{ backgroundColor: '#1e3a5f' }}>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-blue-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-400 flex items-center justify-center">
            <span className="text-blue-900 font-bold text-lg">B</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">BCIE · SCAS</p>
            <p className="text-blue-300 text-xs">Informes Ambientales</p>
          </div>
        </div>
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
            <p className="text-blue-300 text-xs capitalize">{profile.rol}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-blue-200 hover:bg-blue-800 hover:text-white text-sm transition-colors"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
