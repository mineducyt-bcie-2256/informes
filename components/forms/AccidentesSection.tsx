'use client'
import { useState } from 'react'
import { Pencil, Trash2, Plus, AlertTriangle, CheckCircle } from 'lucide-react'

const CAUSAS = [
  'Caída', 'Atrapamiento', 'Sobreesfuerzo', 'Impacto por objetos',
  'Contacto eléctrico', 'Mal uso de herramientas', 'No usar EPP',
  'Incendios', 'Intoxicación', 'Mordeduras o picaduras', 'Otro',
]

const LESIONES = [
  'Golpe', 'Herida o cortadura', 'Quemadura', 'Fractura', 'Fractura expuesta',
  'Inhalación de gases tóxicos',
  'Quemaduras por ácidos o contacto con sustancias corrosivas',
  'Efectos de mordeduras o picaduras (alergias otros)',
  'Psicosocial (evento traumático)', 'Otro',
]

const GRAVEDADES = ['Sin daño', 'Leve', 'Grave (incapacitante)', 'Mortal']

const ACCIDENTE_VACIO = {
  id: '',
  tipo: '' as 'Incidente' | 'Accidente' | '',
  gravedad: '',
  causa: '',
  causa_otro: '',
  tipo_lesion: '',
  tipo_lesion_otro: '',
  descripcion: '',
}

type Accidente = typeof ACCIDENTE_VACIO

interface Props {
  tieneAccidentes: string
  accidentes: Accidente[]
  onChangeTiene: (v: string) => void
  onChangeAccidentes: (v: Accidente[]) => void
}

const GRAVEDAD_COLOR: Record<string, string> = {
  'Sin daño': 'bg-green-100 text-green-700',
  'Leve': 'bg-yellow-100 text-yellow-700',
  'Grave (incapacitante)': 'bg-orange-100 text-orange-700',
  'Mortal': 'bg-red-100 text-red-700',
}

