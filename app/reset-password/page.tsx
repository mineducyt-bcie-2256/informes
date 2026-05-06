'use client'
import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { CheckCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

function ResetForm() {
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [showPass,  setShowPass]  = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState(false)
  const [sesionOk,  setSesionOk]  = useState(false)

  const router   = useRouter()
  const supabase = createClient()

  // Supabase redirige con tokens en el hash — el SDK los procesa automáticamente
  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSesionOk(true)
      }
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError('No se pudo actualizar la contraseña. El enlace puede haber expirado.')
      setLoading(false)
      return
    }

    await supabase.auth.signOut()
    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="text-center py-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 mb-4">
          <CheckCircle size={28} className="text-green-600" />
        </div>
        <h2 className="font-semibold text-slate-800 mb-2">Contraseña actualizada</h2>
        <p className="text-sm text-slate-500">Tu contraseña ha sido restablecida correctamente. Ya puedes iniciar sesión.</p>
        <Link href="/login"
          className="mt-6 inline-block bg-blue-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 transition">
          Ir al inicio de sesión
        </Link>
      </div>
    )
  }

  if (!sesionOk) {
    return (
      <div className="text-center py-4 text-slate-500 text-sm">
        <p>Verificando enlace de recuperación...</p>
        <p className="text-xs mt-2 text-slate-400">Si este mensaje persiste, el enlace puede haber expirado. <Link href="/recuperar" className="text-blue-600 hover:underline">Solicitar uno nuevo</Link>.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Nueva contraseña</label>
        <div className="relative">
          <input
            type={showPass ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            required minLength={8}
            placeholder="Mínimo 8 caracteres"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="button" onClick={() => setShowPass(p => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar contraseña</label>
        <input
          type="password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          required minLength={8}
          placeholder="Repite la contraseña"
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && (
        <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <button type="submit" disabled={loading}
        className="w-full bg-blue-900 text-white rounded-lg py-2.5 font-medium hover:bg-blue-800 transition disabled:opacity-60">
        {loading ? 'Guardando...' : 'Establecer nueva contraseña'}
      </button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 overflow-y-auto flex items-start justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-md mt-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-900 mb-4">
            <ShieldCheck size={28} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">Nueva contraseña</h1>
          <p className="text-slate-500 text-sm mt-1">BCIE · SCAS</p>
        </div>
        <Suspense>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  )
}
