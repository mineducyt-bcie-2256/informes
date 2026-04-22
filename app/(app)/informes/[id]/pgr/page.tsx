'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import FormWrapper from '@/components/forms/FormWrapper'
import EscuelaInfoHeader from '@/components/forms/EscuelaInfoHeader'
import DescripcionCondicion from '@/components/forms/DescripcionCondicion'
import CapacitacionesSection from '@/components/forms/CapacitacionesSection'
import { Plus, Pencil, Trash2 } from 'lucide-react'

// ── Catálogos ────────────────────────────────────────────────────
const CATEGORIAS_DEMOLICION: Record<string, { tipo: string; ejemplos: string[] }> = {
  'Inertes': {
    tipo: 'Restos de obra gris',
    ejemplos: ['Concreto', 'Asfalto', 'Ladrillo', 'Ripio de mampostería', 'Arena', 'Grava', 'Suelo natural no contaminado', 'Otro'],
  },
  'No Peligrosos': {
    tipo: 'Materiales de acabados y estructura',
    ejemplos: ['Acero de refuerzo', 'Aluminio', 'Cobre', 'Madera (sin tratamiento químico)', 'Plásticos (PVC, polietileno)', 'Vidrio común', 'Cartón y papel', 'Otro'],
  },
  'Peligrosos': {
    tipo: 'Materiales contaminantes o químicos',
    ejemplos: ['Láminas de asbesto-cemento', 'Solventes', 'Pinturas base plomo', 'Transformadores con PCB', 'Tubos fluorescentes', 'Maderas tratadas con químicos', 'Envases de aditivos', 'Otro'],
  },
}

const CATEGORIAS_CONSTRUCCION: Record<string, { tipo: string; ejemplos: string[] }> = {
  'Inertes': {
    tipo: 'Sobrantes de mezclas',
    ejemplos: ['Concreto fresco fraguado (pasteles)', 'Restos de mortero endurecido', 'Arena lavada sobrante', 'Otro'],
  },
  'No Peligrosos': {
    tipo: 'Embalajes y Logística',
    ejemplos: ['Sacos de cemento (papel Kraft vacío)', 'Sacos de cal', 'Cajas de cartón', 'Tarimas de madera (pallets)', 'Plástico "playo"', 'Flejes de acero o plástico', 'Otro'],
  },
  'Peligrosos': {
    tipo: 'Químicos y Mantenimiento',
    ejemplos: ['Envases de aditivos para concreto', 'Latas de pegamento para PVC', 'Botes de pintura', 'Cartuchos de silicona', 'Trapos industriales impregnados de grasa', 'Filtros de aceite de maquinaria', 'Otro'],
  },
}

const CATEGORIA_BADGE: Record<string, string> = {
  'Inertes':       'bg-slate-100 text-slate-700 border border-slate-300',
  'No Peligrosos': 'bg-green-100 text-green-700 border border-green-300',
  'Peligrosos':    'bg-red-100 text-red-700 border border-red-300',
}

// ── Tipos ────────────────────────────────────────────────────────
type Material   = { nombre: string; peso_kg: number; manejo: string; detalle?: string }
type ResiduoReg = { id: string; categoria: string; tipo_residuo: string; materiales: Material[] }
type Capacitacion = { id: string; fecha: string; tematica: string; hombres: number; mujeres: number; total: number }

const RESIDUO_VACIO: ResiduoReg = { id: '', categoria: '', tipo_residuo: '', materiales: [] }

const INIT = {
  descripcion_condicion: '',
  residuos_demolicion:  [] as ResiduoReg[],
  residuos_construccion: [] as ResiduoReg[],
  tiene_capacitaciones: '',
  capacitaciones_list:  [] as Capacitacion[],
}

// ── Componente de sección (FUERA de PgrPage para evitar re-montaje) ──
const inputCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

interface SeccionProps {
  titulo: string
  catalogo: Record<string, { tipo: string; ejemplos: string[] }>
  lista: ResiduoReg[]
  onChange: (lista: ResiduoReg[]) => void
}