export default function AccidentesSection({ tieneAccidentes, accidentes, onChangeTiene, onChangeAccidentes }: Props) {
  const [form, setForm] = useState<Accidente>({ ...ACCIDENTE_VACIO })
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

  function setF(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function registrar() {
    if (!form.tipo) return
    const nuevo = { ...form, id: editIndex !== null ? form.id : String(Date.now()) }
    if (editIndex !== null) {
      const updated = accidentes.map((a, i) => i === editIndex ? nuevo : a)
      onChangeAccidentes(updated)
      setEditIndex(null)
    } else {
      onChangeAccidentes([...accidentes, nuevo])
    }
    setForm({ ...ACCIDENTE_VACIO })
    setMostrarForm(false)
  }

  function editar(i: number) {
    setForm({ ...accidentes[i] })
    setEditIndex(i)
    setMostrarForm(true)
  }

  function eliminar(i: number) {
    onChangeAccidentes(accidentes.filter((_, idx) => idx !== i))
    setConfirmDelete(null)
  }

  function cancelar() {
    setForm({ ...ACCIDENTE_VACIO })
    setEditIndex(null)
    setMostrarForm(false)
  }

  const esAccidente = form.tipo === 'Accidente'

  // Contadores
  const cntIncidentes = accidentes.filter(a => a.tipo === 'Incidente').length
  const cntAccidentes = accidentes.filter(a => a.tipo === 'Accidente').length
  const cntSinDanio   = accidentes.filter(a => a.tipo === 'Accidente' && a.gravedad === 'Sin daño').length
  const cntLeve       = accidentes.filter(a => a.tipo === 'Accidente' && a.gravedad === 'Leve').length
  const cntGrave      = accidentes.filter(a => a.tipo === 'Accidente' && a.gravedad === 'Grave (incapacitante)').length
  const cntMortal     = accidentes.filter(a => a.tipo === 'Accidente' && a.gravedad === 'Mortal').length

  const selectCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
  const inputCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
  const taCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none'

  return (
    <section>
      <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4 pb-2 border-b border-slate-100">
        Accidentes registrados en el proyecto
      </h3>

      {/* ── ¿Hubo accidentes? ── */}
      <div className="mb-5">
        <label className="text-xs font-medium text-slate-600 mb-2 block">
          Accidentes o incidentes identificados en el proyecto
        </label>
        <div className="flex gap-3">
          {['Sí', 'No'].map(op => (
            <button key={op} type="button"
              onClick={() => {
                onChangeTiene(op)
                if (op === 'No') { onChangeAccidentes([]); setMostrarForm(false) }
                if (op === 'Sí') { setMostrarForm(true) }
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                tieneAccidentes === op
                  ? op === 'Sí' ? 'border-red-400 bg-red-50 text-red-700' : 'border-green-400 bg-green-50 text-green-700'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300'
              }`}>
              {op}
            </button>
          ))}
        </div>
      </div>

      {/* ── Sin accidentes ── */}
      {tieneAccidentes === 'No' && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <CheckCircle size={16} className="text-green-500 shrink-0" />
          <p className="text-sm text-green-700 font-medium">En este periodo no se reportan accidentes ni incidentes.</p>
        </div>
      )}

      {/* ── Contadores ── */}
      {tieneAccidentes === 'Sí' && accidentes.length > 0 && (
        <div className="space-y-3 mb-4">
          {/* Totales generales */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Total de accidentes', value: cntAccidentes, color: 'bg-slate-100 text-slate-700 border-slate-300' },
              { label: 'Total de incidentes', value: cntIncidentes, color: 'bg-blue-50 text-blue-700 border-blue-200' },
            ].map(({ label, value, color }) => (
              <div key={label} className={`flex items-center gap-4 rounded-xl border px-5 py-3 ${color}`}>
                <span className="text-3xl font-bold leading-none">{value}</span>
                <span className="text-sm font-semibold">{label}</span>
              </div>
            ))}
          </div>

          {/* Gravedad del accidente */}
          <div className="border border-slate-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Gravedad del accidente</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { label: 'Sin daño', value: cntSinDanio, color: 'bg-green-50 text-green-700 border-green-200' },
                { label: 'Leve',     value: cntLeve,     color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
                { label: 'Grave',    value: cntGrave,    color: 'bg-orange-50 text-orange-700 border-orange-200' },
                { label: 'Mortal',   value: cntMortal,   color: 'bg-red-50 text-red-700 border-red-200' },
              ].map(({ label, value, color }) => (
                <div key={label} className={`flex flex-col items-center justify-center rounded-xl border px-3 py-3 ${color}`}>
                  <span className="text-2xl font-bold leading-none">{value}</span>
                  <span className="text-xs font-medium mt-1">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Lista de accidentes registrados ── */}
      {tieneAccidentes === 'Sí' && (
        <div className="space-y-4">
          {accidentes.map((acc, i) => (
            <div key={acc.id} className="border border-slate-200 rounded-xl overflow-hidden">
              {/* Cabecera de la tarjeta */}
              <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">#{i + 1}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    acc.tipo === 'Accidente' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                  }`}>{acc.tipo}</span>
                  {acc.gravedad && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${GRAVEDAD_COLOR[acc.gravedad] ?? 'bg-slate-100 text-slate-600'}`}>
                      {acc.gravedad}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => editar(i)}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50">
                    <Pencil size={12} /> Editar
                  </button>
                  <button type="button" onClick={() => setConfirmDelete(i)}
                    className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50">
                    <Trash2 size={12} /> Eliminar
                  </button>
                </div>
              </div>

              {/* Contenido de la tarjeta */}
              <div className="px-4 py-3 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                {acc.causa && <p><span className="text-xs text-slate-400 mr-1">Causa:</span><span className="text-slate-700">{acc.causa === 'Otro' ? acc.causa_otro : acc.causa}</span></p>}
                {acc.tipo_lesion && <p><span className="text-xs text-slate-400 mr-1">Lesión:</span><span className="text-slate-700">{acc.tipo_lesion === 'Otro' ? acc.tipo_lesion_otro : acc.tipo_lesion}</span></p>}
                {acc.descripcion && <p className="md:col-span-2"><span className="text-xs text-slate-400 mr-1">Descripción:</span><span className="text-slate-700">{acc.descripcion}</span></p>}
              </div>

              {/* Modal confirmación eliminar */}
              {confirmDelete === i && (
                <div className="bg-red-50 border-t border-red-200 px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm text-red-700">
                    <AlertTriangle size={14} />
                    ¿Está seguro de borrar este registro? Esta acción no se puede deshacer.
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button type="button" onClick={() => setConfirmDelete(null)}
                      className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100">
                      Cancelar
                    </button>
                    <button type="button" onClick={() => eliminar(i)}
                      className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700">
                      Sí, eliminar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* ── Formulario de registro ── */}
          {mostrarForm && (
            <div className="border-2 border-blue-200 rounded-xl bg-blue-50 p-5 space-y-4">
              <p className="text-sm font-semibold text-slate-700">
                {editIndex !== null ? `Editando registro #${editIndex + 1}` : 'Nuevo registro'}
              </p>

              {/* Tipo */}
              <div>
                <label className="text-xs font-medium text-slate-600 mb-2 block">Tipo</label>
                <div className="flex gap-3">
                  {(['Incidente', 'Accidente'] as const).map(op => (
                    <button key={op} type="button"
                      onClick={() => setF('tipo', op)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                        form.tipo === op
                          ? op === 'Accidente' ? 'border-red-400 bg-red-50 text-red-700' : 'border-blue-400 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                      }`}>
                      {op === 'Incidente' ? 'a) Incidente' : 'b) Accidente'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Campos solo para Accidente */}
              {esAccidente && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Gravedad */}
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">
                      Gravedad del accidente
                      <span className="ml-1 font-normal text-slate-400">(Determine la magnitud del accidente)</span>
                    </label>
                    <select value={form.gravedad} onChange={e => setF('gravedad', e.target.value)} className={selectCls}>
                      <option value="">Seleccionar...</option>
                      {GRAVEDADES.map(g => <option key={g}>{g}</option>)}
                    </select>
                  </div>

                  {/* Causa */}
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">
                      Causa del accidente
                      <span className="ml-1 font-normal text-slate-400">(¿Qué provocó el accidente? evento o forma)</span>
                    </label>
                    <select value={form.causa} onChange={e => setF('causa', e.target.value)} className={selectCls}>
                      <option value="">Seleccionar...</option>
                      {CAUSAS.map(c => <option key={c}>{c}</option>)}
                    </select>
                    {form.causa === 'Otro' && (
                      <input value={form.causa_otro} onChange={e => setF('causa_otro', e.target.value)}
                        placeholder="Especifique la causa..." className={`${inputCls} mt-2`} />
                    )}
                  </div>

                  {/* Tipo de lesión */}
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">
                      Tipo de lesión
                      <span className="ml-1 font-normal text-slate-400">(¿Qué daño sufrió el cuerpo de la persona?)</span>
                    </label>
                    <select value={form.tipo_lesion} onChange={e => setF('tipo_lesion', e.target.value)} className={selectCls}>
                      <option value="">Seleccionar...</option>
                      {LESIONES.map(l => <option key={l}>{l}</option>)}
                    </select>
                    {form.tipo_lesion === 'Otro' && (
                      <input value={form.tipo_lesion_otro} onChange={e => setF('tipo_lesion_otro', e.target.value)}
                        placeholder="Especifique el tipo de lesión..." className={`${inputCls} mt-2`} />
                    )}
                  </div>
                </div>
              )}

              {/* Descripción — disponible para ambos tipos */}
              {form.tipo && (
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">
                    Descripción general del {form.tipo === 'Incidente' ? 'incidente' : 'accidente'}
                    <span className="ml-1 font-normal text-slate-400">
                      {form.tipo === 'Accidente'
                        ? '(Breve descripción: comentarios, estimaciones de pérdida, patrones del accidente, otros)'
                        : '(Describa el incidente identificado)'}
                    </span>
                  </label>
                  <textarea value={form.descripcion} onChange={e => setF('descripcion', e.target.value)}
                    rows={3} placeholder={form.tipo === 'Accidente'
                      ? 'Plantee una breve descripción del accidente...'
                      : 'Describa el incidente...'
                    }
                    className={taCls} />
                </div>
              )}

              {/* Botones */}
              {form.tipo && (
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={cancelar}
                    className="px-4 py-2 text-sm border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100">
                    Cancelar
                  </button>
                  <button type="button" onClick={registrar}
                    className="px-5 py-2 text-sm bg-blue-900 text-white rounded-lg hover:bg-blue-800 font-medium">
                    {editIndex !== null ? 'Guardar cambios' : 'Registrar'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Botón agregar ── */}
          {!mostrarForm && accidentes.length > 0 && (
            <button type="button"
              onClick={() => { setForm({ ...ACCIDENTE_VACIO }); setEditIndex(null); setMostrarForm(true) }}
              className="flex items-center gap-2 w-full justify-center border-2 border-dashed border-slate-300 rounded-xl py-3 text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
              <Plus size={15} />
              Agregar — registre un nuevo accidente o incidente
            </button>
          )}
        </div>
      )}
    </section>
  )
}
