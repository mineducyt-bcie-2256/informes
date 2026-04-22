'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import FormWrapper from '@/components/forms/FormWrapper'
import EscuelaInfoHeader from '@/components/forms/EscuelaInfoHeader'
import DescripcionCondicion from '@/components/forms/DescripcionCondicion'
import { Wind, Volume2, XCircle } from 'lucide-react'

// ── Clasificaciones de calidad de aire ──────────────────────────
const CLASIFICACIONES_AIRE = [
  {
    key: 'material_particulado',
    label: 'Material particulado',
    actividades: ['Tráfico en vías internas', 'Excavaciones', 'Corte y pulido de ladrillo, concreto o pisos', 'Otros'],
    noRegistrado: false,
  },
  {
    key: 'emisiones',
    label: 'Emisiones de fuentes móviles y fijas',
    actividades: ['Escapes de automotores', 'Fuentes fijas de combustión', 'Otros'],
    noRegistrado: true,
  },
  {
    key: 'cov',
    label: 'Compuestos Orgánicos Volátiles (COV) — Pulverización de pinturas (Aerosol/Compresor)',
    actividades: [],
    noRegistrado: true,
  },
]

// ── Clasificación acústica (indicador único fusionado) ───────────
const CLASIFICACION_ACUSTICA = {
  key: 'acustica_general',
  label: 'Contaminación acústica',
  fuentes: [
    'Uso de maquinaria',
    'Uso de herramientas',
    'Activación de sirenas',
    'Ruidos generales de las actividades del proyecto',
    'Compresores',
    'Plantas eléctricas',
  ],
}

// ── Tablas de clasificación automática ──────────────────────────
type Clasificacion = { categoria: string; color: string; detalle: string }

const COLORES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  green:  { bg: 'bg-green-50',  text: 'text-green-800',  border: 'border-green-300',  dot: 'bg-green-500' },
  lime:   { bg: 'bg-lime-50',   text: 'text-lime-800',   border: 'border-lime-300',   dot: 'bg-lime-500' },
  yellow: { bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-300', dot: 'bg-yellow-500' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-300', dot: 'bg-orange-500' },
  red:    { bg: 'bg-red-50',    text: 'text-red-800',    border: 'border-red-300',    dot: 'bg-red-500' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-300', dot: 'bg-purple-500' },
  brown:  { bg: 'bg-stone-100', text: 'text-stone-800',  border: 'border-stone-400',  dot: 'bg-stone-600' },
}

