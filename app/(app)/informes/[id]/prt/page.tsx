'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import FormWrapper from '@/components/forms/FormWrapper'
import EscuelaInfoHeader from '@/components/forms/EscuelaInfoHeader'
import DescripcionCondicion from '@/components/forms/DescripcionCondicion'
import RegistroFotografico, { type Foto } from '@/components/forms/RegistroFotografico'
import { Plus, Trash2, Monitor, Users, MapPin, Wrench, X } from 'lucide-react'

// ════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════
type RubroRow = {
  id:            string
  nombre:        string
  personalizado: boolean
  activo:        boolean
  unidad:        string
  cantidad:      number
  costo_unitario:number
}

type LugarData = {
  id:              string
  direccion:       string
  est_ninos:       number
  est_ninas:       number
  doc_hombres:     number
  doc_mujeres:     number
  condicion_uso:   string   // 'Alquiler' | 'Préstamo' | 'Otros' | ''
  condicion_otros: string
  rubros:          RubroRow[]
  adec_tiene:      string   // 'Sí' | 'No' | ''
  adec_costo:      string
  adecuaciones:    AdecuacionesMap
}

type Adecuacion      = { activa: boolean; descripcion: string }
type AdecuacionesMap = Record<string, Adecuacion>

// ════════════════════════════════════════════════════════════════
// CATÁLOGOS
// ════════════════════════════════════════════════════════════════
const ADECUACION_KEYS = [
  'Aulas', 'Sanitarios', 'Sistema eléctrico',
  'Abastecimiento de agua', 'Sala de maestros', 'Dirección', 'Áreas recreativas',
]

const RUBROS_BASE = [
  'Alquiler de lugar',
  'Energía eléctrica',
  'Agua potable',
  'Internet',
  'Servicios sanitarios',
]

function unidadesDeRubro(nombre: string): string[] {
  if (nombre === 'Alquiler de lugar') return ['Alquiler', 'Préstamo']
  return ['Pago mensual empresa', 'Pago mensual CE', 'Subsidiado']
}

/** Determina si el rubro tiene campos numéricos activos */
function tieneNumericos(r: RubroRow): boolean {
  if (!r.activo || !r.unidad) return false
  if (r.nombre === 'Alquiler de lugar') return r.unidad === 'Alquiler'
  return r.unidad === 'Pago mensual empresa' || r.unidad === 'Pago mensual CE'
}

// ════════════════════════════════════════════════════════════════
// CREADORES
// ════════════════════════════════════════════════════════════════
function crearRubros(): RubroRow[] {
  return RUBROS_BASE.map(nombre => ({
    id:             nombre.toLowerCase().replace(/\s+/g, '-'),
    nombre,
    personalizado:  false,
    activo:         false,
    unidad:         '',
    cantidad:       1,
    costo_unitario: 0,
  }))
}

function crearLugar(): LugarData {
  return {
    id: String(Date.now()), direccion: '',
    est_ninos: 0, est_ninas: 0, doc_hombres: 0, doc_mujeres: 0,
    condicion_uso: '', condicion_otros: '', rubros: crearRubros(),
    adec_tiene: '', adec_costo: '',
    adecuaciones: Object.fromEntries(ADECUACION_KEYS.map(k => [k, { activa: false, descripcion: '' }])),
  }
}

const INIT = {
  descripcion_condicion: '',
  modalidad:             [] as string[],
  lugares:               [crearLugar()] as LugarData[],
  virtual:               crearLugar() as LugarData,
  fotos:                 [] as Foto[],
}

// ── Estilos comunes ───────────────────────────────────────────────
const inputCls   = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const numCls     = `${inputCls} [appearance:textfield]`
const taCls      = `${inputCls} resize-none`
const sectionHdr = 'text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4 pb-2 border-b border-slate-100'

