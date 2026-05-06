'use client'
import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertTriangle, ShieldOff, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

function LoginForm() {
  const [usuario,  setUsuario]  = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const router       = useRouter()
  const searchParams = useSearchParams()
  const supabase     = createClient()

  const urlError  = searchParams.get('error')
  const redirectTo = searchParams.get('redirect') ?? '/dashboard'

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    // 1. Buscar el email asociado al username
    const res = await fetch('/api/lookup-user', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ username: usuario.trim() }),
    })
    const data = await res.json()

    if (!res.ok || !data.email) {
      setError('Usuario o contraseña incorrectos')
      setLoading(false)
      return
    }

    // 2. Autenticar con email + password
    const { error: authError } = await supabase.auth.signInWithPassword({
      email:    data.email,
      password: password,
    })

    if (authError) {
      setError('Usuario o contraseña incorrectos')
      setLoading(false)
      return
    }

    // 3. Obtener rol para redirigir a la sección correcta
    const { data: { user } } = await supabase.auth.getUser()
    let destino = '/dashboard'
    if (user) {
      const { data: perfil } = await supabase
        .from('profiles').select('rol').eq('id', user.id).single()
      const rol = perfil?.rol ?? 'usuario'
      // usuario → siempre a /informes (su sección principal)
      // programador/administrador → /dashboard o la URL de origen si es válida
      if (rol === 'usuario') {
        destino = '/informes'
      } else {
        // Solo respetar el redirect si no es una ruta restringida para ese rol
        const rutasRestringidas = ['/usuarios', '/escuelas']
        const redireccionValida = !rutasRestringidas.some(r => redirectTo.startsWith(r))
        destino = redireccionValida ? redirectTo : '/dashboard'
      }
    }

    router.push(destino)
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 overflow-y-auto flex items-start justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-md mt-10">

        {/* Logos */}
        <div className="flex items-center justify-center gap-6 mb-6">
          <img src="/logo-mineducyt.png" alt="MINEDUCYT" className="h-14 object-contain" />
          <div className="w-px h-12 bg-slate-200" />
          <img src="/logo-bcie.png" alt="BCIE" className="h-10 object-contain" />
        </div>
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800">SISCAS</h1>
          <p className="text-slate-500 text-sm mt-1">Sistema de Seguimiento de Condiciones Ambientales y Sociales</p>
        </div>

        {/* Avisos por URL */}
        {urlError === 'cuenta_inactiva' && (
          <div className="mb-5 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            <ShieldOff size={16} className="mt-0.5 shrink-0" />
            <span>Tu cuenta está <strong>pendiente de activación</strong>. Contacta al administrador del sistema.</span>
          </div>
        )}
        {urlError === 'sin_permiso' && (
          <div className="mb-5 flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-3 text-sm">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>No tienes permiso para acceder a esa sección.</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Usuario</label>
            <input
              value={usuario}
              onChange={e => setUsuario(e.target.value)}
              required
              autoComplete="username"
              placeholder="Tu nombre de usuario"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-slate-700">Contraseña</label>
              <Link href="/recuperar" className="text-xs text-blue-600 hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button type="button" onClick={() => setShowPass(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-blue-900 text-white rounded-lg py-2.5 font-medium hover:bg-blue-800 transition disabled:opacity-60">
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        {/* Enlace a registro */}
        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-500">¿Aún no tienes cuenta?</p>
          <Link href="/registro"
            className="mt-1.5 inline-block text-sm font-medium text-blue-700 hover:underline">
            Registrarse como especialista →
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
