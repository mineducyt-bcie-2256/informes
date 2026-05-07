'use client'
import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react'

function RecuperarForm() {
  const [correo,  setCorreo]  = useState('')
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error,   setError]   = useState('')
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const origin = window.location.origin

    const { error } = await supabase.auth.resetPasswordForEmail(correo.trim(), {
      redirectTo: `${origin}/reset-password`,
    })

    if (error) {
      setError('No pudimos enviar el correo. Verifica que la dirección sea correcta.')
      setLoading(false)
      return
    }

    setEnviado(true)
    setLoading(false)
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
          <h1 className="text-xl font-bold text-slate-800">Recuperar contraseña</h1>
          <p className="text-slate-500 text-sm mt-1">SISCAS</p>
        </div>

        {enviado ? (
          <div className="text-center py-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 mb-4">
              <CheckCircle size={28} className="text-green-600" />
            </div>
            <h2 className="font-semibold text-slate-800 mb-2">Correo enviado</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Si el correo <strong>{correo}</strong> está registrado en el sistema,
              recibirás un enlace para restablecer tu contraseña en los próximos minutos.
            </p>
            <p className="text-xs text-slate-400 mt-3">Revisa también tu carpeta de spam.</p>
            <Link href="/login"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:underline">
              <ArrowLeft size={14} /> Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-500 mb-6 text-center">
              Ingresa el correo con el que te registraste y te enviaremos un enlace para restablecer tu contraseña.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Correo electrónico</label>
                <div className="relative">
                  <input
                    type="email"
                    value={correo}
                    onChange={e => setCorreo(e.target.value)}
                    required
                    placeholder="correo@empresa.com"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              {error && (
                <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
              )}

              <button type="submit" disabled={loading}
                className="w-full bg-blue-900 text-white rounded-lg py-2.5 font-medium hover:bg-blue-800 transition disabled:opacity-60">
                {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
              </button>
            </form>

            <div className="mt-5 text-center">
              <Link href="/login"
                className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
                <ArrowLeft size={13} /> Volver al inicio de sesión
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function RecuperarPage() {
  return <Suspense><RecuperarForm /></Suspense>
}
