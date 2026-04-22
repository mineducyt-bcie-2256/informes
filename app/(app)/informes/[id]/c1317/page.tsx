'use client'
import { useState, useEffect, useId } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import FormWrapper from '@/components/forms/FormWrapper'
import {
  Pencil, Lock, MapPin, Users, Shield, Plus, Trash2,
  Building2, FileCheck, CalendarDays, UserPlus
} from 'lucide-react'

// ── Tipos ─────────────────────────────────────────────────────────
interface Especialista {
  id:     string
  cargo:  string
  nombre: string
  correo: string
  tel:    string
}

interface EscuelaGeo {
  nombre:                string
  latitud:               number | null
  longitud:              number | null
  resolucion_ambiental:  string | null
}

const CARGOS_ESP = [
  'Especialista ambiental',
  'Especialista social',
  'Especialista en seguridad ocupacional',
  'Especialista socioambiental',
]

const INIT_ESP = (): Especialista => ({
  id: crypto.randomUUID(), cargo: '', nombre: '', correo: '', tel: '',
})

// ════════════════════════════════════════════════════════════════
// EditBlock — sección de texto editable (estilo DescripcionCondicion)
// ════════════════════════════════════════════════════════════════
function EditBlock({
  titulo, value, onChange, placeholder, cargando,
}: {
  titulo: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  cargando?: boolean
}) {
  const [editando, setEditando] = useState(false)
  const MAX = 5000
  const restantes = MAX - (value?.length ?? 0)

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      {/* Cabecera */}
      <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5 border-b border-slate-200">
        <div>
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">{titulo}</span>
          {cargando && (
            <span className="ml-2 text-xs text-blue-500 animate-pulse">Cargando informe anterior...</span>
          )}
          {!cargando && !editando && value && (
            <span className="ml-2 text-xs text-slate-400">Haz clic en Editar para modificar</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setEditando(p => !p)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            editando
              ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              : 'bg-blue-900 text-white hover:bg-blue-800'
          }`}
        >
          {editando ? <><Lock size={12} /> Bloquear</> : <><Pencil size={12} /> Editar</>}
        </button>
      </div>
      {/* Texto */}
      <div className="relative">
        <textarea
          value={value}
          onChange={e => onChange(e.target.value.slice(0, MAX))}
          disabled={!editando}
          rows={5}
          placeholder={placeholder ?? 'Haz clic en Editar para ingresar el contenido...'}
          className={`w-full px-4 py-3 text-sm resize-none focus:outline-none transition-colors ${
            editando ? 'bg-white text-slate-800' : 'bg-slate-50 text-slate-600 cursor-default'
          }`}
        />
        {editando && (
          <div className="absolute bottom-0 left-0 right-0">
            <div className="h-0.5 bg-slate-100">
              <div
                className={`h-full transition-all ${restantes < 500 ? 'bg-amber-400' : 'bg-blue-400'}`}
                style={{ width: `${Math.min(100, ((value?.length ?? 0) / MAX) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
      {editando && (
        <div className="flex justify-end px-4 py-1.5 bg-white border-t border-slate-100">
          <span className={`text-xs ${restantes < 500 ? 'text-amber-500 font-medium' : 'text-slate-400'}`}>
            {restantes.toLocaleString()} caracteres restantes
          </span>
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// TarjetaEspecialista — card con datos del especialista
// ════════════════════════════════════════════════════════════════
function TarjetaEspecialista({
  esp, onChange, onDelete,
}: {
  esp: Especialista
  onChange: (updated: Especialista) => void
  onDelete: () => void
}) {
  const [expandido, setExpandido] = useState(!esp.nombre) // abierto si es nuevo
  const inp = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
  const lbl = 'text-xs text-slate-500 mb-1 block'

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      {/* Cabecera de la tarjeta */}
      <div className="flex items-center justify-between bg-slate-50 px-4 py-3 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setExpandido(p => !p)}
          className="flex items-center gap-2 text-left flex-1 min-w-0"
        >
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <Users size={14} className="text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-700 truncate">
              {esp.nombre || <span className="text-slate-400 font-normal italic">Nuevo especialista</span>}
            </p>
            {esp.cargo && (
              <p className="text-xs text-slate-500 truncate">{esp.cargo}</p>
            )}
          </div>
        </button>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <button
            type="button"
            onClick={() => setExpandido(p => !p)}
            className="text-xs text-blue-600 hover:underline px-2"
          >
            {expandido ? 'Colapsar' : 'Editar'}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Eliminar especialista"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Campos expandibles */}
      {expandido && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-white">
          {/* Cargo */}
          <div className="md:col-span-2">
            <label className={lbl}>Cargo / Función</label>
            <select
              value={esp.cargo}
              onChange={e => onChange({ ...esp, cargo: e.target.value })}
              className={inp}
            >
              <option value="">Seleccionar cargo...</option>
              {CARGOS_ESP.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          {/* Nombre */}
          <div>
            <label className={lbl}>Nombre del especialista</label>
            <input
              value={esp.nombre}
              onChange={e => onChange({ ...esp, nombre: e.target.value })}
              placeholder="Nombre y apellido completo"
              className={inp}
            />
          </div>
          {/* Teléfono */}
          <div>
            <label className={lbl}>Teléfono (WhatsApp)</label>
            <input
              value={esp.tel}
              onChange={e => onChange({ ...esp, tel: e.target.value })}
              placeholder="xxxx-xxxx"
              className={inp}
            />
          </div>
          {/* Correo */}
          <div className="md:col-span-2">
            <label className={lbl}>Correo electrónico</label>
            <input
              type="email"
              value={esp.correo}
              onChange={e => onChange({ ...esp, correo: e.target.value })}
              placeholder="correo@empresa.com"
              className={inp}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// Badge de vigencia de permisos
// ════════════════════════════════════════════════════════════════
function BadgeVigencia({ fecha }: { fecha: string }) {
  if (!fecha) return null
  const dias = Math.ceil((new Date(fecha).getTime() - Date.now()) / 86400000)
  const cls  = dias <= 0   ? 'bg-red-100 text-red-700 border-red-200'
             : dias <= 30  ? 'bg-amber-100 text-amber-700 border-amber-200'
                           : 'bg-emerald-100 text-emerald-700 border-emerald-200'
  const label = dias <= 0 ? 'Vencido' : dias <= 30 ? `Por vencer (${dias} días)` : `Vigente (${dias} días)`
  return (
    <span className={`inline-flex items-center gap-1 text-xs border px-2 py-0.5 rounded-full font-medium ${cls}`}>
      <CalendarDays size={10} />{label}
    </span>
  )
}

// ════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ════════════════════════════════════════════════════════════════
export default function C1317Page() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()

  // ── Estado del formulario ──────────────────────────────────────
  const [introduccion,               setIntroduccion]               = useState('')
  const [objetivo,                   setObjetivo]                   = useState('')
  const [alcance,                    setAlcance]                    = useState('')
  const [espContratista,             setEspContratista]             = useState<Especialista[]>([])
  const [espSupervision,             setEspSupervision]             = useState<Especialista[]>([])
  const [marnNumero,                 setMarnNumero]                 = useState('')
  const [marnFechaEmision,           setMarnFechaEmision]           = useState('')
  const [marnFechaVencimiento,       setMarnFechaVencimiento]       = useState('')
  const [marnObs,                    setMarnObs]                    = useState('')
  const [dotNumero,                  setDotNumero]                  = useState('')
  const [dotTipo,                    setDotTipo]                    = useState('')
  const [dotFechaEmision,            setDotFechaEmision]            = useState('')
  const [dotFechaVencimiento,        setDotFechaVencimiento]        = useState('')
  const [dotObs,                     setDotObs]                     = useState('')
  const [escuela,                    setEscuela]                    = useState<EscuelaGeo | null>(null)
  const [cargandoTextos,             setCargandoTextos]             = useState(false)

  // ── Carga inicial ──────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      // 1. Informe header
      const { data: inf } = await supabase
        .from('informes')
        .select('escuela_id, periodo_mes, periodo_anio')
        .eq('id', id).single()
      if (!inf) return

      // 2. Datos de la escuela (coordenadas + resolución ambiental)
      const { data: esc } = await supabase
        .from('escuelas')
        .select('nombre, latitud, longitud, resolucion_ambiental')
        .eq('id', inf.escuela_id).single()
      if (esc) setEscuela(esc as EscuelaGeo)

      // 3. Registro actual
      const { data: reg } = await supabase
        .from('informe_c1317')
        .select('*')
        .eq('informe_id', id).single()

      if (reg) {
        setIntroduccion(reg.introduccion ?? '')
        setObjetivo(reg.objetivo ?? '')
        setAlcance(reg.alcance ?? '')
        setEspContratista(reg.especialistas_contratista ?? [])
        setEspSupervision(reg.especialistas_supervision ?? [])
        setMarnNumero(reg.marn_numero_permiso ?? '')
        setMarnFechaEmision(reg.marn_fecha_emision ?? '')
        setMarnFechaVencimiento(reg.marn_fecha_vencimiento ?? '')
        setMarnObs(reg.marn_observaciones ?? '')
        setDotNumero(reg.dot_numero_permiso ?? '')
        setDotTipo(reg.dot_tipo_permiso ?? '')
        setDotFechaEmision(reg.dot_fecha_emision ?? '')
        setDotFechaVencimiento(reg.dot_fecha_vencimiento ?? '')
        setDotObs(reg.dot_observaciones ?? '')
        return
      }

      // 4. Si es nuevo: cargar textos del informe anterior
      setCargandoTextos(true)
      const { data: prevInf } = await supabase
        .from('informes').select('id')
        .eq('escuela_id', inf.escuela_id).neq('id', id)
        .or(`periodo_anio.lt.${inf.periodo_anio},and(periodo_anio.eq.${inf.periodo_anio},periodo_mes.lt.${inf.periodo_mes})`)
        .order('periodo_anio', { ascending: false })
        .order('periodo_mes',  { ascending: false })
        .limit(1).single()

      if (prevInf?.id) {
        const { data: prev } = await supabase
          .from('informe_c1317').select('*').eq('informe_id', prevInf.id).single()
        if (prev) {
          setIntroduccion(prev.introduccion ?? '')
          setObjetivo(prev.objetivo ?? '')
          setAlcance(prev.alcance ?? '')
          setEspContratista(prev.especialistas_contratista ?? [])
          setEspSupervision(prev.especialistas_supervision ?? [])
          setMarnNumero(prev.marn_numero_permiso ?? '')
          setMarnFechaEmision(prev.marn_fecha_emision ?? '')
          setMarnFechaVencimiento(prev.marn_fecha_vencimiento ?? '')
          setMarnObs(prev.marn_observaciones ?? '')
          setDotNumero(prev.dot_numero_permiso ?? '')
          setDotTipo(prev.dot_tipo_permiso ?? '')
          setDotFechaEmision(prev.dot_fecha_emision ?? '')
          setDotFechaVencimiento(prev.dot_fecha_vencimiento ?? '')
          setDotObs(prev.dot_observaciones ?? '')
        }
      }
      setCargandoTextos(false)
    }
    load()
  }, [id])

  // ── Guardado ───────────────────────────────────────────────────
  async function onSave() {
    const payload = {
      informe_id:                  id,
      introduccion,
      objetivo,
      alcance,
      especialistas_contratista:   espContratista,
      especialistas_supervision:   espSupervision,
      marn_numero_permiso:         marnNumero   || null,
      marn_fecha_emision:          marnFechaEmision   || null,
      marn_fecha_vencimiento:      marnFechaVencimiento   || null,
      marn_observaciones:          marnObs      || null,
      dot_numero_permiso:          dotNumero    || null,
      dot_tipo_permiso:            dotTipo      || null,
      dot_fecha_emision:           dotFechaEmision    || null,
      dot_fecha_vencimiento:       dotFechaVencimiento    || null,
      dot_observaciones:           dotObs       || null,
    }
    const { error } = await supabase
      .from('informe_c1317')
      .upsert(payload, { onConflict: 'informe_id' })
    if (error) throw new Error(error.message)
  }

  // ── Helpers especialistas ──────────────────────────────────────
  const agregarEsp = (side: 'contratista' | 'supervision') => {
    const nuevo = INIT_ESP()
    if (side === 'contratista') setEspContratista(p => [...p, nuevo])
    else                        setEspSupervision(p => [...p, nuevo])
  }

  const actualizarEsp = (side: 'contratista' | 'supervision', updated: Especialista) => {
    const fn = (prev: Especialista[]) => prev.map(e => e.id === updated.id ? updated : e)
    if (side === 'contratista') setEspContratista(fn)
    else                        setEspSupervision(fn)
  }

  const eliminarEsp = (side: 'contratista' | 'supervision', eid: string) => {
    const fn = (prev: Especialista[]) => prev.filter(e => e.id !== eid)
    if (side === 'contratista') setEspContratista(fn)
    else                        setEspSupervision(fn)
  }

  // ── Mapa ───────────────────────────────────────────────────────
  const lat = escuela?.latitud
  const lon = escuela?.longitud
  const mapSrc = lat && lon
    ? `https://maps.google.com/maps?q=${lat},${lon}&z=17&output=embed`
    : null

  const inp   = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
  const lbl   = 'text-xs text-slate-500 mb-1 block'
  const hdr   = 'text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4 pb-2 border-b border-slate-100'

  // ── JSX ────────────────────────────────────────────────────────
  return (
    <FormWrapper title="Generales del Informe de Supervisión" short="C13-17" informeId={id} onSave={onSave}>
      <div className="space-y-8">

        {/* ── 1. Introducción ──────────────────────────────────── */}
        <section>
          <h3 className={hdr}>Introducción</h3>
          <EditBlock
            titulo="Introducción"
            value={introduccion}
            onChange={setIntroduccion}
            cargando={cargandoTextos}
            placeholder="Describa el contexto general del proyecto y del presente informe mensual..."
          />
        </section>

        {/* ── 2. Objetivo ──────────────────────────────────────── */}
        <section>
          <h3 className={hdr}>Objetivo del Informe</h3>
          <EditBlock
            titulo="Objetivo del informe"
            value={objetivo}
            onChange={setObjetivo}
            cargando={cargandoTextos}
            placeholder="Indique el objetivo general del informe de supervisión ambiental y social..."
          />
        </section>

        {/* ── 3. Alcance ───────────────────────────────────────── */}
        <section>
          <h3 className={hdr}>Alcance de la Supervisión</h3>
          <EditBlock
            titulo="Alcance de la supervisión"
            value={alcance}
            onChange={setAlcance}
            cargando={cargandoTextos}
            placeholder="Describa el alcance de las actividades de supervisión ambiental, social y de seguridad..."
          />
        </section>

        {/* ── 4. Ubicación (Mapa) ──────────────────────────────── */}
        <section>
          <h3 className={hdr}>
            <span className="flex items-center gap-2"><MapPin size={14} /> Ubicación del Centro Educativo</span>
          </h3>
          {mapSrc ? (
            <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
              <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  {escuela?.nombre}
                </span>
                <a
                  href={`https://www.google.com/maps?q=${lat},${lon}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  <MapPin size={11} /> Ver en mapa completo
                </a>
              </div>
              <iframe
                title="Ubicación del centro educativo"
                src={mapSrc}
                className="w-full h-72 border-0"
                loading="lazy"
              />
              <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 flex gap-6">
                <span className="text-xs text-slate-500">
                  <span className="font-medium text-slate-600">Latitud:</span> {lat}
                </span>
                <span className="text-xs text-slate-500">
                  <span className="font-medium text-slate-600">Longitud:</span> {lon}
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-slate-200 h-48 flex flex-col items-center justify-center gap-2 text-slate-400">
              <MapPin size={28} className="text-slate-300" />
              <p className="text-sm">Sin coordenadas registradas para este centro educativo</p>
              <p className="text-xs">Actualiza la latitud y longitud en la ficha de la escuela</p>
            </div>
          )}
        </section>

        {/* ── 5. Especialistas Empresa Contratista ─────────────── */}
        <section>
          <h3 className={hdr}>
            <span className="flex items-center gap-2">
              <Building2 size={14} /> Especialistas — Empresa Contratista (Condición 13)
            </span>
          </h3>
          <div className="space-y-3">
            {espContratista.length === 0 && (
              <p className="text-sm text-slate-400 italic py-3 text-center">
                Sin especialistas registrados. Haz clic en "Registrar especialista" para agregar.
              </p>
            )}
            {espContratista.map(esp => (
              <TarjetaEspecialista
                key={esp.id}
                esp={esp}
                onChange={u => actualizarEsp('contratista', u)}
                onDelete={() => eliminarEsp('contratista', esp.id)}
              />
            ))}
            <button
              type="button"
              onClick={() => agregarEsp('contratista')}
              className="flex items-center gap-2 w-full border-2 border-dashed border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-colors font-medium"
            >
              <UserPlus size={16} />
              Registrar especialista
            </button>
          </div>
        </section>

        {/* ── 6. Especialistas Empresa de Supervisión ──────────── */}
        <section>
          <h3 className={hdr}>
            <span className="flex items-center gap-2">
              <Users size={14} /> Especialistas — Empresa de Supervisión (Condición 17)
            </span>
          </h3>
          <div className="space-y-3">
            {espSupervision.length === 0 && (
              <p className="text-sm text-slate-400 italic py-3 text-center">
                Sin especialistas registrados. Haz clic en "Registrar especialista" para agregar.
              </p>
            )}
            {espSupervision.map(esp => (
              <TarjetaEspecialista
                key={esp.id}
                esp={esp}
                onChange={u => actualizarEsp('supervision', u)}
                onDelete={() => eliminarEsp('supervision', esp.id)}
              />
            ))}
            <button
              type="button"
              onClick={() => agregarEsp('supervision')}
              className="flex items-center gap-2 w-full border-2 border-dashed border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-colors font-medium"
            >
              <UserPlus size={16} />
              Registrar especialista
            </button>
          </div>
        </section>

        {/* ── 7. Resolución Ambiental (MARN) ───────────────────── */}
        <section>
          <h3 className={hdr}>
            <span className="flex items-center gap-2"><Shield size={14} /> Resolución Ambiental — MARN</span>
          </h3>
          {escuela?.resolucion_ambiental ? (
            /* Campo auto desde la base de datos de la escuela */
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
              <Shield size={16} className="text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">
                  Resolución registrada en la escuela
                </p>
                <p className="text-sm text-emerald-900 font-medium">{escuela.resolucion_ambiental}</p>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-700 flex items-center gap-2">
              <Shield size={13} />
              No hay resolución ambiental registrada en la ficha de la escuela. Completa los datos del permiso manualmente.
            </div>
          )}

          <div className="bg-slate-50 rounded-xl p-5 space-y-4 mt-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={lbl}>Número de permiso MARN</label>
                <input value={marnNumero} onChange={e => setMarnNumero(e.target.value)}
                  placeholder="Ej: 0123-2024-MARN" className={inp} />
              </div>
              <div>
                <label className={lbl}>Fecha de emisión</label>
                <input type="date" value={marnFechaEmision}
                  onChange={e => setMarnFechaEmision(e.target.value)} className={inp} />
              </div>
              <div>
                <label className={lbl}>
                  Fecha de vencimiento&nbsp;
                  {marnFechaVencimiento && <BadgeVigencia fecha={marnFechaVencimiento} />}
                </label>
                <input type="date" value={marnFechaVencimiento}
                  onChange={e => setMarnFechaVencimiento(e.target.value)} className={inp} />
              </div>
            </div>
            <div>
              <label className={lbl}>Observaciones / Condiciones del permiso</label>
              <textarea value={marnObs} onChange={e => setMarnObs(e.target.value)} rows={3}
                placeholder="Condiciones ambientales, medidas de mitigación requeridas..."
                className={`${inp} resize-none`} />
            </div>
          </div>
        </section>

        {/* ── 8. Permiso DOT ───────────────────────────────────── */}
        <section>
          <h3 className={hdr}>
            <span className="flex items-center gap-2"><FileCheck size={14} /> Permiso DOT</span>
          </h3>
          <div className="bg-slate-50 rounded-xl p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Número de permiso</label>
                <input value={dotNumero} onChange={e => setDotNumero(e.target.value)}
                  placeholder="Ej: DOT-0456-2024" className={inp} />
              </div>
              <div>
                <label className={lbl}>Tipo de permiso</label>
                <select value={dotTipo} onChange={e => setDotTipo(e.target.value)} className={inp}>
                  <option value="">Seleccionar tipo...</option>
                  <option>Permiso de construcción</option>
                  <option>Permiso de ocupación de vía</option>
                  <option>Licencia de construcción</option>
                  <option>Permiso de demolición</option>
                  <option>Otro</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Fecha de emisión</label>
                <input type="date" value={dotFechaEmision}
                  onChange={e => setDotFechaEmision(e.target.value)} className={inp} />
              </div>
              <div>
                <label className={lbl}>
                  Fecha de vencimiento&nbsp;
                  {dotFechaVencimiento && <BadgeVigencia fecha={dotFechaVencimiento} />}
                </label>
                <input type="date" value={dotFechaVencimiento}
                  onChange={e => setDotFechaVencimiento(e.target.value)} className={inp} />
              </div>
            </div>
            <div>
              <label className={lbl}>Observaciones</label>
              <textarea value={dotObs} onChange={e => setDotObs(e.target.value)} rows={3}
                placeholder="Condiciones del permiso, restricciones de horario, señalización requerida..."
                className={`${inp} resize-none`} />
            </div>
          </div>
        </section>

      </div>
    </FormWrapper>
  )
}
