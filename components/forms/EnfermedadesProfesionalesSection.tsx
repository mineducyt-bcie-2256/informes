'use client'
import { useState } from 'react'
import { Plus, Trash2, Pencil, Save, X, AlertCircle, CheckCircle } from 'lucide-react'

export interface EnfermedadItem {
  id: string
  grupo_agente: string
  enfermedad: string
  actividad_riesgo: string
}

interface Props {
  tieneEnfermedades: string
  enfermedades: EnfermedadItem[]
  onChangeTiene: (v: string) => void
  onChangeEnfermedades: (v: EnfermedadItem[]) => void
}

const GRUPOS: Record<string, string[]> = {
  'Químicos':       ['Silicosis', 'Asbestosis', 'Saturnismo (plomo)', 'Dermatitis alérgica'],
  'Físicos':        ['Hipoacusia (sordera)', 'Síndrome del túnel carpiano', 'Cataratas por radiación'],
  'Biológicos':     ['Tuberculosis', 'Hepatitis B/C', 'Brucelosis', 'Micosis'],
  'Psicosociales':  ['Síndrome de Burnout', 'Estrés crónico', 'Trastornos del sueño'],
  'Carcinógenos':   ['Mesotelioma (amianto)', 'Cáncer de pulmón', 'Leucemia (benceno)'],
}

const GRUPO_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  'Químicos':      { bg: 'bg-orange-50 border-orange-200',   text: 'text-orange-700', dot: 'bg-orange-400' },
  'Físicos':       { bg: 'bg-blue-50 border-blue-200',       text: 'text-blue-700',   dot: 'bg-blue-400'   },
  'Biológicos':    { bg: 'bg-green-50 border-green-200',     text: 'text-green-700',  dot: 'bg-green-400'  },
  'Psicosociales': { bg: 'bg-violet-50 border-violet-200',   text: 'text-violet-700', dot: 'bg-violet-400' },
  'Carcinógenos':  { bg: 'bg-red-50 border-red-200',         text: 'text-red-700',    dot: 'bg-red-400'    },
}

const INIT_ITEM = (): EnfermedadItem => ({
  id: crypto.randomUUID(),
  grupo_agente: '',
  enfermedad: '',
  actividad_riesgo: '',
})