function clasificarICA(v: number): Clasificacion {
  if (v <= 50)  return { categoria: 'Buena',                       color: 'green',  detalle: 'Sin riesgo' }
  if (v <= 100) return { categoria: 'Moderada',                    color: 'yellow', detalle: 'Afecta a personas sensibles' }
  if (v <= 150) return { categoria: 'No saludable para sensibles', color: 'orange', detalle: 'Riesgos para asmáticos, ancianos y niños' }
  if (v <= 200) return { categoria: 'No saludable',                color: 'red',    detalle: 'Riesgo para la población en general' }
  if (v <= 300) return { categoria: 'Muy no saludable',            color: 'purple', detalle: 'Mayor riesgo para todos' }
  return               { categoria: 'Peligrosa',                   color: 'brown',  detalle: 'Emergencia sanitaria' }
}
function clasificarPM10(v: number): Clasificacion {
  if (v <= 20)  return { categoria: 'Buena',               color: 'green',  detalle: 'Sin riesgo para la salud' }
  if (v <= 40)  return { categoria: 'Aceptable',           color: 'lime',   detalle: 'Puede afectar ligeramente a sensibles' }
  if (v <= 75)  return { categoria: 'Regular',             color: 'yellow', detalle: 'Precaución para grupos vulnerables' }
  if (v <= 150) return { categoria: 'Mala',                color: 'orange', detalle: 'Efectos adversos leves a moderados' }
  if (v <= 250) return { categoria: 'Muy mala',            color: 'red',    detalle: 'Riesgo claro a la salud' }
  return               { categoria: 'Extremadamente mala', color: 'brown',  detalle: 'Riesgo grave para la salud' }
}
function clasificarPM25(v: number): Clasificacion {
  if (v <= 12.0)  return { categoria: 'Buena',                       color: 'green',  detalle: 'Aire limpio, sin riesgo' }
  if (v <= 35.4)  return { categoria: 'Moderada',                    color: 'yellow', detalle: 'Riesgo para grupos sensibles' }
  if (v <= 55.4)  return { categoria: 'No saludable para sensibles', color: 'orange', detalle: 'Riesgo para niños, ancianos y personas con asma' }
  if (v <= 150.4) return { categoria: 'No saludable',                color: 'red',    detalle: 'Afecta a la mayoría de la población' }
  if (v <= 250.4) return { categoria: 'Muy no saludable',            color: 'purple', detalle: 'Riesgo serio para todos' }
  return                 { categoria: 'Peligrosa',                   color: 'brown',  detalle: 'Riesgo severo, emergencia sanitaria' }
}
function clasificarRuido(v: number): Clasificacion {
  if (v <= 40)  return { categoria: 'Muy silencioso',               color: 'green',  detalle: 'Ambiente muy tranquilo' }
  if (v <= 50)  return { categoria: 'Silencioso',                   color: 'lime',   detalle: 'Ambiente tranquilo' }
  if (v <= 60)  return { categoria: 'Nivel aceptable',              color: 'yellow', detalle: 'Dentro de rangos normales' }
  if (v <= 70)  return { categoria: 'Algo molesto',                 color: 'orange', detalle: 'Puede generar incomodidad' }
  if (v <= 85)  return { categoria: 'Molesto / Riesgo prolongado',  color: 'red',    detalle: 'Exposición prolongada es dañina' }
  if (v <= 100) return { categoria: 'Riesgo para la salud auditiva',color: 'purple', detalle: 'Requiere protección auditiva obligatoria' }
  return               { categoria: 'Dolor / Daño inmediato',       color: 'brown',  detalle: 'Riesgo severo, daño auditivo inmediato' }
}

function clasificarCO2(v: number): Clasificacion {
  if (v <= 700)   return { categoria: 'Excelente',               color: 'green',  detalle: 'Nivel cercano al aire exterior (base natural ≈ 400 ppm)' }
  if (v <= 1000)  return { categoria: 'Aceptable',               color: 'lime',   detalle: 'Condiciones de ventilación adecuadas' }
  if (v <= 1500)  return { categoria: 'Moderada',                color: 'yellow', detalle: 'Se percibe "aire viciado", posible incomodidad' }
  if (v <= 2000)  return { categoria: 'Deficiente',              color: 'orange', detalle: 'Somnolencia, baja concentración, es necesario ventilar' }
  if (v <= 5000)  return { categoria: 'Pobre / Riesgosa',        color: 'red',    detalle: 'Dolor de cabeza, fatiga, afectación del desempeño' }
  if (v <= 10000) return { categoria: 'Nivel máximo exposición', color: 'purple', detalle: 'Límite de exposición laboral 8h (según OSHA/NIOSH)' }
  return                 { categoria: 'Nivel peligroso',         color: 'brown',  detalle: 'Puede causar efectos fisiológicos graves' }
}

// ── Badge de clasificación automática ───────────────────────────
function ClasifBadge({ valor, fn }: { valor: string; fn: (v: number) => Clasificacion }) {
  const num = parseFloat(valor)
  if (!valor || isNaN(num)) return null
  const c = fn(num)
  const col = COLORES[c.color]
  return (
    <div className={`flex items-start gap-2 mt-1.5 px-3 py-2 rounded-lg border text-xs ${col.bg} ${col.border}`}>
      <span className={`w-2.5 h-2.5 rounded-full shrink-0 mt-0.5 ${col.dot}`} />
      <span className={`font-semibold ${col.text}`}>{c.categoria}</span>
      <span className={`${col.text} opacity-80`}>— {c.detalle}</span>
    </div>
  )
}

// ── Tipos ────────────────────────────────────────────────────────
type MedicionAire = {
  clasificacion: string
  actividades: string[]
  actividades_otro: string
  no_registrado: boolean
  motivo_no_registro: string
  pm10: string; pm25: string; ica: string; co2: string
  equipo_tecnica: string; medidas_ambientales: string
}
type MedicionAcustica = {
  clasificacion: string
  fuentes: string[]
  db: string; equipo_tecnica: string; medidas_ambientales: string
  no_registrado: boolean; motivo_no_registro: string
}

