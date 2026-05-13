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

// Grupos conocidos y sus enfermedades
const GRUPOS_CONOCIDOS = ['Químicos', 'Físicos', 'Biológicos', 'Psicosociales', 'Carcinógenos']

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
  'Otro':          { bg: 'bg-slate-100 border-slate-300',    text: 'text-slate-600',  dot: 'bg-slate-400'  },
}

const INIT_ITEM = (): EnfermedadItem => ({
  id: crypto.randomUUID(),
  grupo_agente: '',
  enfermedad: '',
  actividad_riesgo: '',
})

// Helpers: determina si un valor es "personalizado" (no está en la lista conocida)
function isGrupoOtro(val: string) {
  return val !== '' && !GRUPOS_CONOCIDOS.includes(val)
}
function isEnfermedadOtra(grupo: string, val: string) {
  const lista = GRUPOS[grupo] ?? []
  return val !== '' && !lista.includes(val)
}
// Valor para el <select>: si es personalizado, retorna '__otro__'
function selectGrupoVal(val: string) {
  return isGrupoOtro(val) ? '__otro__' : val
}
function selectEnfVal(grupo: string, val: string) {
  return isEnfermedadOtra(grupo, val) ? '__otro__' : val
}

// ── Fila de formulario reutilizable (nueva o edición) ──────────────
function FilaFormulario({
  item,
  onChange,
  onSave,
  onCancel,
  saveDisabled,
}: {
  item: EnfermedadItem
  onChange: (updated: EnfermedadItem) => void
  onSave: () => void
  onCancel: () => void
  saveDisabled: boolean
}) {
  const enfermedadesLista = GRUPOS[item.grupo_agente] ?? []

  function handleGrupoSelect(val: string) {
    if (val === '__otro__') {
      onChange({ ...item, grupo_agente: '', enfermedad: '' })
    } else {
      onChange({ ...item, grupo_agente: val, enfermedad: '' })
    }
  }

  function handleEnfSelect(val: string) {
    if (val === '__otro__') {
      onChange({ ...item, enfermedad: '' })
    } else {
      onChange({ ...item, enfermedad: val })
    }
  }

  const grupoEsOtro = isGrupoOtro(item.grupo_agente) || selectGrupoVal(item.grupo_agente) === '__otro__'
  // detectar si el usuario eligió '__otro__' pero aún no escribió nada
  const grupoSelectVal = selectGrupoVal(item.grupo_agente)

  return (
    <>
      {/* Grupo de agente */}
      <td className="px-2 py-2 align-top">
        <select
          value={grupoEsOtro ? '__otro__' : item.grupo_agente}
          onChange={e => handleGrupoSelect(e.target.value)}
          className="w-full border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400 text-xs"
        >
          <option value="">Seleccionar...</option>
          {GRUPOS_CONOCIDOS.map(g => <option key={g} value={g}>{g}</option>)}
          <option value="__otro__">Otro</option>
        </select>
        {grupoEsOtro && (
          <input
            autoFocus
            value={item.grupo_agente}
            onChange={e => onChange({ ...item, grupo_agente: e.target.value, enfermedad: '' })}
            placeholder="Especificar grupo..."
            className="mt-1 w-full border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400 text-xs bg-blue-50"
          />
        )}
      </td>

      {/* Enfermedad diagnosticada */}
      <td className="px-2 py-2 align-top">
        {item.grupo_agente && !grupoEsOtro ? (
          <>
            <select
              value={isEnfermedadOtra(item.grupo_agente, item.enfermedad) ? '__otro__' : item.enfermedad}
              onChange={e => handleEnfSelect(e.target.value)}
              className="w-full border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400 text-xs"
            >
              <option value="">Seleccionar...</option>
              {enfermedadesLista.map(e => <option key={e} value={e}>{e}</option>)}
              <option value="__otro__">Otro</option>
            </select>
            {isEnfermedadOtra(item.grupo_agente, item.enfermedad) && (
              <input
                autoFocus
                value={item.enfermedad}
                onChange={e => onChange({ ...item, enfermedad: e.target.value })}
                placeholder="Especificar enfermedad..."
                className="mt-1 w-full border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400 text-xs bg-blue-50"
              />
            )}
          </>
        ) : grupoEsOtro ? (
          // Grupo personalizado → campo libre para enfermedad
          <input
            value={item.enfermedad}
            onChange={e => onChange({ ...item, enfermedad: e.target.value })}
            placeholder="Escribir enfermedad..."
            className="w-full border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400 text-xs bg-blue-50"
          />
        ) : (
          <select disabled className="w-full border border-slate-200 rounded px-2 py-1 text-xs opacity-50">
            <option>Primero seleccione grupo</option>
          </select>
        )}
      </td>

      {/* Actividad de riesgo */}
      <td className="px-2 py-2 align-top">
        <input
          value={item.actividad_riesgo}
          onChange={e => onChange({ ...item, actividad_riesgo: e.target.value })}
          placeholder="Describe la actividad de riesgo..."
          className="w-full border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400 text-xs"
        />
      </td>

      {/* Acciones */}
      <td className="px-2 py-2 align-top">
        <div className="flex items-center justify-center gap-1 mt-0.5">
          <button
            type="button"
            onClick={onSave}
            disabled={saveDisabled}
            className="flex items-center gap-1 bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save size={11} /> Guardar
          </button>
          <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-600 px-1">
            <X size={13} />
          </button>
        </div>
      </td>
    </>
  )
}

