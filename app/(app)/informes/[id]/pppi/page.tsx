'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import FormWrapper from '@/components/forms/FormWrapper'
import EscuelaInfoHeader from '@/components/forms/EscuelaInfoHeader'
import DescripcionCondicion from '@/components/forms/DescripcionCondicion'
import CapacitacionesSection from '@/components/forms/CapacitacionesSection'
import RegistroFotografico, { type Foto } from '@/components/forms/RegistroFotografico'
import { Users, AlertTriangle, Bell, CheckCircle2 } from 'lucide-react'
import SeccionIndicadoresImpacto, {
  INDICADORES_INIT, type IndicadoresImpacto,
} from '@/components/forms/IndicadoresImpacto'

// ── Normaliza porcentaje_avance (0.98 → 98 | 98 → 98) ───────────
function parseAvance(val: string | null): number {
  if (!val) return 0
  const n = parseFloat(val)
  if (isNaN(n)) return 0
  return n <= 1 ? Math.round(n * 100) : Math.round(n)
}

// ── Partes Interesadas ───────────────────────────────────────────
const PARTES_FIJAS = [
  { key: 'alumnos',    label: 'Alumnos' },
  { key: 'profesores', label: 'Profesores' },
  { key: 'director',   label: 'Director' },
  { key: 'cde',        label: 'CDE' },
]

// PartesMap acepta claves fijas + claves custom_N con label opcional
type ParteVal = { activa: boolean; hombres: number; mujeres: number; label?: string }
type PartesMap = Record<string, ParteVal>

const PARTES_INIT: PartesMap = {
  alumnos:    { activa: false, hombres: 0, mujeres: 0 },
  profesores: { activa: false, hombres: 0, mujeres: 0 },
  director:   { activa: false, hombres: 0, mujeres: 0 },
  cde:        { activa: false, hombres: 0, mujeres: 0 },
}

// ── Estado inicial ───────────────────────────────────────────────
const INIT = {
  descripcion_condicion: '',
  partes_interesadas: PARTES_INIT as PartesMap,
  socializacion1_fecha: '', socializacion2_fecha: '', socializacion3_fecha: '',
  comentarios_socializacion: '',
  tiene_capacitaciones: '',
  capacitaciones_list: [] as any[],
  indicadores_impacto: INDICADORES_INIT as IndicadoresImpacto,
  observaciones: '',
  fotos: [] as Foto[],
  sin_cambios_justificacion: '',
}

const inputCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const numCls = 'w-full border rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors'