function SeccionResiduos({ titulo, catalogo, lista, onChange }: SeccionProps) {
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm]               = useState<ResiduoReg>({ ...RESIDUO_VACIO })
  const [editIdx, setEditIdx]         = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

  const ejemplosDisponibles = catalogo[form.categoria]?.ejemplos ?? []

  function cambiarCategoria(cat: string) {
    setForm({ ...RESIDUO_VACIO, id: form.id, categoria: cat, tipo_residuo: catalogo[cat]?.tipo ?? '' })
  }

  function toggleMaterial(nombre: string) {
    setForm(prev => {
      const existe = prev.materiales.find(m => m.nombre === nombre)
      if (existe) return { ...prev, materiales: prev.materiales.filter(m => m.nombre !== nombre) }
      const nuevo: Material = { nombre, peso_kg: 0, manejo: '' }
      if (nombre === 'Otro') nuevo.detalle = ''
      return { ...prev, materiales: [...prev.materiales, nuevo] }
    })
  }

  function updateMaterial(nombre: string, field: keyof Material, value: any) {
    setForm(prev => ({
      ...prev,
      materiales: prev.materiales.map(m => m.nombre === nombre ? { ...m, [field]: value } : m),
    }))
  }

  function registrar() {
    const nuevo = { ...form, id: editIdx !== null ? form.id : String(Date.now()) }
    if (editIdx !== null) {
      onChange(lista.map((r, i) => i === editIdx ? nuevo : r))
      setEditIdx(null)
    } else {
      onChange([...lista, nuevo])
    }
    setForm({ ...RESIDUO_VACIO }); setMostrarForm(false)
  }

  function iniciarEdicion(idx: number) {
    setForm({ ...lista[idx] }); setEditIdx(idx); setMostrarForm(true)
  }

  function eliminar(idx: number) {
    onChange(lista.filter((_, i) => i !== idx)); setConfirmDelete(null)
  }

  function cancelar() {
    setMostrarForm(false); setForm({ ...RESIDUO_VACIO }); setEditIdx(null)
  }

  const totalPeso = lista.reduce((s, r) => s + r.materiales.reduce((ss, m) => ss + (m.peso_kg || 0), 0), 0)

  return (
    <section>
      <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4 pb-2 border-b border-slate-100">{titulo}</h3>

      {/* Resumen por categoría */}
      {lista.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-4">
          {(['Inertes', 'No Peligrosos', 'Peligrosos'] as const).map(cat => {
            const registros = lista.filter(r => r.categoria === cat)
            if (!registros.length) return null
            const peso = registros.reduce((s, r) => s + r.materiales.reduce((ss, m) => ss + (m.peso_kg || 0), 0), 0)
            const totalMat = registros.reduce((s, r) => s + r.materiales.length, 0)
            return (
              <div key={cat} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${CATEGORIA_BADGE[cat]}`}>
                <span className="font-semibold">{cat}</span>
                <span className="opacity-50">·</span>
                <span>{totalMat} material{totalMat !== 1 ? 'es' : ''}</span>
                <span className="opacity-50">·</span>
                <span>{peso.toLocaleString()} kg</span>
              </div>
            )
          })}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-blue-50 border border-blue-200 text-blue-800 ml-auto">
            <span className="font-semibold">Total:</span>
            <span>{totalPeso.toLocaleString()} kg</span>
          </div>
        </div>
      )}

      {/* Tarjetas registradas */}
      <div className="space-y-3 mb-3">
        {lista.map((r, idx) => (
          <div key={r.id} className="border border-slate-200 rounded-xl bg-white overflow-hidden">
            {confirmDelete === idx ? (
              <div className="flex items-center justify-between gap-3 px-4 py-3 bg-red-50">
                <p className="text-sm text-red-700 font-medium">¿Eliminar este registro?</p>
                <div className="flex gap-2">
                  <button onClick={() => setConfirmDelete(null)} className="px-3 py-1 text-xs border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100">Cancelar</button>
                  <button onClick={() => eliminar(idx)} className="px-3 py-1 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700">Eliminar</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORIA_BADGE[r.categoria]}`}>{r.categoria}</span>
                    <span className="text-sm text-slate-600">{r.tipo_residuo}</span>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => iniciarEdicion(idx)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Pencil size={14} /></button>
                    <button onClick={() => setConfirmDelete(idx)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
                {r.materiales.length > 0 && (
                  <div className="divide-y divide-slate-50">
                    {r.materiales.map(m => (
                      <div key={m.nombre} className="px-4 py-2.5 flex flex-wrap items-center gap-x-6 gap-y-1">
                        <span className="text-sm text-slate-700 font-medium min-w-[200px]">
                          {m.nombre === 'Otro' && m.detalle ? `Otro: ${m.detalle}` : m.nombre}
                        </span>
                        {m.peso_kg > 0 && (
                          <span className="text-xs bg-blue-50 border border-blue-200 text-blue-700 px-2 py-0.5 rounded-full">{m.peso_kg.toLocaleString()} kg</span>
                        )}
                        {m.manejo && <span className="text-xs text-slate-400 italic">Manejo: {m.manejo}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Formulario */}
      {mostrarForm && (
        <div className="border border-blue-200 bg-blue-50 rounded-xl p-4 space-y-4 mb-3">
          <p className="text-sm font-semibold text-blue-900">{editIdx !== null ? 'Editar registro' : 'Nuevo registro'}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Categoría</label>
              <select value={form.categoria} onChange={e => cambiarCategoria(e.target.value)} className={inputCls}>
                <option value="">Seleccionar categoría...</option>
                {Object.keys(catalogo).map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Tipo / Material</label>
              <input type="text" value={form.tipo_residuo} readOnly
                placeholder="Se completa automáticamente..."
                className={`${inputCls} bg-slate-100 text-slate-500 cursor-default`} />
            </div>
          </div>

          {form.categoria && ejemplosDisponibles.length > 0 && (
            <div>
              <label className="text-xs font-medium text-slate-600 mb-2 block">
                Seleccione los materiales presentes en obra
                {form.materiales.length > 0 && (
                  <span className="ml-2 text-blue-700 font-semibold">{form.materiales.length} seleccionado{form.materiales.length !== 1 ? 's' : ''}</span>
                )}
              </label>
              <div className="space-y-2">
                {ejemplosDisponibles.map(ej => {
                  const sel = form.materiales.find(m => m.nombre === ej)
                  return (
                    <div key={ej} className={`rounded-xl border transition-all overflow-hidden ${sel ? 'border-blue-300 bg-white' : 'border-slate-200 bg-white'}`}>
                      <label className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors">
                        <input type="checkbox" checked={!!sel} onChange={() => toggleMaterial(ej)}
                          className="w-4 h-4 text-blue-600 rounded shrink-0" />
                        <span className={`text-sm ${sel ? 'text-blue-900 font-semibold' : 'text-slate-600'}`}>{ej}</span>
                      </label>
                      {sel && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-4 pb-3 border-t border-blue-100 bg-blue-50/40 pt-3">
                          {ej === 'Otro' && (
                            <div className="md:col-span-2">
                              <label className="text-xs font-medium text-slate-500 mb-1 block">Especifique el material</label>
                              <input type="text" value={sel.detalle ?? ''}
                                onChange={e => updateMaterial(ej, 'detalle', e.target.value)}
                                placeholder="Describa el material..." className={inputCls} />
                            </div>
                          )}
                          <div>
                            <label className="text-xs font-medium text-slate-500 mb-1 block">Peso estimado (kg)</label>
                            <input type="number" min={0} step={0.1}
                              value={sel.peso_kg === 0 ? '' : sel.peso_kg}
                              onChange={e => updateMaterial(ej, 'peso_kg', parseFloat(e.target.value) || 0)}
                              placeholder="0" className={inputCls} />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-500 mb-1 block">Manejo del residuo</label>
                            <input type="text" value={sel.manejo}
                              onChange={e => updateMaterial(ej, 'manejo', e.target.value)}
                              placeholder="Ej: Disposición en relleno autorizado..." className={inputCls} />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={cancelar}
              className="px-4 py-2 text-sm border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100">Cancelar</button>
            <button type="button" onClick={registrar}
              disabled={!form.categoria || form.materiales.length === 0}
              className="px-5 py-2 text-sm bg-blue-900 text-white rounded-lg hover:bg-blue-800 font-medium disabled:opacity-50">
              {editIdx !== null ? 'Guardar cambios' : 'Registrar'}
            </button>
          </div>
        </div>
      )}

      {!mostrarForm && (
        <button type="button" onClick={() => { setForm({ ...RESIDUO_VACIO }); setEditIdx(null); setMostrarForm(true) }}
          className="flex items-center gap-2 w-full justify-center border-2 border-dashed border-slate-300 rounded-xl py-3 text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
          <Plus size={15} /> Agregar residuo
        </button>
      )}
    </section>
  )
}

// ── Página principal ─────────────────────────────────────────────
export default function PgrPage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState(INIT)
  const [autoLoaded, setAutoLoaded] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: pgrData } = await supabase
        .from('informe_pgr').select('*').eq('informe_id', id).single()

      if (pgrData) {
        setData({
          ...INIT, ...pgrData,
          residuos_demolicion:  pgrData.residuos_demolicion  ?? [],
          residuos_construccion: pgrData.residuos_construccion ?? [],
          capacitaciones_list:  pgrData.capacitaciones_list  ?? [],
        })
      } else {
        const { data: infoActual } = await supabase
          .from('informes').select('escuela_id, periodo_mes, periodo_anio').eq('id', id).single()
        if (infoActual) {
          const { data: prevInforme } = await supabase
            .from('informes').select('id')
            .eq('escuela_id', infoActual.escuela_id).neq('id', id)
            .or(`periodo_anio.lt.${infoActual.periodo_anio},and(periodo_anio.eq.${infoActual.periodo_anio},periodo_mes.lt.${infoActual.periodo_mes})`)
            .order('periodo_anio', { ascending: false }).order('periodo_mes', { ascending: false })
            .limit(1).single()
          if (prevInforme) {
            const { data: prev } = await supabase
              .from('informe_pgr')
              .select('residuos_demolicion, residuos_construccion')
              .eq('informe_id', prevInforme.id).single()
            if (prev && (prev.residuos_demolicion?.length || prev.residuos_construccion?.length)) {
              setData(p => ({
                ...p,
                residuos_demolicion:  prev.residuos_demolicion  ?? [],
                residuos_construccion: prev.residuos_construccion ?? [],
              }))
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
    const { error } = await supabase.from('informe_pgr').upsert({ ...data, informe_id: id }, { onConflict: 'informe_id' })
    if (error) throw new Error(error.message)
  }

  return (
    <FormWrapper title="Condición 3 - Plan de Gestión de Residuos" short="PGR" informeId={id} onSave={onSave}>
      <div className="space-y-8">

        <EscuelaInfoHeader informeId={id} />

        {autoLoaded && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <span className="text-amber-500 text-lg leading-none mt-0.5">↺</span>
            <div>
              <p className="text-sm font-semibold text-amber-800">Datos cargados del informe anterior</p>
              <p className="text-xs text-amber-700 mt-0.5">Los residuos se copiaron del mes anterior. Actualice pesos y manejos sin afectar informes aprobados.</p>
            </div>
          </div>
        )}

        <DescripcionCondicion informeId={id} tabla="informe_pgr" value={data.descripcion_condicion} onChange={v => set('descripcion_condicion', v)} />

        <SeccionResiduos
          titulo="Residuos generados en la etapa de demolición"
          catalogo={CATEGORIAS_DEMOLICION}
          lista={data.residuos_demolicion}
          onChange={v => set('residuos_demolicion', v)}
        />

        <SeccionResiduos
          titulo="Residuos generados en la etapa de construcción"
          catalogo={CATEGORIAS_CONSTRUCCION}
          lista={data.residuos_construccion}
          onChange={v => set('residuos_construccion', v)}
        />

        <CapacitacionesSection
          tieneCapacitaciones={data.tiene_capacitaciones}
          capacitaciones={data.capacitaciones_list}
          onChangeTiene={v => set('tiene_capacitaciones', v)}
          onChangeCapacitaciones={v => set('capacitaciones_list', v)}
        />

      </div>
    </FormWrapper>
  )
}