// ── Componente principal ───────────────────────────────────────────
export default function EnfermedadesProfesionalesSection({
  tieneEnfermedades,
  enfermedades,
  onChangeTiene,
  onChangeEnfermedades,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft]         = useState<EnfermedadItem | null>(null)
  const [addingNew, setAddingNew] = useState(false)
  const [newItem, setNewItem]     = useState<EnfermedadItem>(INIT_ITEM())

  // Edición
  function startEdit(item: EnfermedadItem) { setEditingId(item.id); setDraft({ ...item }) }
  function cancelEdit() { setEditingId(null); setDraft(null) }
  function saveEdit() {
    if (!draft) return
    onChangeEnfermedades(enfermedades.map(e => e.id === draft.id ? draft : e))
    setEditingId(null); setDraft(null)
  }
  function deleteItem(id: string) {
    onChangeEnfermedades(enfermedades.filter(e => e.id !== id))
  }

  // Nuevo
  function startNew() { setNewItem(INIT_ITEM()); setAddingNew(true) }
  function cancelNew() { setAddingNew(false) }
  function saveNew() {
    if (!newItem.grupo_agente || !newItem.enfermedad) return
    onChangeEnfermedades([...enfermedades, newItem])
    setAddingNew(false)
    setNewItem(INIT_ITEM())
  }

  const headers = (
    <tr className="bg-slate-800 text-white">
      <th className="px-3 py-2.5 text-left font-semibold w-44">Grupo de agente</th>
      <th className="px-3 py-2.5 text-left font-semibold">Enfermedad diagnosticada</th>
      <th className="px-3 py-2.5 text-left font-semibold">Actividad de riesgo</th>
      <th className="w-28 px-3 py-2.5 text-center font-semibold">Acciones</th>
    </tr>
  )

  return (
    <section>
      <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4 pb-2 border-b border-slate-100">
        Enfermedades Profesionales
      </h3>

      {/* Selector Sí / No */}
      <div className="flex gap-3 mb-4">
        {['Sí', 'No'].map(op => (
          <button key={op} type="button" onClick={() => onChangeTiene(op)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold border transition-all ${
              tieneEnfermedades === op
                ? op === 'Sí' ? 'bg-red-600 text-white border-red-600 shadow-sm'
                              : 'bg-green-600 text-white border-green-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
            }`}
          >{op}</button>
        ))}
      </div>

      {/* Mensaje si No */}
      {tieneEnfermedades === 'No' && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
          <CheckCircle size={15} className="shrink-0" />
          En este centro educativo no se reportan enfermedades profesionales.
        </div>
      )}

      {/* Contenido si Sí */}
      {tieneEnfermedades === 'Sí' && (
        <div className="space-y-4">

          {/* Tabla */}
          {(enfermedades.length > 0 || addingNew) && (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-xs">
                <thead>{headers}</thead>
                <tbody>
                  {enfermedades.map((item, i) => {
                    const color = GRUPO_COLORS[item.grupo_agente] ?? GRUPO_COLORS['Otro']
                    const isEditing = editingId === item.id
                    return (
                      <tr key={item.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        {isEditing && draft ? (
                          <FilaFormulario
                            item={draft}
                            onChange={setDraft}
                            onSave={saveEdit}
                            onCancel={cancelEdit}
                            saveDisabled={!draft.grupo_agente || !draft.enfermedad}
                          />
                        ) : (
                          <>
                            <td className="px-3 py-2.5">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-medium ${color.bg} ${color.text}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />
                                {item.grupo_agente}
                              </span>
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

                  {/* Fila nueva */}
                  {addingNew && (
                    <tr className="bg-blue-50 border-t-2 border-blue-200">
                      <FilaFormulario
                        item={newItem}
                        onChange={setNewItem}
                        onSave={saveNew}
                        onCancel={cancelNew}
                        saveDisabled={!newItem.grupo_agente || !newItem.enfermedad}
                      />
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Sin registros */}
          {enfermedades.length === 0 && !addingNew && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
              <AlertCircle size={15} className="shrink-0" />
              No hay enfermedades profesionales registradas. Haz clic en "Agregar agente EP" para iniciar.
            </div>
          )}

          {/* Botón agregar */}
          {!addingNew && (
            <button type="button" onClick={startNew}
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
