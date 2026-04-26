'use client'
import { useState } from 'react'
import { Pencil, Trash2, Plus, CheckCircle, BookOpen } from 'lucide-react'

const CAP_VACIA = {
  id: '',
  fecha: '',
  tematica: '',
  hombres: 0,
  mujeres: 0,
  total: 0,
}

type Capacitacion = typeof CAP_VACIA

interface Props {
  tieneCapacitaciones: string
  capacitaciones: Capacitacion[]
  onChangeTiene: (v: string) => void
  onChangeCapacitaciones: (v: Capacitacion[]) => void
}

export default function CapacitacionesSection({ tieneCapacitaciones, capacitaciones, onChangeTiene, onChangeCapacitaciones }: Props) {
  const [form, setForm] = useState<Capacitacion>({ ...CAP_VACIA })
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

  function setF(field: string, value: any) {
    setForm(prev => {
      const next = { ...prev, [field]: value }
      if (field === 'hombres' || field === 'mujeres') {
        const h = field === 'hombres' ? (parseInt(value) || 0) : (parseInt(String(prev.hombres)) || 0)
        const m = field === 'mujeres' ? (parseInt(value) || 0) : (parseInt(String(prev.mujeres)) || 0)
        next.total = h + m
      }
      return next
    })
  }

  function registrar() {
    if (!form.tematica || !form.tematica.trim()) return
    const nueva = { ...form, id: editIndex !== null ? form.id : String(Date.now()) }
    if (editIndex !== null) {
      onChangeCapacitaciones(capacitaciones.map((c, i) => i === editIndex ? nueva : c))
      setEditIndex(null)
    } else {
      onChangeCapacitaciones([...capacitaciones, nueva])
    }
    setForm({ ...CAP_VACIA })
    setMostrarForm(false)
  }

  function editar(i: number) {
    setForm({ ...capacitaciones[i] })
    setEditIndex(i)
    setMostrarForm(true)
  }

  function eliminar(i: number) {
    onChangeCapacitaciones(capacitaciones.filter((_, idx) => idx !== i))
    setConfirmDelete(null)
  }

  function cancelar() {
    setForm({ ...CAP_VACIA })
    setEditIndex(null)
    setMostrarForm(false)
  }

  const totalPersonal = capacitaciones.reduce((sum, c) => sum + (c.total || 0), 0)
  const inputCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <section>
      <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4 pb-2 border-b border-slate-100">
        Capacitaciones
      </h3>

      {/* ── ¿Hubo capacitaciones? ── */}
      <div className="mb-5">
        <label className="text-xs font-medium text-slate-600 mb-2 block">
          Capacitaciones realizadas en el periodo
        </label>
        <div className="flex gap-3">
          {['Sí', 'No'].map(op => (
            <button key={op} type="button"
              onClick={() => {
                onChangeTiene(op)
                if (op === 'No') { onChangeCapacitaciones([]); setMostrarForm(false) }
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                tieneCapacitaciones === op
                  ? op === 'Sí' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-400 bg-slate-50 text-slate-700'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300'
              }`}>
              {op}
            </button>
          ))}
        </div>
      </div>

      {/* ── Sin capacitaciones ── */}
      {tieneCapacitaciones === 'No' && (
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
          <CheckCircle size={16} className="text-slate-400 shrink-0" />
          <p className="text-sm text-slate-600 font-medium">No se reportan capacitaciones para este periodo.</p>
        </div>
      )}

      {/* ── Lista + formulario ── */}
      {tieneCapacitaciones === 'Sí' && (
        <div className="space-y-4">

          {/* Contador total */}
          {capacitaciones.length > 0 && (
            <div className="flex items-center gap-4 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-blue-600" />
                <span className="text-sm font-semibold text-blue-900">
                  {capacitaciones.length} capacitación{capacitaciones.length !== 1 ? 'es' : ''} impartida{capacitaciones.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="h-4 w-px bg-blue-200" />
              <span className="text-sm text-blue-700">
                Total de participantes: <span className="font-semibold">{totalPersonal}</span>
              </span>
            </div>
          )}

          {/* Tarjetas registradas */}
          {capacitaciones.map((cap, i) => (
            <div key={cap.id} className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">#{i + 1}</span>
                  <span className="text-sm font-semibold text-slate-700 truncate max-w-xs">{cap.tematica}</span>
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
              <div className="px-4 py-3 flex flex-wrap gap-6 text-sm">
                {cap.fecha && <span><span className="text-xs text-slate-400 mr-1">Fecha:</span><span className="font-medium text-slate-700">{new Date(cap.fecha + 'T00:00:00').toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' })}</span></span>}
                <span><span className="text-xs text-slate-400 mr-1">Hombres:</span><span className="font-medium text-slate-700">{cap.hombres}</span></span>
                <span><span className="text-xs text-slate-400 mr-1">Mujeres:</span><span className="font-medium text-slate-700">{cap.mujeres}</span></span>
                <span><span className="text-xs text-slate-400 mr-1">Total:</span><span className="font-semibold text-blue-700">{cap.total}</span></span>
              </div>

              {confirmDelete === i && (
                <div className="bg-red-50 border-t border-red-200 px-4 py-3 flex items-center justify-between gap-3">
                  <p className="text-sm text-red-700">¿Está seguro de eliminar esta capacitación?</p>
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

          {/* Formulario */}
          {mostrarForm && (
            <div className="border-2 border-blue-200 rounded-xl bg-blue-50 p-5 space-y-4">
              <p className="text-sm font-semibold text-slate-700">
                {editIndex !== null ? `Editando capacitación #${editIndex + 1}` : 'Nueva capacitación'}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Temática</label>
                  <input value={form.tematica} onChange={e => setF('tematica', e.target.value)}
                    placeholder="Describe el tema de la capacitación..."
                    className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Fecha de realización</label>
                  <input type="date" value={form.fecha} onChange={e => setF('fecha', e.target.value)}
                    className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Hombres</label>
                  <input type="number" value={form.hombres}
                    onChange={e => setF('hombres', e.target.value)}
                    onBlur={e => setF('hombres', parseInt(e.target.value) || 0)}
                    className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Mujeres</label>
                  <input type="number" value={form.mujeres}
                    onChange={e => setF('mujeres', e.target.value)}
                    onBlur={e => setF('mujeres', parseInt(e.target.value) || 0)}
                    className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Total</label>
                  <div className="relative">
                    <input type="number" value={form.total} readOnly
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-500 cursor-default" />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-blue-500 font-medium">auto</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={cancelar}
                  className="px-4 py-2 text-sm border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100">
                  Cancelar
                </button>
                <button type="button" onClick={registrar} disabled={!form.tematica || !form.tematica.trim()}
                  className="px-5 py-2 text-sm bg-blue-900 text-white rounded-lg hover:bg-blue-800 font-medium disabled:opacity-50">
                  {editIndex !== null ? 'Guardar cambios' : 'Registrar'}
                </button>
              </div>
            </div>
          )}

          {/* Botón agregar */}
          {!mostrarForm && (
            <button type="button"
              onClick={() => { setForm({ ...CAP_VACIA }); setEditIndex(null); setMostrarForm(true) }}
              className="flex items-center gap-2 w-full justify-center border-2 border-dashed border-slate-300 rounded-xl py-3 text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
              <Plus size={15} />
              {capacitaciones.length === 0 ? 'Agregar primera capacitación' : 'Registrar nueva temática'}
            </button>
          )}

        </div>
      )}
    </section>
  )
}
