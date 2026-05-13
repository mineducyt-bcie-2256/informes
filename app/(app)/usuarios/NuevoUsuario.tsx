'use client'
import { useState, useEffect } from 'react'
import { X, Plus, CheckCircle, Eye, EyeOff } from 'lucide-react'

const CARGOS = [
  'Especialista Ambiental',
  'Especialista Social',
  'Especialista en Seguridad Ocupacional',
  'Administrador del Sistema',
  'Coordinador de Proyecto',
]

const ROLES = [
  { value: 'programador',   label: 'Programador',   desc: 'Acceso total',                       color: 'bg-violet-100 text-violet-700 border-violet-200' },
  { value: 'administrador', label: 'Administrador', desc: 'Dashboard e informes (solo lectura)', color: 'bg-red-100 text-red-700 border-red-200'          },
  { value: 'usuario',       label: 'Usuario',       desc: 'Llenar y editar informes',            color: 'bg-blue-100 text-blue-700 border-blue-200'       },
  { value: 'visitante',     label: 'Visitante',     desc: 'Solo lectura — escuela demo',         color: 'bg-green-100 text-green-700 border-green-200'    },
]

const inp = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const lbl = 'text-sm font-medium text-slate-700 mb-1 block'

export default function NuevoUsuario({ miRol }: { miRol: string }) {
  const [open,     setOpen]     = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [form,     setForm]     = useState({
    username: '', nombre: '', email: '', cargo: '', password: '',
    rol: 'usuario', activo: true,
    empresa_supervision: '', institucion: '',
  })
  const [supervisiones, setSupervisiones] = useState<string[]>([])
  const [loading,       setLoading]       = useState(false)
  const [success,       setSuccess]       = useState(false)
  const [error,         setError]         = useState('')
  const [usernameTaken, setUsernameTaken] = useState(false)

  function set(f: string, v: any) { setForm(p => ({ ...p, [f]: v })) }

  // Cargar empresas de supervisión
  useEffect(() => {
    fetch('/api/empresas-supervision')
      .then(r => r.json())
      .then(d => setSupervisiones(d.empresas ?? []))
  }, [])

  function cerrar() {
    setOpen(false); setSuccess(false); setError('')
    setForm({ username: '', nombre: '', email: '', cargo: '', password: '', rol: 'usuario', activo: true, empresa_supervision: '', institucion: '' })
    setUsernameTaken(false)
  }

  async function checkUsername() {
    const u = form.username.trim().toLowerCase()
    if (!u || u.length < 2) return
    const res = await fetch('/api/lookup-user', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u }),
    })
    setUsernameTaken(res.ok)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (usernameTaken) { setError('Ese nombre de usuario ya está en uso.'); return }
    setLoading(true); setError('')

    const res = await fetch('/api/create-user', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username:            form.username,
        nombre:              form.nombre,
        email:               form.email,
        password:            form.password,
        cargo:               form.cargo,
        rol:                 form.rol,
        activo:              form.activo,
        empresa_supervision: form.rol === 'usuario' ? form.empresa_supervision : '',
        institucion:         form.rol === 'administrador' ? form.institucion : '',
      }),
    })

    const result = await res.json()
    if (!res.ok) { setError(result.error ?? 'Error al crear usuario'); setLoading(false); return }

    setSuccess(true); setLoading(false)
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-blue-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-800 transition">
        <Plus size={16} /> Nuevo usuario
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col my-8">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <h2 className="font-bold text-lg text-slate-800">Nuevo usuario</h2>
              <button onClick={cerrar}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
            </div>

            <div className="p-6">
              {success ? (
                <div className="text-center py-4">
                  <CheckCircle className="mx-auto mb-3 text-green-500" size={40} />
                  <p className="font-semibold text-slate-700">Usuario creado correctamente</p>
                  <p className="text-sm text-slate-500 mt-2">
                    Rol asignado: <strong className="capitalize">{form.rol}</strong>
                  </p>
                  <button onClick={() => { cerrar(); window.location.reload() }}
                    className="mt-4 bg-blue-900 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-800">
                    Cerrar
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">

                  {/* Usuario */}
                  <div>
                    <label className={lbl}>
                      Usuario <span className="text-slate-400 font-normal">(para iniciar sesión)</span>
                    </label>
                    <input
                      value={form.username}
                      onChange={e => set('username', e.target.value.toLowerCase().replace(/\s/g, ''))}
                      onBlur={checkUsername}
                      required minLength={2}
                      placeholder="Ej: admin, jperez"
                      className={`${inp} ${usernameTaken ? 'border-red-400' : ''}`}
                    />
                    {usernameTaken && <p className="text-xs text-red-500 mt-1">Ese usuario ya existe.</p>}
                    {!usernameTaken && form.username.length >= 2 && (
                      <p className="text-xs text-green-600 mt-1">✓ Disponible</p>
                    )}
                  </div>

                  {/* Nombre */}
                  <div>
                    <label className={lbl}>Nombre completo</label>
                    <input value={form.nombre} onChange={e => set('nombre', e.target.value)}
                      required placeholder="Nombre y apellido" className={inp} />
                  </div>

                  {/* Correo */}
                  <div>
                    <label className={lbl}>Correo electrónico</label>
                    <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                      required placeholder="correo@empresa.com" className={inp} />
                  </div>

                  {/* Cargo */}
                  <div>
                    <label className={lbl}>Cargo</label>
                    <select value={form.cargo} onChange={e => set('cargo', e.target.value)} className={inp}>
                      <option value="">Seleccionar cargo...</option>
                      {CARGOS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {/* Contraseña */}
                  <div>
                    <label className={lbl}>Contraseña</label>
                    <div className="relative">
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={form.password}
                        onChange={e => set('password', e.target.value)}
                        required minLength={8}
                        placeholder="Mínimo 8 caracteres"
                        className={`${inp} pr-10`}
                      />
                      <button type="button" onClick={() => setShowPass(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* Rol */}
                  <div>
                    <label className={lbl}>Rol</label>
                    <div className="space-y-2">
                      {ROLES.map(r => (
                        <button key={r.value} type="button" onClick={() => set('rol', r.value)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 transition-all text-left ${
                            form.rol === r.value ? `${r.color} border-current` : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}>
                          <div className={`w-3 h-3 rounded-full border-2 shrink-0 ${form.rol === r.value ? 'border-current bg-current' : 'border-slate-300'}`} />
                          <div>
                            <p className="text-sm font-semibold">{r.label}</p>
                            <p className="text-xs opacity-70">{r.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Empresa / Institución — visible para todos los roles */}
                  <div>
                    <label className={lbl}>
                      {form.rol === 'usuario' ? 'Empresa de Supervisión' : 'Empresa / Institución'}
                    </label>

                    {form.rol === 'usuario' ? (
                      /* Usuario → select con empresas de supervisión */
                      <select
                        value={form.empresa_supervision}
                        onChange={e => set('empresa_supervision', e.target.value)}
                        className={inp}
                      >
                        <option value="">Sin empresa asignada</option>
                        {supervisiones.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : (
                      /* Otros roles → campo libre */
                      <input
                        value={form.empresa_supervision || form.institucion}
                        onChange={e => {
                          set('empresa_supervision', e.target.value)
                          set('institucion', e.target.value)
                        }}
                        placeholder="Ej: BCIE, MINEDUCYT, empresa contratista..."
                        className={inp}
                      />
                    )}
                    <p className="text-xs text-slate-400 mt-1">
                      Empresa o institución a la que pertenece el usuario
                    </p>
                  </div>

                  {/* Estado */}
                  <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-700">Cuenta activa</p>
                      <p className="text-xs text-slate-500">{form.activo ? 'El usuario puede iniciar sesión' : 'Cuenta desactivada'}</p>
                    </div>
                    <button type="button" onClick={() => set('activo', !form.activo)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${form.activo ? 'bg-blue-600' : 'bg-slate-300'}`}>
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.activo ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {error && (
                    <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={cerrar}
                      className="flex-1 border border-slate-300 text-slate-600 py-2.5 rounded-lg text-sm hover:bg-slate-50">
                      Cancelar
                    </button>
                    <button type="submit" disabled={loading || usernameTaken}
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
