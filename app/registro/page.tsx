'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { CheckCircle, Eye, EyeOff, ArrowLeft, ChevronDown, Building2, HardHat, Landmark, PenLine } from 'lucide-react'

const CARGOS = [
  'Especialista Ambiental',
  'Especialista Social',
  'Especialista en Seguridad Ocupacional',
  'Administrador de Contrato',
  'Inspector de Obra',
  'Coordinador de Proyecto',
]

// Tipos de institución disponibles
type TipoInstitucion = '' | 'contratista' | 'supervision' | 'mineducyt' | 'otro'

const TIPOS_INST: { value: TipoInstitucion; label: string; desc: string; icon: any; disabled?: boolean }[] = [
  {
    value:    'contratista',
    label:    'Empresa Contratista',
    desc:     'Próximamente disponible',
    icon:     HardHat,
    disabled: true,
  },
  {
    value: 'supervision',
    label: 'Empresa de Supervisión',
    desc:  'Selecciona tu empresa de la lista',
    icon:  Building2,
  },
  {
    value: 'mineducyt',
    label: 'MINEDUCYT',
    desc:  'Ministerio de Educación, Ciencia y Tecnología',
    icon:  Landmark,
  },
  {
    value: 'otro',
    label: 'Otro',
    desc:  'Especifica tu institución',
    icon:  PenLine,
  },
]

const inp = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const lbl = 'text-sm font-medium text-slate-700 mb-1 block'