// ════════════════════════════════════════════════════════════════
// COMPONENTE: TABLA DE RUBROS
// ════════════════════════════════════════════════════════════════
function TablaRubros({ rubros, onChange }: { rubros: RubroRow[]; onChange: (r: RubroRow[]) => void }) {
  function updRubro(i: number, field: keyof RubroRow, value: any) {
    onChange(rubros.map((r, idx) => {
      if (idx !== i) return r
      const next = { ...r, [field]: value }
      if (field === 'activo' && !value) { next.unidad = ''; next.cantidad = 1; next.costo_unitario = 0 }
      if (field === 'unidad')           { next.cantidad = 1; next.costo_unitario = 0 }
      return next
    }))
  }

  function addRubro() {
    onChange([...rubros, {
      id: String(Date.now()), nombre: '', personalizado: true,
      activo: true, unidad: '', cantidad: 1, costo_unitario: 0,
    }])
  }

  function delRubro(i: number) { onChange(rubros.filter((_, idx) => idx !== i)) }

  const totalGeneral = rubros.reduce((s, r) => s + (tieneNumericos(r) ? r.cantidad * r.costo_unitario : 0), 0)
  const hayTotales   = rubros.some(tieneNumericos)

  const thCls = 'px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase tracking-wide bg-slate-50'
  const tdCls = 'px-4 py-3'

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-slate-200">
              <th className={`${thCls} text-left w-52`}>Rubro</th>
              <th className={`${thCls} text-left w-48`}>Unidad</th>
              <th className={`${thCls} text-right w-24`}>Cantidad</th>
              <th className={`${thCls} text-right w-32`}>Costo unitario</th>
              <th className={`${thCls} text-right w-28`}>Total</th>
              <th className="bg-slate-50 w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rubros.map((r, i) => {
              const num      = tieneNumericos(r)
              const total    = num ? r.cantidad * r.costo_unitario : 0
              const opciones = unidadesDeRubro(r.nombre || '')

              return (
                <tr key={r.id} className={r.activo ? 'bg-white' : 'bg-slate-50/60'}>
                  {/* Rubro */}
                  <td className={tdCls}>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={r.activo}
                        onChange={e => updRubro(i, 'activo', e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded shrink-0" />
                      {r.personalizado
                        ? <input value={r.nombre} onChange={e => updRubro(i, 'nombre', e.target.value)}
                            placeholder="Nombre del rubro..."
                            className="text-sm border-b border-slate-300 focus:outline-none focus:border-blue-500 bg-transparent w-full" />
                        : <span className={`text-sm ${r.activo ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>{r.nombre}</span>
                      }
                    </label>
                  </td>

                  {/* Unidad */}
                  <td className={tdCls}>
                    {r.activo
                      ? <select value={r.unidad} onChange={e => updRubro(i, 'unidad', e.target.value)}
                          className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option value="">Seleccionar...</option>
                          {opciones.map(u => <option key={u}>{u}</option>)}
                        </select>
                      : <span className="text-slate-300 text-xs select-none">—</span>
                    }
                  </td>

                  {/* Cantidad */}
                  <td className={`${tdCls} text-right`}>
                    {num
                      ? <input type="number" min={0} step={1} value={r.cantidad}
                          onChange={e => updRubro(i, 'cantidad', parseFloat(e.target.value) || 0)}
                          className="w-20 border border-slate-300 rounded-lg px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] ml-auto block" />
                      : <span className="text-slate-300 text-xs">—</span>
                    }
                  </td>

                  {/* Costo unitario */}
                  <td className={`${tdCls} text-right`}>
                    {num
                      ? <div className="relative w-28 ml-auto">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                          <input type="number" min={0} step={0.01} value={r.costo_unitario}
                            onChange={e => updRubro(i, 'costo_unitario', parseFloat(e.target.value) || 0)}
                            className="w-full border border-slate-300 rounded-lg pl-5 pr-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield]" />
                        </div>
                      : <span className="text-slate-300 text-xs">—</span>
                    }
                  </td>

                  {/* Total fila */}
                  <td className={`${tdCls} text-right`}>
                    {num
                      ? <span className="text-sm font-semibold text-blue-700">
                          ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      : <span className="text-slate-300 text-xs">—</span>
                    }
                  </td>

                  {/* Eliminar (solo personalizados) */}
                  <td className="px-2 py-3 text-center">
                    {r.personalizado && (
                      <button type="button" onClick={() => delRubro(i)}
                        className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                        <X size={13} />
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>

          {/* Total general */}
          {hayTotales && (
            <tfoot>
              <tr className="bg-blue-50 border-t-2 border-blue-200">
                <td colSpan={4} className="px-4 py-2.5 text-sm font-semibold text-blue-900 text-right">
                  Total mensual estimado
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span className="text-base font-black text-blue-700">
                    ${totalGeneral.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Agregar rubro extra */}
      <button type="button" onClick={addRubro}
        className="mt-2 flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors">
        <Plus size={13} /> Agregar otro rubro
      </button>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// COMPONENTE: TARJETA DE LUGAR
// ════════════════════════════════════════════════════════════════
function TarjetaLugar({
  lugar, index, totalLugares, onChange, onDelete,
  titulo, labelEstudiantes, nota,
}: {
  lugar: LugarData; index: number; totalLugares: number
  onChange: (l: LugarData) => void
  onDelete: () => void
  titulo?: string
  labelEstudiantes?: string
  nota?: string
}) {
  function upd(field: keyof LugarData, value: any) { onChange({ ...lugar, [field]: value }) }

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      {/* Cabecera */}
      <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5 border-b border-slate-200">
        <div className="flex items-center gap-2 min-w-0">
          <MapPin size={14} className="text-blue-500 shrink-0" />
          <span className="text-xs font-bold text-slate-500 uppercase shrink-0">
            {titulo ?? `Sitio ${index + 1}`}
          </span>
          {lugar.direccion && (
            <span className="text-sm text-slate-700 font-medium truncate">{lugar.direccion}</span>
          )}
        </div>
        {totalLugares > 1 && !titulo && (
          <button type="button" onClick={onDelete}
            className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors shrink-0 ml-2">
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <div className="bg-white px-4 py-5 space-y-5">

        {/* Nota informativa (solo si se pasa) */}
        {nota && (
          <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3">
            <span className="text-indigo-500 text-base">ℹ️</span>
            <p className="text-xs text-indigo-700 font-medium">{nota}</p>
          </div>
        )}

        {/* Dirección */}
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">Dirección del sitio de reubicación</label>
          <input value={lugar.direccion} onChange={e => upd('direccion', e.target.value)}
            placeholder="Dirección completa del sitio..."
            className={inputCls} />
        </div>

        {/* Personal por sitio */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Estudiantes */}
          <div className="border border-slate-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Users size={13} /> {labelEstudiantes ?? 'Cantidad de estudiantes'}
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Niños',  val: lugar.est_ninos,  field: 'est_ninos'  },
                { label: 'Niñas',  val: lugar.est_ninas,  field: 'est_ninas'  },
              ].map(({ label, val, field }) => (
                <div key={field}>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">{label}</label>
                  <input type="number" min={0} value={val}
                    onChange={e => upd(field as keyof LugarData, parseInt(e.target.value) || 0)}
                    className={numCls} />
                </div>
              ))}
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Total</label>
                <div className="relative">
                  <input type="number" value={lugar.est_ninos + lugar.est_ninas} readOnly
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-500 cursor-default" />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-blue-500 font-medium">auto</span>
                </div>
              </div>
            </div>
          </div>

          {/* Docentes */}
          <div className="border border-slate-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Users size={13} /> Cantidad de docentes
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Hombres', val: lugar.doc_hombres, field: 'doc_hombres' },
                { label: 'Mujeres', val: lugar.doc_mujeres, field: 'doc_mujeres' },
              ].map(({ label, val, field }) => (
                <div key={field}>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">{label}</label>
                  <input type="number" min={0} value={val}
                    onChange={e => upd(field as keyof LugarData, parseInt(e.target.value) || 0)}
                    className={numCls} />
                </div>
              ))}
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Total</label>
                <div className="relative">
                  <input type="number" value={lugar.doc_hombres + lugar.doc_mujeres} readOnly
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-500 cursor-default" />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-blue-500 font-medium">auto</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Condición de uso */}
        <div>
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3 block">
            Condición de uso
          </label>
          <div className="flex gap-3 flex-wrap">
            {['Alquiler', 'Préstamo', 'Otros'].map(op => (
              <button key={op} type="button"
                onClick={() => upd('condicion_uso', lugar.condicion_uso === op ? '' : op)}
                className={`px-5 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                  lugar.condicion_uso === op
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}>
                {op}
              </button>
            ))}
          </div>
          {lugar.condicion_uso === 'Otros' && (
            <div className="mt-3">
              <label className="text-xs font-medium text-slate-600 mb-1 block">Descripción</label>
              <input value={lugar.condicion_otros} onChange={e => upd('condicion_otros', e.target.value)}
                placeholder="Describa la condición de uso..."
                className={inputCls} />
            </div>
          )}
        </div>

        {/* Tabla de costos — solo si Alquiler */}
        {lugar.condicion_uso === 'Alquiler' && (
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3 block">
              Rubros y costos de la reubicación
            </label>
            <TablaRubros
              rubros={lugar.rubros}
              onChange={rubros => upd('rubros', rubros)} />
          </div>
        )}

        {/* Adecuaciones realizadas */}
        <div>
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3 flex items-center gap-1.5 block">
            <Wrench size={13} /> Adecuaciones realizadas
          </label>
          <div className="flex gap-3 mb-4">
            {['Sí', 'No'].map(op => (
              <button key={op} type="button"
                onClick={() => upd('adec_tiene', lugar.adec_tiene === op ? '' : op)}
                className={`px-5 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                  lugar.adec_tiene === op
                    ? op === 'Sí' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-400 bg-slate-50 text-slate-700'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}>
                {op}
              </button>
            ))}
          </div>

          {lugar.adec_tiene === 'Sí' && (
            <div className="space-y-4">
              {/* Costo */}
              <div className="max-w-xs">
                <label className="text-xs font-medium text-slate-600 mb-1 block">Costo de adecuaciones (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">$</span>
                  <input type="number" step="0.01" min={0}
                    value={lugar.adec_costo}
                    onChange={e => upd('adec_costo', e.target.value)}
                    placeholder="0.00"
                    className="w-full border border-slate-300 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              {/* Checklist */}
              <div className="space-y-2">
                {ADECUACION_KEYS.map(k => {
                  const adec = lugar.adecuaciones?.[k] ?? { activa: false, descripcion: '' }
                  return (
                    <div key={k} className={`rounded-xl border overflow-hidden transition-all ${adec.activa ? 'border-blue-300' : 'border-slate-200'}`}>
                      <label className={`flex items-center gap-3 px-4 py-3 cursor-pointer ${adec.activa ? 'bg-blue-50' : 'bg-white hover:bg-slate-50'}`}>
                        <input type="checkbox" checked={adec.activa}
                          onChange={() => upd('adecuaciones', {
                            ...lugar.adecuaciones,
                            [k]: { activa: !adec.activa, descripcion: adec.activa ? '' : adec.descripcion },
                          })}
                          className="w-4 h-4 text-blue-600 rounded shrink-0" />
                        <span className={`text-sm font-medium ${adec.activa ? 'text-blue-900' : 'text-slate-700'}`}>{k}</span>
                      </label>
                      {adec.activa && (
                        <div className="border-t border-blue-100 bg-white px-4 py-3">
                          <label className="text-xs font-medium text-slate-600 mb-1 block">Descripción</label>
                          <textarea value={adec.descripcion}
                            onChange={e => upd('adecuaciones', {
                              ...lugar.adecuaciones,
                              [k]: { ...adec, descripcion: e.target.value },
                            })}
                            rows={2} placeholder={`Describa las adecuaciones en ${k.toLowerCase()}...`}
                            className={taCls} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {lugar.adec_tiene === 'No' && (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
              <span className="text-sm text-slate-500">No se reportan adecuaciones para este sitio.</span>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ════════════════════════════════════════════════════════════════
export default function PrtPage() {
  const { id } = useParams<{ id: string }>()
  const [form, setForm] = useState(INIT)
  const supabase = createClient()

  useEffect(() => {
    fetch('/api/migrate-form', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'informe_prt' }),
    }).finally(() => {
      supabase.from('informe_prt').select('*').eq('informe_id', id).single()
        .then(({ data: d }) => {
          if (!d) return
          setForm({
            descripcion_condicion: d.descripcion_condicion ?? '',
            modalidad:             d.modalidad ?? [],
            lugares:               d.lugares?.length ? d.lugares : [crearLugar()],
            virtual:               d.virtual ?? crearLugar(),
            fotos:                 d.fotos ?? [],
          })
        })
    })
  }, [id])

  function set<K extends keyof typeof INIT>(f: K, v: (typeof INIT)[K]) {
    setForm(p => ({ ...p, [f]: v }))
  }

  const esPresencial = form.modalidad.includes('Presencial')
  const esVirtual    = form.modalidad.includes('Virtual')
  const esMultimodal = esPresencial && esVirtual

  function toggleModalidad(m: string) {
    setForm(p => {
      const ya = p.modalidad.includes(m)
      return { ...p, modalidad: ya ? p.modalidad.filter(x => x !== m) : [...p.modalidad, m] }
    })
  }

  // Lugares
  function addLugar()              { set('lugares', [...form.lugares, crearLugar()]) }
  function delLugar(i: number)     { set('lugares', form.lugares.filter((_, idx) => idx !== i)) }
  function updLugar(i: number, l: LugarData) {
    set('lugares', form.lugares.map((x, idx) => idx === i ? l : x))
  }

  async function onSave() {
    // Totales agregados de todos los sitios
    const totalEstNinos   = form.lugares.reduce((s, l) => s + (l.est_ninos   || 0), 0)
    const totalEstNinas   = form.lugares.reduce((s, l) => s + (l.est_ninas   || 0), 0)
    const totalDocHombres = form.lugares.reduce((s, l) => s + (l.doc_hombres || 0), 0)
    const totalDocMujeres = form.lugares.reduce((s, l) => s + (l.doc_mujeres || 0), 0)

    const payload: Record<string, any> = {
      informe_id:            id,
      descripcion_condicion: form.descripcion_condicion,
      modalidad:             form.modalidad,
      lugares:               form.lugares,
      est_ninos:             totalEstNinos,
      est_ninas:             totalEstNinas,
      num_estudiantes:       totalEstNinos + totalEstNinas,
      doc_hombres:           totalDocHombres,
      doc_mujeres:           totalDocMujeres,
      num_maestros:          totalDocHombres + totalDocMujeres,
      virtual:               form.virtual,
      tipo_continuidad:      form.modalidad.join(', '),
      lugar_reubicacion:     form.lugares.map(l => l.direccion).filter(Boolean).join(' / '),
      tipo_uso:              [...new Set(form.lugares.map(l => l.condicion_uso).filter(Boolean))].join(', '),
      fotos:                 form.fotos,
    }
    const { error } = await supabase.from('informe_prt').upsert(payload, { onConflict: 'informe_id' })
    if (error) throw new Error(error.message)
  }

  // ── Análisis consolidado ──────────────────────────────────────
  function SeccionAnalisis() {
    const tienePresencial = esPresencial && form.lugares.some(l => l.direccion || l.est_ninos || l.est_ninas)
    const tieneVirtual    = esVirtual && (form.virtual.est_ninos || form.virtual.est_ninas || form.virtual.doc_hombres || form.virtual.doc_mujeres)
    if (!tienePresencial && !tieneVirtual) return null

    // ── Población ───────────────────────────────────────────────
    type FilaPob = { label: string; ninos: number; ninas: number; estTotal: number; hDoc: number; mDoc: number; docTotal: number; badge?: string }
    const filasPob: FilaPob[] = []

    if (esPresencial) {
      form.lugares.forEach((l, i) => {
        filasPob.push({
          label:    l.direccion ? `Sitio ${i + 1} — ${l.direccion}` : `Sitio ${i + 1}`,
          ninos:    l.est_ninos, ninas: l.est_ninas, estTotal: l.est_ninos + l.est_ninas,
          hDoc:     l.doc_hombres, mDoc: l.doc_mujeres, docTotal: l.doc_hombres + l.doc_mujeres,
          badge:    'Presencial',
        })
      })
    }
    if (esVirtual) {
      const v = form.virtual
      filasPob.push({
        label:    'Reubicación virtual (maestros)',
        ninos:    v.est_ninos, ninas: v.est_ninas, estTotal: v.est_ninos + v.est_ninas,
        hDoc:     v.doc_hombres, mDoc: v.doc_mujeres, docTotal: v.doc_hombres + v.doc_mujeres,
        badge:    'Virtual',
      })
    }

    const totEst = filasPob.reduce((s, f) => s + f.estTotal, 0)
    const totDoc = filasPob.reduce((s, f) => s + f.docTotal, 0)
    const totNinos = filasPob.reduce((s, f) => s + f.ninos, 0)
    const totNinas = filasPob.reduce((s, f) => s + f.ninas, 0)
    const totHDoc  = filasPob.reduce((s, f) => s + f.hDoc, 0)
    const totMDoc  = filasPob.reduce((s, f) => s + f.mDoc, 0)

    // ── Costos ──────────────────────────────────────────────────
    type FilaCosto = { sitio: string; rubros: { nombre: string; unidad: string; cantidad: number; costo: number; total: number }[]; totalSitio: number }
    const filasCosto: FilaCosto[] = []
    if (esPresencial) {
      form.lugares.forEach((l, i) => {
        if (l.condicion_uso !== 'Alquiler') return
        const rubrosActivos = l.rubros.filter(tieneNumericos)
        if (!rubrosActivos.length) return
        filasCosto.push({
          sitio:      l.direccion ? `Sitio ${i + 1} — ${l.direccion}` : `Sitio ${i + 1}`,
          rubros:     rubrosActivos.map(r => ({ nombre: r.nombre, unidad: r.unidad, cantidad: r.cantidad, costo: r.costo_unitario, total: r.cantidad * r.costo_unitario })),
          totalSitio: rubrosActivos.reduce((s, r) => s + r.cantidad * r.costo_unitario, 0),
        })
      })
    }
    const totalCostos = filasCosto.reduce((s, f) => s + f.totalSitio, 0)

    // ── Adecuaciones ────────────────────────────────────────────
    type FilaAdec = { sitio: string; tiene: string; costo: string; items: string[] }
    const filasAdec: FilaAdec[] = []
    if (esPresencial) {
      form.lugares.forEach((l, i) => {
        if (!l.adec_tiene) return
        filasAdec.push({
          sitio: l.direccion ? `Sitio ${i + 1} — ${l.direccion}` : `Sitio ${i + 1}`,
          tiene: l.adec_tiene,
          costo: l.adec_tiene === 'Sí' && l.adec_costo ? `$${parseFloat(l.adec_costo).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—',
          items: l.adec_tiene === 'Sí' ? Object.entries(l.adecuaciones ?? {}).filter(([, v]) => v.activa).map(([k]) => k) : [],
        })
      })
    }
    const totalAdec = filasAdec.filter(f => f.tiene === 'Sí').reduce((s, f) => {
      const n = parseFloat(form.lugares.find((_, i) => `Sitio ${i + 1}` === f.sitio.split(' —')[0].trim())?.adec_costo || '0') || 0
      return s + n
    }, 0)

    const thCls  = 'px-3 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wide bg-slate-50 text-left'
    const tdCls  = 'px-3 py-2.5 text-sm text-slate-700'
    const tdNum  = 'px-3 py-2.5 text-sm text-slate-700 text-right font-medium'
    const fmtUSD = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

    return (
      <section>
        <h3 className={sectionHdr}>Análisis y consolidado de la reubicación</h3>
        <div className="space-y-6">

          {/* ── Tarjetas resumen ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-blue-600 text-white rounded-xl p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide opacity-80">Total estudiantes</p>
              <p className="text-3xl font-black mt-1">{totEst}</p>
              <p className="text-xs opacity-70 mt-1">{totNinos} niños · {totNinas} niñas</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total docentes</p>
              <p className="text-3xl font-black text-slate-800 mt-1">{totDoc}</p>
              <p className="text-xs text-slate-400 mt-1">{totHDoc} hombres · {totMDoc} mujeres</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Sitios presenciales</p>
              <p className="text-3xl font-black text-slate-800 mt-1">{esPresencial ? form.lugares.length : 0}</p>
              <p className="text-xs text-slate-400 mt-1">{filasCosto.length} con costo de alquiler</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Costo total estimado</p>
              <p className="text-2xl font-black text-green-700 mt-1">{fmtUSD(totalCostos)}</p>
              <p className="text-xs text-slate-400 mt-1">mensual</p>
            </div>
          </div>

          {/* ── Tabla de población ── */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Población por sitio</p>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm min-w-[560px]">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className={thCls}>Sitio / Modalidad</th>
                    <th className={`${thCls} text-right`}>Niños</th>
                    <th className={`${thCls} text-right`}>Niñas</th>
                    <th className={`${thCls} text-right`}>Est. Total</th>
                    <th className={`${thCls} text-right`}>Doc. H</th>
                    <th className={`${thCls} text-right`}>Doc. M</th>
                    <th className={`${thCls} text-right`}>Doc. Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filasPob.map((f, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className={tdCls}>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${f.badge === 'Virtual' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'}`}>{f.badge}</span>
                          <span className="truncate max-w-[180px]">{f.label}</span>
                        </div>
                      </td>
                      <td className={tdNum}>{f.ninos}</td>
                      <td className={tdNum}>{f.ninas}</td>
                      <td className={`${tdNum} font-bold text-blue-700`}>{f.estTotal}</td>
                      <td className={tdNum}>{f.hDoc}</td>
                      <td className={tdNum}>{f.mDoc}</td>
                      <td className={`${tdNum} font-bold text-slate-800`}>{f.docTotal}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-blue-50 border-t-2 border-blue-200">
                    <td className="px-3 py-2.5 text-sm font-bold text-blue-900">TOTAL GENERAL</td>
                    <td className={`${tdNum} text-blue-800 font-bold`}>{totNinos}</td>
                    <td className={`${tdNum} text-blue-800 font-bold`}>{totNinas}</td>
                    <td className={`${tdNum} text-blue-900 font-black text-base`}>{totEst}</td>
                    <td className={`${tdNum} text-blue-800 font-bold`}>{totHDoc}</td>
                    <td className={`${tdNum} text-blue-800 font-bold`}>{totMDoc}</td>
                    <td className={`${tdNum} text-blue-900 font-black text-base`}>{totDoc}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* ── Tabla de costos ── */}
          {filasCosto.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Consolidado de costos de reubicación</p>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-sm min-w-[560px]">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className={thCls}>Sitio</th>
                      <th className={thCls}>Rubro</th>
                      <th className={thCls}>Unidad</th>
                      <th className={`${thCls} text-right`}>Cant.</th>
                      <th className={`${thCls} text-right`}>Costo unit.</th>
                      <th className={`${thCls} text-right`}>Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filasCosto.map((fc, fi) =>
                      fc.rubros.map((r, ri) => (
                        <tr key={`${fi}-${ri}`} className="hover:bg-slate-50">
                          <td className={tdCls}>{ri === 0 ? fc.sitio : ''}</td>
                          <td className={tdCls}>{r.nombre}</td>
                          <td className={tdCls}>{r.unidad}</td>
                          <td className={tdNum}>{r.cantidad}</td>
                          <td className={tdNum}>{fmtUSD(r.costo)}</td>
                          <td className={`${tdNum} text-blue-700 font-semibold`}>{fmtUSD(r.total)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-green-50 border-t-2 border-green-200">
                      <td colSpan={5} className="px-3 py-2.5 text-sm font-bold text-green-900 text-right">Total mensual estimado</td>
                      <td className="px-3 py-2.5 text-right text-base font-black text-green-700">{fmtUSD(totalCostos)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* ── Resumen adecuaciones ── */}
          {filasAdec.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Resumen de adecuaciones por sitio</p>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className={thCls}>Sitio</th>
                      <th className={thCls}>Adecuaciones</th>
                      <th className={`${thCls} text-right`}>Costo</th>
                      <th className={thCls}>Ítems realizados</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filasAdec.map((f, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className={tdCls}>{f.sitio}</td>
                        <td className={tdCls}>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${f.tiene === 'Sí' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{f.tiene}</span>
                        </td>
                        <td className={`${tdNum} text-green-700`}>{f.costo}</td>
                        <td className={tdCls}>
                          {f.items.length > 0
                            ? <div className="flex flex-wrap gap-1">{f.items.map(k => <span key={k} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">{k}</span>)}</div>
                            : <span className="text-slate-400 text-xs">—</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </section>
    )
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <FormWrapper title="Condición 7 - Plan de Reubicación Temporal" short="PRT" informeId={id} onSave={onSave}>
      <div className="space-y-8">

        <EscuelaInfoHeader informeId={id} />

        <DescripcionCondicion
          informeId={id} tabla="informe_prt"
          value={form.descripcion_condicion}
          onChange={v => set('descripcion_condicion', v)} />

        {/* ── Modalidad ──────────────────────────────────────── */}
        <section>
          <h3 className={sectionHdr}>Modalidad de continuidad educativa</h3>
          <div className="flex gap-3 flex-wrap">
            {[{ key: 'Presencial', Icon: Users }, { key: 'Virtual', Icon: Monitor }].map(({ key, Icon }) => (
              <button key={key} type="button" onClick={() => toggleModalidad(key)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                  form.modalidad.includes(key) ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}>
                <Icon size={15} /> {key}
              </button>
            ))}
          </div>
          {esMultimodal && (
            <div className="mt-3 flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3">
              <span className="text-lg">🔀</span>
              <p className="text-sm font-semibold text-indigo-800">
                La reubicación para este centro escolar es <span className="underline">multimodal</span>
              </p>
            </div>
          )}
        </section>

        {/* ── Sección Virtual ────────────────────────────────── */}
        {esVirtual && (
          <section>
            <h3 className={sectionHdr}>Reubicación virtual</h3>
            <TarjetaLugar
              lugar={form.virtual}
              index={0}
              totalLugares={1}
              titulo="Sitio de reubicación para maestros"
              labelEstudiantes="Cantidad de estudiantes en virtualidad"
              nota="Todos los datos generados se reportan para la modalidad virtual."
              onChange={v => set('virtual', v)}
              onDelete={() => {}} />
          </section>
        )}

        {/* ── Generales (solo si Presencial) ─────────────────── */}
        {esPresencial && (
          <section>
            <h3 className={sectionHdr}>Generales de la reubicación</h3>
            <div className="space-y-6">

              {/* Lista de sitios de reubicación */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                    <MapPin size={13} /> Sitios de reubicación
                  </label>
                  <button type="button" onClick={addLugar}
                    className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors">
                    <Plus size={13} /> Agregar sitio
                  </button>
                </div>
                <div className="space-y-4">
                  {form.lugares.map((l, i) => (
                    <TarjetaLugar
                      key={l.id} lugar={l} index={i}
                      totalLugares={form.lugares.length}
                      onChange={nl => updLugar(i, nl)}
                      onDelete={() => delLugar(i)} />
                  ))}
                </div>
              </div>

            </div>
          </section>
        )}

        <SeccionAnalisis />

        <RegistroFotografico
          fotos={form.fotos ?? []}
          onChange={v => set('fotos', v)}
        />

      </div>
    </FormWrapper>
  )
}