// ── Sección Partes Interesadas ───────────────────────────────────
function SeccionPartesInteresadas({ partes, onChange }: { partes: PartesMap; onChange: (v: PartesMap) => void }) {
  // Claves custom (las que no están en PARTES_FIJAS)
  const fijaKeys = PARTES_FIJAS.map(p => p.key)
  const customKeys = Object.keys(partes).filter(k => !fijaKeys.includes(k))

  // Todas las entradas activas para el total
  const todasActivas = Object.entries(partes).filter(([, v]) => v.activa)
  const totalH = todasActivas.reduce((s, [, v]) => s + (v.hombres ?? 0), 0)
  const totalM = todasActivas.reduce((s, [, v]) => s + (v.mujeres ?? 0), 0)
  const hayActivas = todasActivas.length > 0

  function setVal(key: string, field: keyof ParteVal, val: any) {
    onChange({ ...partes, [key]: { ...partes[key], [field]: val } })
  }
  function addCustom() {
    const newKey = `custom_${Date.now()}`
    onChange({ ...partes, [newKey]: { activa: true, hombres: 0, mujeres: 0, label: '' } })
  }
  function removeCustom(key: string) {
    const next = { ...partes }
    delete next[key]
    onChange(next)
  }

  function FilaParte({ parteKey, label, editable = false }: { parteKey: string; label: string; editable?: boolean }) {
    const p = partes[parteKey] ?? { activa: false, hombres: 0, mujeres: 0 }
    const total = (p.hombres ?? 0) + (p.mujeres ?? 0)
    return (
      <div className={`grid gap-0 items-center px-4 py-3 transition-colors ${editable ? 'grid-cols-[1fr_90px_90px_80px_32px]' : 'grid-cols-[1fr_90px_90px_80px]'} ${p.activa ? 'bg-white' : 'bg-slate-50/50'}`}>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={!!p.activa} onChange={() => setVal(parteKey, 'activa', !p.activa)}
            className="w-4 h-4 text-blue-600 rounded shrink-0" />
          {editable ? (
            <input type="text" value={p.label ?? ''} placeholder="Nombre del grupo..."
              onChange={e => setVal(parteKey, 'label', e.target.value)}
              className="text-sm border-b border-dashed border-slate-300 focus:outline-none focus:border-blue-500 bg-transparent flex-1" />
          ) : (
            <span className={`text-sm font-medium ${p.activa ? 'text-slate-800' : 'text-slate-400'}`}>{label}</span>
          )}
        </label>
        <div className="px-2">
          <input type="number" min={0} value={p.activa ? (p.hombres || '') : ''} disabled={!p.activa}
            onChange={e => setVal(parteKey, 'hombres', Math.max(0, parseInt(e.target.value) || 0))} placeholder="0"
            className={`${numCls} ${p.activa ? 'border-slate-300 bg-white text-slate-800' : 'border-slate-200 bg-slate-100 text-slate-300 cursor-not-allowed'}`} />
        </div>
        <div className="px-2">
          <input type="number" min={0} value={p.activa ? (p.mujeres || '') : ''} disabled={!p.activa}
            onChange={e => setVal(parteKey, 'mujeres', Math.max(0, parseInt(e.target.value) || 0))} placeholder="0"
            className={`${numCls} ${p.activa ? 'border-slate-300 bg-white text-slate-800' : 'border-slate-200 bg-slate-100 text-slate-300 cursor-not-allowed'}`} />
        </div>
        <div className="px-2 text-center">
          {p.activa
            ? <span className={`inline-block min-w-[40px] px-2 py-1.5 rounded-lg text-sm font-semibold ${total > 0 ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-400'}`}>{total}</span>
            : <span className="text-slate-300 text-sm">—</span>}
        </div>
        {editable && (
          <button type="button" onClick={() => removeCustom(parteKey)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors text-xs">✕</button>
        )}
      </div>
    )
  }

  return (
    <section>
      <div className="mb-4 pb-2 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Partes Interesadas</h3>
      </div>
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-5">
        <Users size={16} className="text-blue-500 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">Registre las partes interesadas presentes en el periodo, indicando la cantidad de participantes por género.</p>
      </div>

      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-[1fr_90px_90px_80px] gap-0 bg-slate-50 border-b border-slate-200 px-4 py-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Parte interesada</span>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide text-center">Hombres</span>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide text-center">Mujeres</span>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide text-center">Total</span>
        </div>
        <div className="divide-y divide-slate-100">
          {PARTES_FIJAS.map(({ key, label }) => (
            <FilaParte key={key} parteKey={key} label={label} />
          ))}
          {customKeys.map(k => (
            <FilaParte key={k} parteKey={k} label={partes[k]?.label ?? ''} editable />
          ))}
        </div>
        {hayActivas && (
          <div className="grid grid-cols-[1fr_90px_90px_80px] gap-0 items-center px-4 py-2.5 bg-blue-600 border-t border-blue-700">
            <span className="text-xs font-bold text-white uppercase tracking-wide">Total general</span>
            <div className="px-2 text-center"><span className="text-sm font-bold text-white">{totalH}</span></div>
            <div className="px-2 text-center"><span className="text-sm font-bold text-white">{totalM}</span></div>
            <div className="px-2 text-center"><span className="text-sm font-bold text-white bg-white/20 px-2 py-1 rounded-lg">{totalH + totalM}</span></div>
          </div>
        )}
      </div>

      {/* Botón agregar otro */}
      <button type="button" onClick={addCustom}
        className="mt-3 flex items-center gap-2 px-4 py-2 border border-dashed border-slate-300 rounded-xl text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors w-full justify-center">
        <span className="text-lg leading-none">+</span> Agregar otro grupo
      </button>
    </section>
  )
}

// ════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ════════════════════════════════════════════════════════════════
export default function PppiPage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState(INIT)
  const [avancePct, setAvancePct] = useState<number>(0)
  const [autoLoaded, setAutoLoaded] = useState(false)
  const preloadSnapshot = useRef<string | null>(null)
  const isPreloaded = useRef(false)
  const [periodoMes, setPeriodoMes]   = useState<number>(new Date().getMonth() + 1)
  const [periodoAnio, setPeriodoAnio] = useState<number>(new Date().getFullYear())
  const [hssoHombres, setHssoHombres] = useState<number>(0)
  const [hssoMujeres, setHssoMujeres] = useState<number>(0)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      await fetch('/api/migrate-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'informe_pppi' }),
      })
      // 1. Intentar cargar datos guardados del informe actual
      const { data: d } = await supabase.from('informe_pppi').select('*').eq('informe_id', id).single()

      if (d) {
        setData({
          ...INIT, ...d,
          partes_interesadas:  d.partes_interesadas  ?? PARTES_INIT,
          indicadores_impacto: d.indicadores_impacto ?? INDICADORES_INIT,
        })
      } else {
        // Sin datos aún → buscar informe anterior para precargar partes e imágenes 2 y 3
        const { data: inf } = await supabase
          .from('informes').select('escuela_id, periodo_mes, periodo_anio').eq('id', id).single()

        if (inf) {
          const { data: prev } = await supabase
            .from('informes').select('id')
            .eq('escuela_id', inf.escuela_id).neq('id', id)
            .or(`periodo_anio.lt.${inf.periodo_anio},and(periodo_anio.eq.${inf.periodo_anio},periodo_mes.lt.${inf.periodo_mes})`)
            .order('periodo_anio', { ascending: false })
            .order('periodo_mes', { ascending: false })
            .limit(1).single()

          if (prev?.id) {
            const { data: pm } = await supabase
              .from('informe_pppi')
              .select('partes_interesadas, socializacion1_fecha, socializacion2_fecha, socializacion3_fecha, comentarios_socializacion, tiene_capacitaciones, capacitaciones_list')
              .eq('informe_id', prev.id).single()

            if (pm) {
              setData(p => ({
                ...p,
                partes_interesadas:        pm.partes_interesadas        ?? PARTES_INIT,
                socializacion1_fecha:      pm.socializacion1_fecha       ?? '',
                socializacion2_fecha:      pm.socializacion2_fecha       ?? '',
                socializacion3_fecha:      pm.socializacion3_fecha       ?? '',
                comentarios_socializacion: pm.comentarios_socializacion  ?? '',
                tiene_capacitaciones:      pm.tiene_capacitaciones       ?? '',
                capacitaciones_list:       pm.capacitaciones_list        ?? [],
              }))
              setAutoLoaded(true)
            }
          }
        }
      }

      // 2. Cargar porcentaje de avance + periodo + datos HSSO
      const { data: inf2 } = await supabase
        .from('informes').select('escuela_id, periodo_mes, periodo_anio').eq('id', id).single()
      if (inf2) {
        if (inf2.periodo_mes)  setPeriodoMes(inf2.periodo_mes)
        if (inf2.periodo_anio) setPeriodoAnio(inf2.periodo_anio)
        const { data: esc } = await supabase.from('escuelas').select('porcentaje_avance').eq('id', inf2.escuela_id).single()
        if (esc) setAvancePct(parseAvance(esc.porcentaje_avance))
        // HSSO: personal hombres/mujeres
        const { data: hsso } = await supabase
          .from('informe_hsso').select('personal_hombres, personal_mujeres').eq('informe_id', id).single()
        if (hsso) {
          setHssoHombres(parseInt(hsso.personal_hombres) || 0)
          setHssoMujeres(parseInt(hsso.personal_mujeres) || 0)
        }
      }
    }
    load()
  }, [id])

  function set(f: string, v: any) { setData(p => ({ ...p, [f]: v })) }

  function isModified() {
    if (!isPreloaded.current || preloadSnapshot.current === null) return true
    return JSON.stringify({ ...data, sin_cambios_justificacion: '' }) !== preloadSnapshot.current
  }

  async function handlePreload() {
    const { data: inf } = await supabase.from('informes').select('escuela_id, periodo_mes, periodo_anio').eq('id', id).single()
    if (!inf) throw new Error('No se encontró el informe actual')
    let mes = inf.periodo_mes - 1, anio = inf.periodo_anio
    if (mes === 0) { mes = 12; anio -= 1 }
    const { data: prevInf } = await supabase.from('informes').select('id').eq('escuela_id', inf.escuela_id).eq('periodo_mes', mes).eq('periodo_anio', anio).single()
    if (!prevInf) throw new Error(`No existe informe del mes anterior (${mes}/${anio})`)
    const { data: prev } = await supabase.from('informe_pppi').select('*').eq('informe_id', prevInf.id).single()
    if (!prev) throw new Error('El informe del mes anterior no tiene datos PPPI')
    const { id: _id, informe_id, fotos, sin_cambios_justificacion, ...campos } = prev
    const dp = { ...INIT, ...campos, partes_interesadas: campos.partes_interesadas ?? PARTES_INIT, indicadores_impacto: campos.indicadores_impacto ?? INDICADORES_INIT, fotos: [], sin_cambios_justificacion: '' }
    setData(dp)
    isPreloaded.current = true
    preloadSnapshot.current = JSON.stringify({ ...dp, sin_cambios_justificacion: '' })
  }

  async function onSave(justificacion?: string) {
    const payload = Object.fromEntries(Object.entries({ ...data, sin_cambios_justificacion: justificacion ?? data.sin_cambios_justificacion ?? '' }).map(([k, v]) => [k, v === '' ? null : v]))
    const { error } = await supabase.from('informe_pppi').upsert({ ...payload, informe_id: id }, { onConflict: 'informe_id' })
    if (error) throw new Error(error.message)
  }

  const dateInput = (f: keyof typeof INIT) => (
    <input type="date" value={(data[f] as string)?.split('T')[0] ?? ''} onChange={e => set(f, e.target.value)}
      className={inputCls} />
  )

  return (
    <FormWrapper title="Condición 5 - Partes Interesadas y Código de Conducta" short="PPPI" informeId={id} onSave={onSave} onPreload={handlePreload} isModified={isModified}>
      <div className="space-y-8">

        <EscuelaInfoHeader informeId={id} />

        {data.sin_cambios_justificacion && (
          <div className="bg-amber-50 border border-amber-300 rounded-lg px-4 py-3 text-sm text-amber-800">
            <span className="font-semibold">ℹ Sin modificaciones — </span>{data.sin_cambios_justificacion}
          </div>
        )}

        {autoLoaded && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <span className="text-amber-500 text-lg leading-none mt-0.5">↺</span>
            <div>
              <p className="text-sm font-semibold text-amber-800">Datos cargados del informe anterior</p>
              <p className="text-xs text-amber-700 mt-0.5">Las partes interesadas y socializaciones se copiaron del mes anterior. Actualice los valores que correspondan al periodo actual.</p>
            </div>
          </div>
        )}

        <DescripcionCondicion
          informeId={id}
          tabla="informe_pppi"
          value={data.descripcion_condicion}
          onChange={v => set('descripcion_condicion', v)}
        />

        <SeccionPartesInteresadas
          partes={data.partes_interesadas}
          onChange={v => set('partes_interesadas', v)}
        />

        <section>
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4 pb-2 border-b border-slate-100">Socializaciones con partes interesadas</h3>

          {/* Barra de avance actual */}
          {avancePct > 0 && (
            <div className="mb-5 flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
              <span className="text-xs font-medium text-slate-500 shrink-0">Avance actual del proyecto</span>
              <div className="flex-1 bg-slate-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${avancePct >= 90 ? 'bg-orange-500' : avancePct >= 70 ? 'bg-blue-500' : 'bg-green-500'}`}
                  style={{ width: `${avancePct}%` }}
                />
              </div>
              <span className={`text-sm font-bold shrink-0 ${avancePct >= 90 ? 'text-orange-600' : avancePct >= 70 ? 'text-blue-600' : 'text-green-600'}`}>
                {avancePct}%
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">

            {/* 1ª Socialización */}
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">1ª Socialización</label>
              {dateInput('socializacion1_fecha')}
              {data.socializacion1_fecha && (
                <div className="flex items-center gap-1.5 mt-1.5 text-xs text-green-600">
                  <CheckCircle2 size={12} /> <span>Registrada</span>
                </div>
              )}
            </div>

            {/* 2ª Socialización — alerta 70-90%, rojo si > 90% sin registrar */}
            <div>
              <label className={`text-xs font-medium mb-1 block ${
                avancePct > 90 && !data.socializacion2_fecha ? 'text-red-600' :
                avancePct >= 70 && avancePct <= 90 ? 'text-blue-600' : 'text-slate-500'
              }`}>
                2ª Socialización
                {avancePct >= 70 && avancePct <= 90 && <span className="ml-1 font-normal text-blue-500">(70–90% ejecución)</span>}
                {avancePct > 90 && !data.socializacion2_fecha && <span className="ml-1 font-bold text-red-600">⚠ requerida</span>}
              </label>
              <input
                type="date"
                value={data.socializacion2_fecha?.split('T')[0] ?? ''}
                onChange={e => set('socializacion2_fecha', e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-colors ${
                  avancePct > 90 && !data.socializacion2_fecha
                    ? 'border-red-400 bg-red-50 focus:ring-red-400 text-red-700'
                    : avancePct >= 70 && avancePct <= 90
                    ? 'border-blue-400 bg-blue-50 focus:ring-blue-400'
                    : 'border-slate-300 focus:ring-blue-500'
                }`}
              />

              {/* Aviso: rango activo 70-90% */}
              {avancePct >= 70 && avancePct <= 90 && !data.socializacion2_fecha && (
                <div className="flex items-start gap-2 mt-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
                  <Bell size={13} className="text-blue-500 shrink-0 mt-0.5" />
                  <span>El avance está en <strong>{avancePct}%</strong>. Es el momento de realizar la 2ª Socialización.</span>
                </div>
              )}

              {/* Alerta crítica: pasó el 90% sin registrar */}
              {avancePct > 90 && !data.socializacion2_fecha && (
                <div className="flex items-start gap-2 mt-2 px-3 py-2 bg-red-50 border border-red-300 rounded-lg text-xs text-red-800">
                  <AlertTriangle size={13} className="text-red-500 shrink-0 mt-0.5" />
                  <span>El avance superó el 90% <strong>({avancePct}%)</strong> y la 2ª Socialización no ha sido registrada. Se requiere acción inmediata.</span>
                </div>
              )}

              {data.socializacion2_fecha && (
                <div className="flex items-center gap-1.5 mt-1.5 text-xs text-green-600">
                  <CheckCircle2 size={12} /> <span>Registrada</span>
                </div>
              )}
            </div>

            {/* 3ª Socialización — aviso desde 90.01% */}
            <div>
              <label className={`text-xs font-medium mb-1 block ${
                avancePct > 90 && !data.socializacion3_fecha ? 'text-orange-600' : 'text-slate-500'
              }`}>
                3ª Socialización
                {avancePct > 90 && !data.socializacion3_fecha && <span className="ml-1 font-normal text-orange-500">(90–100% ejecución)</span>}
              </label>
              <input
                type="date"
                value={data.socializacion3_fecha?.split('T')[0] ?? ''}
                onChange={e => set('socializacion3_fecha', e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-colors ${
                  avancePct > 90 && !data.socializacion3_fecha
                    ? 'border-orange-400 bg-orange-50 focus:ring-orange-400'
                    : 'border-slate-300 focus:ring-blue-500'
                }`}
              />

              {/* Aviso: rango activo 90.01-100% */}
              {avancePct > 90 && !data.socializacion3_fecha && (
                <div className="flex items-start gap-2 mt-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-800">
                  <Bell size={13} className="text-orange-500 shrink-0 mt-0.5" />
                  <span>El avance está en <strong>{avancePct}%</strong>. Es el momento de realizar la 3ª Socialización.</span>
                </div>
              )}

              {data.socializacion3_fecha && (
                <div className="flex items-center gap-1.5 mt-1.5 text-xs text-green-600">
                  <CheckCircle2 size={12} /> <span>Registrada</span>
                </div>
              )}
            </div>

          </div>
        </section>

        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">Comentarios generales de la Participación de Partes Interesadas</label>
          <textarea
            value={data.comentarios_socializacion}
            onChange={e => set('comentarios_socializacion', e.target.value)}
            rows={3}
            placeholder="Observaciones, acuerdos o aspectos relevantes de las socializaciones realizadas..."
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <SeccionIndicadoresImpacto
          indicadores={data.indicadores_impacto}
          onChange={v => set('indicadores_impacto', v)}
          periodoMes={periodoMes}
          periodoAnio={periodoAnio}
          hssoHombres={hssoHombres}
          hssoMujeres={hssoMujeres}
        />

        <CapacitacionesSection
          tieneCapacitaciones={data.tiene_capacitaciones}
          capacitaciones={data.capacitaciones_list}
          onChangeTiene={v => set('tiene_capacitaciones', v)}
          onChangeCapacitaciones={v => set('capacitaciones_list', v)}
        />

        <RegistroFotografico
          fotos={data.fotos ?? []}
          onChange={v => set('fotos', v)}
        />

      </div>
    </FormWrapper>
  )
}
