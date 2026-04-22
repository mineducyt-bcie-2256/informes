'use client'
import { useState } from 'react'
import { X, Plus, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const CARGOS = [
  'Especialista Ambiental',
  'Especialista Social',
  'Especialista en Seguridad Ocupacional',
]

const inp = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const lbl = 'text-sm font-medium text-slate-700 mb-1 block'

export default function NuevoUsuario() {
  const [open,    setOpen]    = useState(false)
  const [form,    setForm]    = useState({ nombre: '', email: '', cargo: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error,   setError]   = useState('')
  const supabase = createClient()

  function set(f: string, v: string) { setForm(p => ({ ...p, [f]: v })) }

  function cerrar() { setOpen(false); setSuccess(false); setError(''); setForm({ nombre: '', email: '', cargo: '', password: '' }) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: signUpError } = await supabase.auth.signUp({
      email:    form.email,
      password: form.password,
      options:  { data: { nombre: form.nombre } },
    })

    if (signUpError) { setError(signUpError.message); setLoading(false); return }

    if (data.user) {
      await supabase.from('profiles').update({
        nombre: form.nombre,
        cargo:  form.cargo || null,
        rol:    'usuario',   // todos inician como usuario
        activo: true,
      }).eq('id', data.user.id)
    }

    setSuccess(true)
    setLoading(false)
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-blue-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-800 transition">
        <Plus size={16} /> Nuevo usuario
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h2 className="font-bold text-lg text-slate-800">Nuevo usuario</h2>
              <button onClick={cerrar}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
            </div>

            <div className="p-6">
              {success ? (
                <div className="text-center py-4">
                  <CheckCircle className="mx-auto mb-3 text-green-500" size={40} />
                  <p className="font-semibold text-slate-700">Usuario creado correctamente</p>
                  <p className="text-sm text-slate-500 mt-2">
                    Se registró con rol <strong>Usuario</strong>. Puedes cambiar el rol desde la tabla de usuarios.
                  </p>
                  <button onClick={() => { cerrar(); window.location.reload() }}
                    className="mt-4 bg-blue-900 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-800">
                    Cerrar
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">

                  <div>
                    <label className={lbl}>Nombre y apellido</label>
                    <input value={form.nombre} onChange={e => set('nombre', e.target.value)}
                      required placeholder="Nombre completo" className={inp} />
                  </div>

                  <div>
                    <label className={lbl}>Correo electrónico</label>
                    <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                      required placeholder="correo@empresa.com" className={inp} />
                  </div>

                  <div>
                    <label className={lbl}>Cargo</label>
                    <select value={form.cargo} onChange={e => set('cargo', e.target.value)} className={inp}>
                      <option value="">Seleccionar cargo...</option>
                      {CARGOS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className={lbl}>Contraseña</label>
                    <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
                      required minLength={8} placeholder="Mínimo 8 caracteres" className={inp} />
                  </div>

                  {error && (
                    <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={cerrar}
                      className="flex-1 border border-slate-300 text-slate-600 py-2.5 rounded-lg text-sm hover:bg-slate-50">
                      Cancelar
                    </button>
                    <button type="submit" disabled={loading}
                      className="flex-1 bg-blue-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-60">
                      {loading ? 'Creando...' : 'Crear usuario'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
