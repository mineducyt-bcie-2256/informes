'use client'
import { useState, useEffect } from 'react'
import { Pencil, Trash2, X, CheckCircle, AlertTriangle, Save, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Usuario {
  id:                  string
  nombre:              string
  email:               string
  rol:                 string
  cargo:               string | null
  empresa:             string | null
  empresa_supervision: string | null
  activo:              boolean
}

const ROLES: { value: string; label: string; desc: string; color: string }[] = [
  { value: 'programador',   label: 'Programador',   desc: 'Acceso total a modificaciones de la app', color: 'bg-violet-100 text-violet-700 border-violet-200' },
  { value: 'administrador', label: 'Administrador', desc: 'Dashboard e informes',                    color: 'bg-red-100 text-red-700 border-red-200'          },
  { value: 'usuario',       label: 'Usuario',       desc: 'Acceso a informes: llenar y editar',       color: 'bg-blue-100 text-blue-700 border-blue-200'       },
]

const inp = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const lbl = 'text-sm font-medium text-slate-700 mb-1 block'

// ════════════════════════════════════════════════════════════════
// Modal Editar
// ════════════════════════════════════════════════════════════════
function ModalEditar({ usuario, onClose }: { usuario: Usuario; onClose: () => void }) {
  const supabase = createClient()

  const [form, setForm] = useState({
    nombre:              usuario.nombre,
    email:               usuario.email,
    empresa:             usuario.empresa             ?? '',
    empresa_supervision: usuario.empresa_supervision ?? '',
    cargo:               usuario.cargo               ?? '',
    rol:                 usuario.rol,
    activo:              usuario.activo,
    password:            '',
  })
  const [empresas,      setEmpresas]      = useState<string[]>([])
  const [supervisiones, setSupervisiones] = useState<string[]>([])
  const [showPass,  setShowPass]  = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState(false)

  function set(f: string, v: any) { setForm(p => ({ ...p, [f]: v })) }

  // Cargar empresas contratistas y de supervisión
  useEffect(() => {
    const filtro = supabase.from('escuelas')
      .select('empresa_obras, empresa_supervision')
      .eq('activa', true)
      .eq('etapa', 'Construcción')
      .neq('numero_contrato', 'SIN ADJUDICAR')
      .not('numero_contrato', 'is', null)

    filtro.then(({ data }) => {
      setEmpresas(     [...new Set(data?.map(e => e.empresa_obras).filter(Boolean))]       as string[])
      setSupervisiones([...new Set(data?.map(e => e.empresa_supervision).filter(Boolean))] as string[])
    })
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    // 1. Actualizar profile en BD
    const { error: profileErr } = await supabase.from('profiles').update({
      nombre:              form.nombre,
      cargo:               form.cargo               || null,
      empresa:             form.empresa             || null,
      empresa_supervision: form.empresa_supervision || null,
      rol:                 form.rol,
      activo:              form.activo,
    }).eq('id', usuario.id)

    if (profileErr) { setError(profileErr.message); setLoading(false); return }

    // 2. Si cambió email o password → actualizar en auth via service role
    const emailChanged    = form.email.trim() !== usuario.email
    const passwordChanged = form.password.length > 0

    if (emailChanged || passwordChanged) {
      const res = await fetch('/api/update-user', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          userId:   usuario.id,
          email:    emailChanged    ? form.email.trim()  : undefined,
          password: passwordChanged ? form.password      : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) { setError(data.error ?? 'Error al actualizar auth'); setLoading(false); return }

      // Actualizar email también en profiles si cambió
      if (emailChanged) {
        await supabase.from('profiles').update({ email: form.email.trim() }).eq('id', usuario.id)
      }
    }

    setSuccess(true)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">

        {/* Header — fijo */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="font-bold text-lg text-slate-800">Editar usuario</h2>
            <p className="text-xs text-slate-500 mt-0.5">{usuario.email}</p>
          </div>
          <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
        </div>

        {/* Contenido — scrollable */}
        <div className="p-6 overflow-y-auto flex-1">
          {success ? (
            <div className="text-center py-4">
              <CheckCircle className="mx-auto mb-3 text-green-500" size={40} />
              <p className="font-semibold text-slate-700">Datos actualizados correctamente</p>
              <button
                onClick={() => { onClose(); window.location.reload() }}
                className="mt-4 bg-blue-900 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-800"
              >
                Cerrar
              </button>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">

              {/* Nombre */}
              <div>
                <label className={lbl}>Nombre completo</label>
                <input value={form.nombre} onChange={e => set('nombre', e.target.value)}
                  required className={inp} />
              </div>

              {/* Correo */}
              <div>
                <label className={lbl}>Correo electrónico</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                  required className={inp} />
              </div>

              {/* Empresa Contratista */}
              <div>
                <label className={lbl}>Empresa Contratista</label>
                <select value={form.empresa} onChange={e => set('empresa', e.target.value)} className={inp}>
                  <option value="">Sin empresa asignada</option>
                  {empresas.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                </select>
              </div>

              {/* Empresa de Supervisión */}
              <div>
                <label className={lbl}>Empresa de Supervisión</label>
                <select value={form.empresa_supervision} onChange={e => set('empresa_supervision', e.target.value)} className={inp}>
                  <option value="">Sin empresa asignada</option>
                  {supervisiones.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Cargo */}
              <div>
                <label className={lbl}>Cargo</label>
                <input value={form.cargo} onChange={e => set('cargo', e.target.value)}
                  placeholder="Ej: Especialista Ambiental" className={inp} />
              </div>

              {/* Nueva contraseña */}
              <div>
                <label className={lbl}>Nueva contraseña <span className="text-slate-400 font-normal">(dejar vacío para no cambiar)</span></label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    minLength={form.password ? 8 : 0}
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
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => set('rol', r.value)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${
                        form.rol === r.value
                          ? `${r.color} border-current`
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className={`w-3 h-3 rounded-full border-2 shrink-0 ${form.rol === r.value ? 'border-current bg-current' : 'border-slate-300'}`} />
                      <div>
                        <p className="text-sm font-semibold">{r.label}</p>
                        <p className="text-xs opacity-70">{r.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Estado */}
              <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-700">Estado de la cuenta</p>
                  <p className="text-xs text-slate-500">{form.activo ? 'El usuario puede iniciar sesión' : 'Cuenta desactivada'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => set('activo', !form.activo)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${form.activo ? 'bg-blue-600' : 'bg-slate-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.activo ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {error && (
                <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose}
                  className="flex-1 border border-slate-300 text-slate-600 py-2.5 rounded-lg text-sm hover:bg-slate-50">
                  Cancelar
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 bg-blue-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-60 flex items-center justify-center gap-2">
                  <Save size={14} />
                  {loading ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// Modal Confirmar Eliminación
// ════════════════════════════════════════════════════════════════
function ModalEliminar({ usuario, onClose }: { usuario: Usuario; onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function handleDelete() {
    setLoading(true)
    const res  = await fetch('/api/delete-user', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ userId: usuario.id }),
    })
    const data = await res.json()
    if (!res.ok || data.error) { setError(data.error ?? 'Error al eliminar'); setLoading(false); return }
    window.location.reload()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex flex-col items-center text-center gap-3 mb-5">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle size={26} className="text-red-500" />
          </div>
          <h2 className="font-bold text-lg text-slate-800">Eliminar usuario</h2>
          <p className="text-sm text-slate-500">
            ¿Estás seguro de que deseas eliminar a <strong>{usuario.nombre}</strong>?
            <br />Esta acción no se puede deshacer.
          </p>
          <div className="bg-slate-50 rounded-xl px-4 py-2 text-xs text-slate-600 font-mono w-full">
            {usuario.email}
          </div>
        </div>
        {error && <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>}
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 border border-slate-300 text-slate-600 py-2.5 rounded-lg text-sm hover:bg-slate-50">
            Cancelar
          </button>
          <button onClick={handleDelete} disabled={loading}
            className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60">
            {loading ? 'Eliminando...' : 'Sí, eliminar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// Botones por fila
// ════════════════════════════════════════════════════════════════
export default function AccionesUsuario({ usuario }: { usuario: Usuario }) {
  const [modal, setModal] = useState<'editar' | 'eliminar' | null>(null)

  return (
    <>
      <div className="flex items-center gap-1">
        <button onClick={() => setModal('editar')} title="Editar"
          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
          <Pencil size={15} />
        </button>
        <button onClick={() => setModal('eliminar')} title="Eliminar"
          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
          <Trash2 size={15} />
        </button>
      </div>
      {modal === 'editar'   && <ModalEditar   usuario={usuario} onClose={() => setModal(null)} />}
      {modal === 'eliminar' && <ModalEliminar usuario={usuario} onClose={() => setModal(null)} />}
    </>
  )
}