export default function EnfermedadesProfesionalesSection({
  tieneEnfermedades,
  enfermedades,
  onChangeTiene,
  onChangeEnfermedades,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<EnfermedadItem | null>(null)
  const [addingNew, setAddingNew] = useState(false)
  const [newItem, setNewItem] = useState<EnfermedadItem>(INIT_ITEM())

  // ── Editar fila existente ──
  function startEdit(item: EnfermedadItem) {
    setEditingId(item.id)
    setDraft({ ...item })
  }
  function cancelEdit() { setEditingId(null); setDraft(null) }
  function saveEdit() {
    if (!draft) return
    onChangeEnfermedades(enfermedades.map(e => e.id === draft.id ? draft : e))
    setEditingId(null); setDraft(null)
  }
  function deleteItem(id: string) {
    onChangeEnfermedades(enfermedades.filter(e => e.id !== id))
  }

  // ── Agregar nuevo ──
  function startNew() { setNewItem(INIT_ITEM()); setAddingNew(true) }
  function cancelNew() { setAddingNew(false) }
  function saveNew() {
    if (!newItem.grupo_agente || !newItem.enfermedad) return
    onChangeEnfermedades([...enfermedades, newItem])
    setAddingNew(false)
    setNewItem(INIT_ITEM())
  }

  const enfermedadesDelGrupo = (grupo: string) =>
    GRUPOS[grupo] ?? []

  return (
    <section>
      <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4 pb-2 border-b border-slate-100">
        Enfermedades Profesionales
      </h3>

      {/* Selector Sí / No */}
      <div className="flex gap-3 mb-4">
        {['Sí', 'No'].map(op => (
          <button
            key={op}
            type="button"
            onClick={() => onChangeTiene(op)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold border transition-all ${
              tieneEnfermedades === op
                ? op === 'Sí'
                  ? 'bg-red-600 text-white border-red-600 shadow-sm'
                  : 'bg-green-600 text-white border-green-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
            }`}
          >
            {op}
          </button>
        ))}
      </div>

      {/* Mensaje si No */}
      {tieneEnfermedades === 'No' && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
          <CheckCircle size={15} className="shrink-0" />
          En este centro educativo no se reportan enfermedades profesionales.
        </div>
      )}

      {/* Tabla si Sí */}
      {tieneEnfermedades === 'Sí' && (
        <div className="space-y-4">

          {/* Listado de enfermedades guardadas */}
          {enfermedades.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    <th className="px-3 py-2.5 text-left font-semibold w-36">Grupo de agente</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Enfermedad diagnosticada</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Actividad de riesgo</th>
                    <th className="w-24 px-3 py-2.5 text-center font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {enfermedades.map((item, i) => {
                    const color = GRUPO_COLORS[item.grupo_agente]
                    const isEditing = editingId === item.id

                    return (
                      <tr key={item.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        {isEditing && draft ? (
                          <>
                            {/* Fila en modo edición */}
                            <td className="px-2 py-2">
                              <select
                                value={draft.grupo_agente}
                                onChange={e => setDraft({ ...draft, grupo_agente: e.target.value, enfermedad: '' })}
                                className="w-full border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400 text-xs"
                              >
                                <option value="">Seleccionar...</option>
                                {Object.keys(GRUPOS).map(g => <option key={g} value={g}>{g}</option>)}
                              </select>
                            </td>
                            <td className="px-2 py-2">
                              <select
                                value={draft.enfermedad}
                                onChange={e => setDraft({ ...draft, enfermedad: e.target.value })}
                                className="w-full border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400 text-xs"
                              >
                                <option value="">Seleccionar...</option>
                                {enfermedadesDelGrupo(draft.grupo_agente).map(e => <option key={e} value={e}>{e}</option>)}
                              </select>
                            </td>
                            <td className="px-2 py-2">
                              <input
                                value={draft.actividad_riesgo}
                                onChange={e => setDraft({ ...draft, actividad_riesgo: e.target.value })}
                                placeholder="Describe la actividad..."
                                className="w-full border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400 text-xs"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <div className="flex items-center justify-center gap-1">
                                <button type="button" onClick={saveEdit}
                                  className="flex items-center gap-1 bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 text-xs font-medium">
                                  <Save size={11} /> Guardar
                                </button>
                                <button type="button" onClick={cancelEdit}
                                  className="text-slate-400 hover:text-slate-600 px-1">
                                  <X size={13} />
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            {/* Fila en modo lectura */}
                            <td className="px-3 py-2.5">
                              {color ? (
                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-medium ${color.bg} ${color.text}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />
                                  {item.grupo_agente}
                                </span>
                              ) : item.grupo_agente}
                            </td>
                            <td className="px-3 py-2.5 text-slate-700 font-medium">{item.enfermedad}</td>
                            <td className="px-3 py-2.5 text-slate-500">{item.actividad_riesgo || <span className="italic text-slate-300">—</span>}</td>
                            <td className="px-2 py-2">
                              <div className="flex items-center justify-center gap-2">
                                <button type="button" onClick={() => startEdit(item)}
                                  className="text-blue-400 hover:text-blue-600 transition" title="Editar">
                                  <Pencil size={13} />
                                </button>
                                <button type="button" onClick={() => deleteItem(item.id)}
                                  className="text-slate-300 hover:text-red-500 transition" title="Eliminar">
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    )
                  })}

                  {/* Fila de nuevo agente inline */}
                  {addingNew && (
                    <tr className="bg-blue-50 border-t-2 border-blue-200">
                      <td className="px-2 py-2">
                        <select
                          value={newItem.grupo_agente}
                          onChange={e => setNewItem({ ...newItem, grupo_agente: e.target.value, enfermedad: '' })}
                          className="w-full border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400 text-xs"
                        >
                          <option value="">Seleccionar...</option>
                          {Object.keys(GRUPOS).map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <select
                          value={newItem.enfermedad}
                          onChange={e => setNewItem({ ...newItem, enfermedad: e.target.value })}
                          disabled={!newItem.grupo_agente}
                          className="w-full border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400 text-xs disabled:opacity-50"
                        >
                          <option value="">Seleccionar...</option>
                          {enfermedadesDelGrupo(newItem.grupo_agente).map(e => <option key={e} value={e}>{e}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <input
                          value={newItem.actividad_riesgo}
                          onChange={e => setNewItem({ ...newItem, actividad_riesgo: e.target.value })}
                          placeholder="Describe la actividad de riesgo..."
                          className="w-full border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400 text-xs"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <button type="button" onClick={saveNew}
                            disabled={!newItem.grupo_agente || !newItem.enfermedad}
                            className="flex items-center gap-1 bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed">
                            <Save size={11} /> Guardar
                          </button>
                          <button type="button" onClick={cancelNew}
                            className="text-slate-400 hover:text-slate-600 px-1">
                            <X size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Tabla vacía con fila de nuevo */}
          {enfermedades.length === 0 && addingNew && (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    <th className="px-3 py-2.5 text-left font-semibold w-36">Grupo de agente</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Enfermedad diagnosticada</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Actividad de riesgo</th>
                    <th className="w-24 px-3 py-2.5 text-center font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-blue-50">
                    <td className="px-2 py-2">
                      <select
                        value={newItem.grupo_agente}
                        onChange={e => setNewItem({ ...newItem, grupo_agente: e.target.value, enfermedad: '' })}
                        className="w-full border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400 text-xs"
                      >
                        <option value="">Seleccionar...</option>
                        {Object.keys(GRUPOS).map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <select
                        value={newItem.enfermedad}
                        onChange={e => setNewItem({ ...newItem, enfermedad: e.target.value })}
                        disabled={!newItem.grupo_agente}
                        className="w-full border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400 text-xs disabled:opacity-50"
                      >
                        <option value="">Seleccionar...</option>
                        {enfermedadesDelGrupo(newItem.grupo_agente).map(e => <option key={e} value={e}>{e}</option>)}
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <input
                        value={newItem.actividad_riesgo}
                        onChange={e => setNewItem({ ...newItem, actividad_riesgo: e.target.value })}
                        placeholder="Describe la actividad de riesgo..."
                        className="w-full border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400 text-xs"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center justify-center gap-1">
                        <button type="button" onClick={saveNew}
                          disabled={!newItem.grupo_agente || !newItem.enfermedad}
                          className="flex items-center gap-1 bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed">
                          <Save size={11} /> Guardar
                        </button>
                        <button type="button" onClick={cancelNew}
                          className="text-slate-400 hover:text-slate-600 px-1">
                          <X size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Mensaje vacío sin fila nueva */}
          {enfermedades.length === 0 && !addingNew && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
              <AlertCircle size={15} className="shrink-0" />
              No hay enfermedades profesionales registradas. Haz clic en "Agregar agente EP" para iniciar.
            </div>
          )}

          {/* Botón Agregar nuevo agente */}
          {!addingNew && (
            <button
              type="button"
              onClick={startNew}
              className="flex items-center gap-2 text-xs bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition font-medium"
            >
              <Plus size={13} /> Agregar nuevo agente EP
            </button>
          )}

        </div>
      )}
    </section>
  )
}