const AIRE_VACIA = (key: string): MedicionAire => ({
  clasificacion: key, actividades: [], actividades_otro: '',
  no_registrado: false, motivo_no_registro: '',
  pm10: '', pm25: '', ica: '', co2: '',
  equipo_tecnica: '', medidas_ambientales: '',
})
const ACUSTICA_VACIA = (key: string): MedicionAcustica => ({
  clasificacion: key, fuentes: [], db: '', equipo_tecnica: '', medidas_ambientales: '',
  no_registrado: false, motivo_no_registro: '',
})

const INIT = {
  descripcion_condicion: '',
  mediciones_aire:     [] as MedicionAire[],
  mediciones_acustica: [] as MedicionAcustica[],
}

const inputCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const taCls    = `${inputCls} resize-none`

// ════════════════════════════════════════════════════════════════
// SECCIÓN CALIDAD DEL AIRE
// ════════════════════════════════════════════════════════════════
function SeccionCalidadAire({ mediciones, onChange }: { mediciones: MedicionAire[]; onChange: (v: MedicionAire[]) => void }) {
  function getMed(key: string) { return mediciones.find(m => m.clasificacion === key) }

  function toggle(key: string) {
    if (getMed(key)) onChange(mediciones.filter(m => m.clasificacion !== key))
    else onChange([...mediciones, AIRE_VACIA(key)])
  }

  function updateField(key: string, field: keyof MedicionAire, value: any) {
    onChange(mediciones.map(m => m.clasificacion === key ? { ...m, [field]: value } : m))
  }

  function toggleActividad(key: string, act: string) {
    const med = getMed(key)
    if (!med) return
    const acts = med.actividades.includes(act)
      ? med.actividades.filter(a => a !== act)
      : [...med.actividades, act]
    updateField(key, 'actividades', acts)
  }

  function toggleNoRegistrado(key: string) {
    const med = getMed(key)
    if (!med) return
    const nuevoValor = !med.no_registrado
    onChange(mediciones.map(m =>
      m.clasificacion === key
        ? { ...m, no_registrado: nuevoValor, motivo_no_registro: nuevoValor ? m.motivo_no_registro : '' }
        : m
    ))
  }

  return (
    <section>
      <div className="mb-4 pb-2 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Calidad del Aire (Emisiones Atmosféricas)</h3>
      </div>
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-5">
        <Wind size={16} className="text-blue-500 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">El objetivo de esta medición es evitar que el material particulado afecte la salud de los trabajadores y de las comunidades vecinas.</p>
      </div>

      <div className="space-y-3">
        {CLASIFICACIONES_AIRE.map(({ key, label, actividades, noRegistrado }) => {
          const med = getMed(key)
          const activa = !!med
          return (
            <div key={key} className={`rounded-xl border transition-all overflow-hidden ${activa ? 'border-blue-300' : 'border-slate-200'}`}>

              {/* Checkbox principal */}
              <label className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${activa ? 'bg-blue-50' : 'bg-white hover:bg-slate-50'}`}>
                <input type="checkbox" checked={activa} onChange={() => toggle(key)} className="w-4 h-4 text-blue-600 rounded shrink-0 mt-0.5" />
                <p className={`text-sm font-medium ${activa ? 'text-blue-900' : 'text-slate-700'}`}>{label}</p>
              </label>

              {activa && med && (
                <div className="border-t border-blue-100 bg-white px-4 py-4 space-y-4">

                  {/* Actividades generadoras */}
                  {actividades.length > 0 && (
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-2 block">Actividades generadoras</label>
                      <div className="flex flex-wrap gap-2">
                        {actividades.map(act => {
                          const sel = med.actividades.includes(act)
                          return (
                            <label key={act} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer text-xs transition-all ${sel ? 'border-blue-400 bg-blue-50 text-blue-800 font-medium' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                              <input type="checkbox" checked={sel} onChange={() => toggleActividad(key, act)} className="w-3 h-3 text-blue-600 rounded" />
                              {act}
                            </label>
                          )
                        })}
                      </div>
                      {/* Campo "Otros" */}
                      {med.actividades.includes('Otros') && (
                        <div className="mt-2">
                          <input type="text" value={med.actividades_otro}
                            onChange={e => updateField(key, 'actividades_otro', e.target.value)}
                            placeholder="Especifique la actividad..."
                            className={inputCls} />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Botón No se registraron (solo para COV y Emisiones) */}
                  {noRegistrado && (
                    <div>
                      <button type="button"
                        onClick={() => toggleNoRegistrado(key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                          med.no_registrado
                            ? 'bg-slate-100 border-slate-400 text-slate-700'
                            : 'border-slate-300 text-slate-500 hover:border-slate-400 hover:bg-slate-50'
                        }`}>
                        <XCircle size={14} className={med.no_registrado ? 'text-slate-600' : 'text-slate-400'} />
                        No se registraron estos parámetros
                      </button>

                      {med.no_registrado && (
                        <div className="mt-2">
                          <label className="text-xs font-medium text-slate-600 mb-1 block">Motivo o justificación</label>
                          <textarea value={med.motivo_no_registro}
                            onChange={e => updateField(key, 'motivo_no_registro', e.target.value)}
                            rows={2} placeholder="Explique por qué no se realizaron las mediciones..."
                            className={taCls} />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Parámetros de medición (solo si NO marcó "no registrado") */}
                  {!med.no_registrado && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* PM10 */}
                        <div>
                          <label className="text-xs font-medium text-slate-600 mb-1 block">PM10 <span className="text-slate-400 font-normal">(µg/m³)</span></label>
                          <input type="number" step="0.01" min="0" value={med.pm10}
                            onChange={e => updateField(key, 'pm10', e.target.value)}
                            placeholder="Ej: 35.0" className={inputCls} />
                          <ClasifBadge valor={med.pm10} fn={clasificarPM10} />
                        </div>
                        {/* PM2.5 */}
                        <div>
                          <label className="text-xs font-medium text-slate-600 mb-1 block">PM2.5 <span className="text-slate-400 font-normal">(µg/m³)</span></label>
                          <input type="number" step="0.01" min="0" value={med.pm25}
                            onChange={e => updateField(key, 'pm25', e.target.value)}
                            placeholder="Ej: 12.8" className={inputCls} />
                          <ClasifBadge valor={med.pm25} fn={clasificarPM25} />
                          {med.pm25 && (
                            <p className="text-xs text-slate-400 italic mt-1.5">⚠ El PM2.5 puede penetrar profundamente en los pulmones e incluso llegar al torrente sanguíneo.</p>
                          )}
                        </div>
                        {/* ICA */}
                        <div>
                          <label className="text-xs font-medium text-slate-600 mb-1 block">Calidad de Aire <span className="text-slate-400 font-normal">(ICA)</span></label>
                          <input type="number" step="1" min="0" value={med.ica}
                            onChange={e => updateField(key, 'ica', e.target.value)}
                            placeholder="Ej: 45" className={inputCls} />
                          <ClasifBadge valor={med.ica} fn={clasificarICA} />
                        </div>
                        {/* CO2 */}
                        <div>
                          <label className="text-xs font-medium text-slate-600 mb-1 block">Concentración CO₂ <span className="text-slate-400 font-normal">(ppm)</span></label>
                          <input type="number" step="1" min="0" value={med.co2}
                            onChange={e => updateField(key, 'co2', e.target.value)}
                            placeholder="Ej: 850" className={inputCls} />
                          <ClasifBadge valor={med.co2} fn={clasificarCO2} />
                        </div>
                      </div>

                      {/* Equipo */}
                      <div>
                        <label className="text-xs font-medium text-slate-600 mb-1 block">Equipo y técnica utilizada</label>
                        <input type="text" value={med.equipo_tecnica}
                          onChange={e => updateField(key, 'equipo_tecnica', e.target.value)}
                          placeholder="Ej: Monitor óptico de partículas, método gravimétrico..."
                          className={inputCls} />
                      </div>

                      {/* Medidas */}
                      <div>
                        <label className="text-xs font-medium text-slate-600 mb-1 block">Medidas ambientales y de seguridad implementadas</label>
                        <textarea value={med.medidas_ambientales}
                          onChange={e => updateField(key, 'medidas_ambientales', e.target.value)}
                          rows={3} placeholder="Ej: Riego de vías, mascarillas N95, barreras de contención..."
                          className={taCls} />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ════════════════════════════════════════════════════════════════
// SECCIÓN CONTAMINACIÓN ACÚSTICA
// ════════════════════════════════════════════════════════════════
function SeccionContaminacionAcustica({ mediciones, onChange }: { mediciones: MedicionAcustica[]; onChange: (v: MedicionAcustica[]) => void }) {
  const { key, label, fuentes } = CLASIFICACION_ACUSTICA
  const med = mediciones.find(m => m.clasificacion === key)
  const activa = !!med

  function toggle() {
    if (med) onChange(mediciones.filter(m => m.clasificacion !== key))
    else onChange([...mediciones, ACUSTICA_VACIA(key)])
  }

  function updateField(field: keyof MedicionAcustica, value: any) {
    onChange(mediciones.map(m => m.clasificacion === key ? { ...m, [field]: value } : m))
  }

  function toggleFuente(fuente: string) {
    if (!med) return
    const next = med.fuentes.includes(fuente)
      ? med.fuentes.filter(f => f !== fuente)
      : [...med.fuentes, fuente]
    updateField('fuentes', next)
  }

  function toggleNoRegistrado() {
    if (!med) return
    const nuevoValor = !med.no_registrado
    onChange(mediciones.map(m =>
      m.clasificacion === key
        ? { ...m, no_registrado: nuevoValor, motivo_no_registro: nuevoValor ? m.motivo_no_registro : '' }
        : m
    ))
  }

  return (
    <section>
      <div className="mb-4 pb-2 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Contaminación Acústica</h3>
      </div>
      <div className="flex items-start gap-3 bg-purple-50 border border-purple-100 rounded-xl px-4 py-3 mb-5">
        <Volume2 size={16} className="text-purple-500 shrink-0 mt-0.5" />
        <p className="text-sm text-purple-800">Al ser uno de los aspectos que genera mayor incomodidad entre vecinos y trabajadores, es necesario su seguimiento.</p>
      </div>

      <div className={`rounded-xl border transition-all overflow-hidden ${activa ? 'border-purple-300' : 'border-slate-200'}`}>

        {/* Checkbox principal */}
        <label className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${activa ? 'bg-purple-50' : 'bg-white hover:bg-slate-50'}`}>
          <input type="checkbox" checked={activa} onChange={toggle} className="w-4 h-4 text-purple-600 rounded shrink-0 mt-0.5" />
          <p className={`text-sm font-medium ${activa ? 'text-purple-900' : 'text-slate-700'}`}>{label}</p>
        </label>

        {activa && med && (
          <div className="border-t border-purple-100 bg-white px-4 py-4 space-y-4">

            {/* Sub-checklist de fuentes generadoras */}
            <div>
              <label className="text-xs font-medium text-slate-600 mb-2 block">Fuentes generadoras de ruido</label>
              <div className="flex flex-wrap gap-2">
                {fuentes.map(fuente => {
                  const sel = med.fuentes.includes(fuente)
                  return (
                    <label key={fuente} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer text-xs transition-all ${sel ? 'border-purple-400 bg-purple-50 text-purple-800 font-medium' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                      <input type="checkbox" checked={sel} onChange={() => toggleFuente(fuente)} className="w-3 h-3 text-purple-600 rounded" />
                      {fuente}
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Botón no registrado */}
            <div>
              <button type="button"
                onClick={toggleNoRegistrado}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                  med.no_registrado
                    ? 'bg-slate-100 border-slate-400 text-slate-700'
                    : 'border-slate-300 text-slate-500 hover:border-slate-400 hover:bg-slate-50'
                }`}>
                <XCircle size={14} className={med.no_registrado ? 'text-slate-600' : 'text-slate-400'} />
                No se registraron estos parámetros
              </button>
              {med.no_registrado && (
                <div className="mt-2">
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Motivo o justificación</label>
                  <textarea value={med.motivo_no_registro}
                    onChange={e => updateField('motivo_no_registro', e.target.value)}
                    rows={2} placeholder="Explique por qué no se realizaron las mediciones..."
                    className={taCls} />
                </div>
              )}
            </div>

            {/* Campos de medición */}
            {!med.no_registrado && (
              <>
                <div className="max-w-xs">
                  <label className="text-xs font-medium text-slate-600 mb-1 block">
                    Nivel de ruido <span className="text-slate-400 font-normal">(dB)</span>
                  </label>
                  <input type="number" step="0.1" min="0" value={med.db}
                    onChange={e => updateField('db', e.target.value)}
                    placeholder="Ej: 75.5" className={inputCls} />
                  <ClasifBadge valor={med.db} fn={clasificarRuido} />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Equipo y técnica utilizada</label>
                  <input type="text" value={med.equipo_tecnica}
                    onChange={e => updateField('equipo_tecnica', e.target.value)}
                    placeholder="Ej: Sonómetro digital tipo 2, medición en campo abierto..."
                    className={inputCls} />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Medidas ambientales y de seguridad implementadas</label>
                  <textarea value={med.medidas_ambientales}
                    onChange={e => updateField('medidas_ambientales', e.target.value)}
                    rows={3} placeholder="Ej: Restricción de horario, protectores auditivos, barreras acústicas..."
                    className={taCls} />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

// ════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ════════════════════════════════════════════════════════════════
export default function McearPage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState(INIT)
  const [autoLoaded, setAutoLoaded] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: d } = await supabase.from('informe_mcear').select('*').eq('informe_id', id).single()
      if (d) {
        setData({ ...INIT, ...d, mediciones_aire: d.mediciones_aire ?? [], mediciones_acustica: d.mediciones_acustica ?? [] })
      } else {
        const { data: inf } = await supabase.from('informes').select('escuela_id, periodo_mes, periodo_anio').eq('id', id).single()
        if (inf) {
          const { data: prev } = await supabase.from('informes').select('id')
            .eq('escuela_id', inf.escuela_id).neq('id', id)
            .or(`periodo_anio.lt.${inf.periodo_anio},and(periodo_anio.eq.${inf.periodo_anio},periodo_mes.lt.${inf.periodo_mes})`)
            .order('periodo_anio', { ascending: false }).order('periodo_mes', { ascending: false })
            .limit(1).single()
          if (prev) {
            const { data: pm } = await supabase.from('informe_mcear')
              .select('mediciones_aire, mediciones_acustica').eq('informe_id', prev.id).single()
            if (pm?.mediciones_aire?.length || pm?.mediciones_acustica?.length) {
              const aireLimpias = (pm.mediciones_aire ?? []).map((m: MedicionAire) => ({
                ...m, pm10: '', pm25: '', ica: '', co2: '', motivo_no_registro: '', no_registrado: false,
              }))
              const acusticaLimpias = (pm.mediciones_acustica ?? []).map((m: MedicionAcustica) => ({ ...m, fuentes: m.fuentes ?? [], db: '' }))
              setData(p => ({ ...p, mediciones_aire: aireLimpias, mediciones_acustica: acusticaLimpias }))
              setAutoLoaded(true)
            }
          }
        }
      }
    }
    load()
  }, [id])

  function set(field: string, value: any) { setData(prev => ({ ...prev, [field]: value })) }

  async function onSave() {
    const { error } = await supabase.from('informe_mcear').upsert({ ...data, informe_id: id }, { onConflict: 'informe_id' })
    if (error) throw new Error(error.message)
  }

  return (
    <FormWrapper title="Condición 4 - Monitoreo de Calidad del Aire y Emisiones" short="MCEAR" informeId={id} onSave={onSave}>
      <div className="space-y-8">

        <EscuelaInfoHeader informeId={id} />

        {autoLoaded && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <span className="text-amber-500 text-lg leading-none mt-0.5">↺</span>
            <div>
              <p className="text-sm font-semibold text-amber-800">Datos cargados del informe anterior</p>
              <p className="text-xs text-amber-700 mt-0.5">Las clasificaciones se copiaron del mes anterior. Los valores de medición fueron reiniciados para ingresar datos actuales.</p>
            </div>
          </div>
        )}

        <DescripcionCondicion informeId={id} tabla="informe_mcear" value={data.descripcion_condicion} onChange={v => set('descripcion_condicion', v)} />

        <SeccionCalidadAire
          mediciones={data.mediciones_aire}
          onChange={v => set('mediciones_aire', v)}
        />

        <SeccionContaminacionAcustica
          mediciones={data.mediciones_acustica}
          onChange={v => set('mediciones_acustica', v)}
        />

      </div>
    </FormWrapper>
  )
}