function RegistroForm() {
  const [form, setForm] = useState({
    username:        '',
    nombre:          '',
    apellido:        '',
    correo:          '',
    cargo:           '',
    password:        '',
    confirmPassword: '',
    // institución
    tipoInstitucion:    '' as TipoInstitucion,
    empresaSupervision: '',
    otraInstitucion:    '',
  })

  const [empresas,      setEmpresas]      = useState<string[]>([])
  const [showPass,      setShowPass]      = useState(false)
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState('')
  const [success,       setSuccess]       = useState(false)
  const [usernameTaken, setUsernameTaken] = useState(false)
  const [showTipos,     setShowTipos]     = useState(false)

  function set(f: string, v: string) { setForm(p => ({ ...p, [f]: v })) }

  // Cargar empresas de supervisión
  useEffect(() => {
    fetch('/api/empresas-supervision')
      .then(r => r.json())
      .then(({ empresas }) => setEmpresas(empresas ?? []))
      .catch(() => {})
  }, [])

  async function checkUsername() {
    const u = form.username.trim().toLowerCase()
    if (!u || u.length < 3) return
    const res = await fetch('/api/lookup-user', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ username: u }),
    })
    setUsernameTaken(res.ok)
  }

  // ¿El formulario está listo para enviar según el tipo de institución?
  function institucionValida(): boolean {
    switch (form.tipoInstitucion) {
      case 'supervision': return !!form.empresaSupervision
      case 'mineducyt':   return true
      case 'otro':        return form.otraInstitucion.trim().length >= 2
      default:            return false
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const username = form.username.trim().toLowerCase()
    if (username.length < 3)              { setError('El nombre de usuario debe tener al menos 3 caracteres.'); return }
    if (usernameTaken)                    { setError('Ese nombre de usuario ya está en uso.'); return }
    if (!institucionValida())             { setError('Completa la selección de institución.'); return }
    if (!form.cargo)                      { setError('Debes seleccionar tu cargo.'); return }
    if (form.password !== form.confirmPassword) { setError('Las contraseñas no coinciden.'); return }

    setLoading(true)
    const nombreCompleto = `${form.nombre.trim()} ${form.apellido.trim()}`.trim()

    // Determinar empresa_supervision e institucion según tipo
    const empresaSupervision = form.tipoInstitucion === 'supervision' ? form.empresaSupervision : ''
    const institucion =
      form.tipoInstitucion === 'mineducyt' ? 'MINEDUCYT' :
      form.tipoInstitucion === 'otro'      ? form.otraInstitucion.trim() :
      ''

    const res = await fetch('/api/create-user', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        nombre:              nombreCompleto,
        email:               form.correo.trim(),
        password:            form.password,
        cargo:               form.cargo,
        empresa_supervision: empresaSupervision,
        institucion,
        rol:                 'usuario',
        fromRegistro:        true,   // activa envío de email de verificación
      }),
    })

    const result = await res.json()
    if (!res.ok) {
      setError(result.error ?? 'Error al crear la cuenta. Intenta de nuevo.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="text-center py-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <CheckCircle size={30} className="text-green-600" />
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-2">¡Cuenta creada!</h2>
        <p className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">
          Te enviamos un correo a <strong>{form.correo}</strong>.
          Revisa tu bandeja de entrada y haz clic en el enlace para <strong>confirmar tu cuenta</strong> e ingresar al sistema.
        </p>
        <Link href="/login"
          className="mt-6 inline-flex items-center gap-2 bg-blue-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 transition">
          <ArrowLeft size={14} /> Volver al inicio de sesión
        </Link>
      </div>
    )
  }

  const tipoActual = TIPOS_INST.find(t => t.value === form.tipoInstitucion)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Usuario */}
      <div>
        <label className={lbl}>
          Usuario <span className="text-slate-400 font-normal text-xs">(nombre corto para ingresar)</span>
        </label>
        <input
          value={form.username}
          onChange={e => set('username', e.target.value.toLowerCase().replace(/\s/g, ''))}
          onBlur={checkUsername}
          required minLength={3}
          placeholder="Ej: jperez"
          autoComplete="username"
          className={`${inp} ${usernameTaken ? 'border-red-400 focus:ring-red-400' : ''}`}
        />
        {usernameTaken && <p className="text-xs text-red-500 mt-1">Ese nombre de usuario ya está en uso.</p>}
        {!usernameTaken && form.username.length >= 3 && <p className="text-xs text-green-600 mt-1">✓ Disponible</p>}
      </div>

      {/* Nombre y Apellido */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lbl}>Nombre</label>
          <input value={form.nombre} onChange={e => set('nombre', e.target.value)}
            required placeholder="Ej: Juan" className={inp} />
        </div>
        <div>
          <label className={lbl}>Apellido</label>
          <input value={form.apellido} onChange={e => set('apellido', e.target.value)}
            required placeholder="Ej: Pérez" className={inp} />
        </div>
      </div>

      {/* Correo */}
      <div>
        <label className={lbl}>Correo electrónico</label>
        <input type="email" value={form.correo} onChange={e => set('correo', e.target.value)}
          required placeholder="correo@empresa.com" className={inp} />
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

      {/* Confirmar contraseña */}
      <div>
        <label className={lbl}>Confirmar contraseña</label>
        <input type="password" value={form.confirmPassword}
          onChange={e => set('confirmPassword', e.target.value)}
          required minLength={8} placeholder="Repite tu contraseña" className={inp} />
      </div>

      {/* ── Selector de institución / empresa ── */}
      <div>
        <label className={lbl}>Institución o empresa</label>

        {/* Botón que muestra la selección actual o el placeholder */}
        <button
          type="button"
          onClick={() => setShowTipos(p => !p)}
          className={`w-full flex items-center justify-between gap-2 border rounded-lg px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            form.tipoInstitucion
              ? 'border-blue-400 bg-blue-50 text-blue-800'
              : 'border-slate-300 bg-white text-slate-400'
          }`}
        >
          <span className="flex items-center gap-2">
            {tipoActual && <tipoActual.icon size={15} className="shrink-0" />}
            {tipoActual ? tipoActual.label : 'Selecciona tu institución...'}
          </span>
          <ChevronDown size={15} className={`shrink-0 transition-transform ${showTipos ? 'rotate-180' : ''}`} />
        </button>

        {/* Opciones desplegables */}
        {showTipos && (
          <div className="mt-1.5 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            {TIPOS_INST.map(tipo => {
              const Icon = tipo.icon
              const active = form.tipoInstitucion === tipo.value
              return (
                <button
                  key={tipo.value}
                  type="button"
                  disabled={tipo.disabled}
                  onClick={() => {
                    if (tipo.disabled) return
                    set('tipoInstitucion', tipo.value)
                    // Limpiar sub-campos al cambiar
                    setForm(p => ({ ...p, tipoInstitucion: tipo.value, empresaSupervision: '', otraInstitucion: '' }))
                    setShowTipos(false)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-slate-100 last:border-0 ${
                    tipo.disabled
                      ? 'opacity-40 cursor-not-allowed bg-slate-50'
                      : active
                      ? 'bg-blue-50 text-blue-800'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Icon size={16} className="shrink-0 text-slate-500" />
                  <div>
                    <p className="text-sm font-medium leading-tight">{tipo.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{tipo.desc}</p>
                  </div>
                  {active && <span className="ml-auto text-blue-600 text-xs font-semibold">✓</span>}
                </button>
              )
            })}
          </div>
        )}

        {/* Sub-campo: Empresa de Supervisión */}
        {form.tipoInstitucion === 'supervision' && (
          <div className="mt-3">
            <label className="text-xs font-medium text-slate-500 mb-1 block">Empresa de Supervisión</label>
            <select
              value={form.empresaSupervision}
              onChange={e => set('empresaSupervision', e.target.value)}
              required
              className={inp}
            >
              <option value="">Selecciona tu empresa...</option>
              {empresas.map(emp => <option key={emp} value={emp}>{emp}</option>)}
            </select>
          </div>
        )}

        {/* Sub-campo: Otra institución */}
        {form.tipoInstitucion === 'otro' && (
          <div className="mt-3">
            <label className="text-xs font-medium text-slate-500 mb-1 block">Nombre de tu institución</label>
            <input
              value={form.otraInstitucion}
              onChange={e => set('otraInstitucion', e.target.value)}
              placeholder="Ej: Alcaldía Municipal, ONG..."
              minLength={2}
              required
              className={inp}
            />
          </div>
        )}

        {/* Badge de confirmación MINEDUCYT */}
        {form.tipoInstitucion === 'mineducyt' && (
          <div className="mt-2 flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            <CheckCircle size={13} className="shrink-0" />
            Registrándote como personal de MINEDUCYT
          </div>
        )}
      </div>

      {/* Cargo */}
      <div>
        <label className={lbl}>Cargo</label>
        <select value={form.cargo} onChange={e => set('cargo', e.target.value)}
          required className={inp}>
          <option value="">Selecciona tu cargo...</option>
          {CARGOS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {error && (
        <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || usernameTaken || !institucionValida()}
        className="w-full bg-blue-900 text-white rounded-lg py-2.5 font-medium hover:bg-blue-800 transition disabled:opacity-60"
      >
        {loading ? 'Enviando solicitud...' : 'Registrarse'}
      </button>

      <p className="text-center text-sm text-slate-500 pt-1">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="text-blue-700 hover:underline font-medium">
          Iniciar sesión
        </Link>
      </p>
    </form>
  )
}

export default function RegistroPage() {
  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-md mx-auto">

        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-900 mb-4">
            <span className="text-white font-bold text-xl">B</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Crear cuenta</h1>
          <p className="text-slate-500 text-sm mt-1">BCIE · SCAS</p>
        </div>

        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
          Recibirás un <strong>correo de verificación</strong> para activar tu cuenta e ingresar al sistema.
        </div>

        <Suspense>
          <RegistroForm />
        </Suspense>
      </div>
    </div>
  )
}
