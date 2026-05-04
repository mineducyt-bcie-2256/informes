'use client'
import { useState, useEffect, useId, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import FormWrapper from '@/components/forms/FormWrapper'
import {
  Pencil, Lock, MapPin, Users, Shield, Trash2,
  Building2, UserPlus
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
  departamento:          string | null
  distrito:              string | null
  latitud:               number | null
  longitud:              number | null
  resolucion_ambiental:  string | null
  fecha_ra:              string | null
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
          {editando ? <><Lock size={12} /> Guardar</> : <><Pencil size={12} /> Editar</>}
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
          {expandido ? (
            <button
              type="button"
              onClick={onDelete}
              className="text-xs text-red-500 hover:text-red-700 hover:underline px-2 font-medium"
            >
              Eliminar
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setExpandido(true)}
              className="text-xs text-blue-600 hover:underline px-2"
            >
              Editar
            </button>
          )}
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
  const [escuela,                    setEscuela]                    = useState<EscuelaGeo | null>(null)
  const [cargandoTextos,             setCargandoTextos]             = useState(false)
  const [sinCambiosJust,             setSinCambiosJust]             = useState('')
  const preloadSnapshot = useRef<string | null>(null)
  const isPreloaded = useRef(false)

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
        .select('*')
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
        }
      }
      setCargandoTextos(false)
    }
    load()
  }, [id])

  // ── Guardado ───────────────────────────────────────────────────
  function getSnapshotData() {
    return { introduccion, objetivo, alcance, espContratista, espSupervision, marnNumero, marnFechaEmision, marnFechaVencimiento, marnObs }
  }

  function isModified() {
    if (!isPreloaded.current || preloadSnapshot.current === null) return true
    return JSON.stringify(getSnapshotData()) !== preloadSnapshot.current
  }

  async function handlePreload() {
    const { data: inf } = await supabase.from('informes').select('escuela_id, periodo_mes, periodo_anio').eq('id', id).single()
    if (!inf) throw new Error('No se encontró el informe actual')
    let mes = inf.periodo_mes - 1, anio = inf.periodo_anio
    if (mes === 0) { mes = 12; anio -= 1 }
    const { data: prevInf } = await supabase.from('informes').select('id').eq('escuela_id', inf.escuela_id).eq('periodo_mes', mes).eq('periodo_anio', anio).single()
    if (!prevInf) throw new Error(`No existe informe del mes anterior (${mes}/${anio})`)
    const { data: prev } = await supabase.from('informe_c1317').select('*').eq('informe_id', prevInf.id).single()
    if (!prev) throw new Error('El informe del mes anterior no tiene datos C1317')
    setIntroduccion(prev.introduccion ?? '')
    setObjetivo(prev.objetivo ?? '')
    setAlcance(prev.alcance ?? '')
    setEspContratista(prev.especialistas_contratista ?? [])
    setEspSupervision(prev.especialistas_supervision ?? [])
    setMarnNumero(prev.marn_numero_permiso ?? '')
    setMarnFechaEmision(prev.marn_fecha_emision ?? '')
    setMarnFechaVencimiento(prev.marn_fecha_vencimiento ?? '')
    setMarnObs(prev.marn_observaciones ?? '')
    setSinCambiosJust('')
    isPreloaded.current = true
    preloadSnapshot.current = JSON.stringify({ introduccion: prev.introduccion ?? '', objetivo: prev.objetivo ?? '', alcance: prev.alcance ?? '', espContratista: prev.especialistas_contratista ?? [], espSupervision: prev.especialistas_supervision ?? [], marnNumero: prev.marn_numero_permiso ?? '', marnFechaEmision: prev.marn_fecha_emision ?? '', marnFechaVencimiento: prev.marn_fecha_vencimiento ?? '', marnObs: prev.marn_observaciones ?? '' })
  }

  async function onSave(justificacion?: string) {
    const just = justificacion ?? sinCambiosJust ?? ''
    if (justificacion) setSinCambiosJust(justificacion)
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
      sin_cambios_justificacion:   just,
    }
    const { error } = await supabase.from('informe_c1317').upsert(payload, { onConflict: 'informe_id' })
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

  // fecha_ra puede estar bajo distintos nombres si fue auto-sanitizado en imports previos
  const fechaRa = escuela?.fecha_ra
    ?? (escuela as any)?.fechas_de_ra
    ?? (escuela as any)?.fecha_de_ra
    ?? null

  const inp   = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
  const lbl   = 'text-xs text-slate-500 mb-1 block'
  const hdr   = 'text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4 pb-2 border-b border-slate-100'

  // ── JSX ────────────────────────────────────────────────────────
  return (
    <FormWrapper title="Generales del Informe de Supervisión" short="C13-17" informeId={id} onSave={onSave} onPreload={handlePreload} isModified={isModified}>
      <div className="space-y-8">

        {sinCambiosJust && (
          <div className="bg-amber-50 border border-amber-300 rounded-lg px-4 py-3 text-sm text-amber-800">
            <span className="font-semibold">ℹ Sin modificaciones — </span>{sinCambiosJust}
          </div>
        )}

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

          <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
            {/* Cabecera con datos del CE */}
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {escuela?.nombre ?? '—'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {[escuela?.departamento, escuela?.distrito].filter(Boolean).join(' · ') || 'Sin departamento / distrito registrado'}
                </p>
              </div>
              {lat && lon && (
                <a
                  href={`https://www.google.com/maps?q=${lat},${lon}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1 shrink-0"
                >
                  <MapPin size={11} /> Ver en Maps
                </a>
              )}
            </div>

            {/* Mapa o aviso */}
            {mapSrc ? (
              <>
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
                  <span className="ml-auto text-xs text-blue-400 font-medium">auto</span>
                </div>
              </>
            ) : (
              <div className="h-36 flex flex-col items-center justify-center gap-2 text-slate-400 bg-white">
                <MapPin size={24} className="text-slate-300" />
                <p className="text-sm">Sin coordenadas — el mapa se mostrará cuando se importen lat/lon</p>
              </div>
            )}
          </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* N° Resolución */}
              <div>
                <label className={lbl}>Resolución ambiental</label>
                <div className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-700 flex items-center justify-between">
                  <span className="font-medium">{escuela.resolucion_ambiental}</span>
                  <span className="ml-2 text-xs text-blue-400 font-medium shrink-0">auto</span>
                </div>
              </div>
              {/* Fecha RA */}
              <div>
                <label className={lbl}>Fecha de resolución ambiental (RA)</label>
                <div className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-700 flex items-center justify-between">
                  <span>{fechaRa ?? '—'}</span>
                  <span className="ml-2 text-xs text-blue-400 font-medium shrink-0">auto</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-800">
              <Shield size={16} className="mt-0.5 shrink-0 text-amber-500" />
              <div>
                <p className="text-sm font-semibold">Sin resolución ambiental registrada</p>
                <p className="text-xs mt-1">
                  Actualiza la columna <strong>Resolución ambiental</strong> y <strong>Fecha RA</strong> en el archivo Excel de escuelas e impórtalo de nuevo.
                </p>
              </div>
            </div>
          )}
        </section>


      </div>
    </FormWrapper>
  )
}
