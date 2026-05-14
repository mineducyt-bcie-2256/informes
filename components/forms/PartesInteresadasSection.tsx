'use client'
import { useState, useRef, useEffect } from 'react'
import { Users, Plus, X, Check } from 'lucide-react'

// ── Tipos ─────────────────────────────────────────────────────────
type ParteVal = { activa: boolean; hombres: number; mujeres: number; label?: string }
type PartesMap = Record<string, ParteVal>

interface Props {
  value:    PartesMap
  onChange: (v: PartesMap) => void
}

const FIJAS = [
  { key: 'alumnos',    label: 'Alumnos'    },
  { key: 'profesores', label: 'Profesores' },
  { key: 'director',   label: 'Director'   },
  { key: 'cde',        label: 'CDE'        },
  { key: 'personal',   label: 'Personal del proyecto / trabajadores' },
]
const FIJAS_KEYS = FIJAS.map(f => f.key)

// ── Nueva fila pendiente de confirmación ──────────────────────────
interface NuevaFila {
  label:   string
  hombres: string
  mujeres: string
}

const NUEVA_INIT: NuevaFila = { label: '', hombres: '', mujeres: '' }

// ── Componente ────────────────────────────────────────────────────
export default function PartesInteresadasSection({ value, onChange }: Props) {
  // Estado del mapa principal (partes guardadas)
  const [partes, setPartes] = useState<PartesMap>(value)

  // Estado de la fila nueva en edición (completamente aislado)
  const [nueva, setNueva]       = useState<NuevaFila | null>(null)
  const labelInputRef           = useRef<HTMLInputElement>(null)

  // Sincronizar cuando el padre carga datos externos (BD / precarga)
  const extJson = useRef(JSON.stringify(value))
  useEffect(() => {
    const next = JSON.stringify(value)
    if (next !== extJson.current) {
      extJson.current = next
      setPartes(value)
    }
  }, [value])

  // Notifica al padre evitando re-sincronización circular
  function save(next: PartesMap) {
    extJson.current = JSON.stringify(next)
    setPartes(next)
    onChange(next)
  }

  // ── Fila fija: toggle activa
  function toggle(key: string) {
    save({ ...partes, [key]: { ...partes[key], activa: !partes[key]?.activa } })
  }

  // ── Fila fija: cambio de número (inmediato, no afecta el input de texto)
  function setNum(key: string, field: 'hombres' | 'mujeres', raw: string) {
    const n = Math.max(0, parseInt(raw) || 0)
    save({ ...partes, [key]: { ...partes[key], [field]: n } })
  }

  // ── Confirmar nueva fila
  function confirmarNueva() {
    if (!nueva || !nueva.label.trim()) return
    const key = `custom_${Date.now()}`
    const next = {
      ...partes,
      [key]: {
        activa:  true,
        hombres: Math.max(0, parseInt(nueva.hombres) || 0),
        mujeres: Math.max(0, parseInt(nueva.mujeres) || 0),
        label:   nueva.label.trim(),
      },
    }
    save(next)
    setNueva(null)
  }

  // ── Eliminar fila custom guardada
  function eliminar(key: string) {
    const next = { ...partes }
    delete next[key]
    save(next)
  }

  // Fila nueva: auto-focus al aparecer
  useEffect(() => {
    if (nueva !== null) labelInputRef.current?.focus()
  }, [nueva !== null])

  // ── Cálculo de totales
  const customKeys  = Object.keys(partes).filter(k => !FIJAS_KEYS.includes(k))
  const todasActivas = [...FIJAS.map(f => f.key), ...customKeys]
    .map(k => partes[k])
    .filter(p => p?.activa)
  const totalH = todasActivas.reduce((s, p) => s + (p?.hombres ?? 0), 0)
  const totalM = todasActivas.reduce((s, p) => s + (p?.mujeres ?? 0), 0)

  // ── Totales de la fila nueva (preview en tiempo real)
  const nuevaH = Math.max(0, parseInt(nueva?.hombres ?? '') || 0)
  const nuevaM = Math.max(0, parseInt(nueva?.mujeres ?? '') || 0)

  const hayActivas = todasActivas.length > 0 || (nueva !== null)

  const numCls = (activa: boolean) =>
    `w-full border rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
      activa
        ? 'border-slate-300 bg-white text-slate-800'
        : 'border-slate-200 bg-slate-100 text-slate-300 cursor-not-allowed'
    }`

  return (
    <section>
      <div className="mb-4 pb-2 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Partes Interesadas</h3>
      </div>

      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-5">
        <Users size={16} className="text-blue-500 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">
          Registre las partes interesadas presentes en el periodo, indicando la cantidad de participantes por género.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 overflow-hidden">

        {/* Cabecera */}
        <div className="grid grid-cols-[1fr_90px_90px_72px] bg-slate-50 border-b border-slate-200 px-4 py-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Parte interesada</span>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide text-center">Hombres</span>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide text-center">Mujeres</span>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide text-center">Total</span>
        </div>

        <div className="divide-y divide-slate-100">

          {/* ── Filas fijas ───────────────────────────────────── */}
          {FIJAS.map(({ key, label }) => {
            const p     = partes[key] ?? { activa: false, hombres: 0, mujeres: 0 }
            const total = (p.hombres ?? 0) + (p.mujeres ?? 0)
            return (
              <div key={key} className={`grid grid-cols-[1fr_90px_90px_72px] items-center px-4 py-3 ${p.activa ? 'bg-white' : 'bg-slate-50/60'}`}>
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={!!p.activa} onChange={() => toggle(key)}
                    className="w-4 h-4 text-blue-600 rounded shrink-0 cursor-pointer" />
                  <span className={`text-sm font-medium ${p.activa ? 'text-slate-800' : 'text-slate-400'}`}>{label}</span>
                </div>
                <div className="px-2">
                  <input type="number" min={0}
                    value={p.activa ? (p.hombres || '') : ''}
                    disabled={!p.activa}
                    onChange={e => setNum(key, 'hombres', e.target.value)}
                    placeholder="0"
                    className={numCls(p.activa)} />
                </div>
                <div className="px-2">
                  <input type="number" min={0}
                    value={p.activa ? (p.mujeres || '') : ''}
                    disabled={!p.activa}
                    onChange={e => setNum(key, 'mujeres', e.target.value)}
                    placeholder="0"
                    className={numCls(p.activa)} />
                </div>
                <div className="px-1 text-center">
                  {p.activa
                    ? <span className={`inline-block min-w-[40px] px-2 py-1 rounded-lg text-sm font-semibold ${total > 0 ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-400'}`}>{total}</span>
                    : <span className="text-slate-300 text-sm">—</span>}
                </div>
              </div>
            )
          })}

          {/* ── Filas custom guardadas ────────────────────────── */}
          {customKeys.map(key => {
            const p     = partes[key]
            const total = (p?.hombres ?? 0) + (p?.mujeres ?? 0)
            return (
              <div key={key} className="grid grid-cols-[1fr_90px_90px_72px_28px] items-center px-4 py-3 bg-white">
                <div className="flex items-center gap-3 pr-1">
                  <input type="checkbox" checked={!!p?.activa}
                    onChange={() => toggle(key)}
                    className="w-4 h-4 text-blue-600 rounded shrink-0 cursor-pointer" />
                  <span className="text-sm font-medium text-slate-700">{p?.label ?? key}</span>
                </div>
                <div className="px-2">
                  <input type="number" min={0}
                    value={p?.activa ? (p.hombres || '') : ''}
                    disabled={!p?.activa}
                    onChange={e => setNum(key, 'hombres', e.target.value)}
                    placeholder="0"
                    className={numCls(!!p?.activa)} />
                </div>
                <div className="px-2">
                  <input type="number" min={0}
                    value={p?.activa ? (p.mujeres || '') : ''}
                    disabled={!p?.activa}
                    onChange={e => setNum(key, 'mujeres', e.target.value)}
                    placeholder="0"
                    className={numCls(!!p?.activa)} />
                </div>
                <div className="px-1 text-center">
                  <span className={`inline-block min-w-[40px] px-2 py-1 rounded-lg text-sm font-semibold ${total > 0 ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-400'}`}>{total}</span>
                </div>
                <button type="button" onClick={() => eliminar(key)}
                  className="w-6 h-6 flex items-center justify-center rounded text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors">
                  <X size={13} />
                </button>
              </div>
            )
          })}

          {/* ── Fila nueva en edición (estado completamente local) ── */}
          {nueva !== null && (
            <div className="grid grid-cols-[1fr_90px_90px_72px_28px] items-center px-4 py-3 bg-blue-50 border-t-2 border-blue-200">
              <div className="flex items-center gap-2 pr-1">
                <input
                  ref={labelInputRef}
                  type="text"
                  value={nueva.label}
                  onChange={e => setNueva(prev => prev ? { ...prev, label: e.target.value } : prev)}
                  placeholder="Nombre del grupo..."
                  className="text-sm border border-blue-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white w-full"
                />
              </div>
              <div className="px-2">
                <input
                  type="number" min={0}
                  value={nueva.hombres}
                  onChange={e => setNueva(prev => prev ? { ...prev, hombres: e.target.value } : prev)}
                  placeholder="0"
                  className="w-full border border-blue-300 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                />
              </div>
              <div className="px-2">
                <input
                  type="number" min={0}
                  value={nueva.mujeres}
                  onChange={e => setNueva(prev => prev ? { ...prev, mujeres: e.target.value } : prev)}
                  placeholder="0"
                  className="w-full border border-blue-300 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                />
              </div>
              <div className="px-1 text-center">
                <span className={`inline-block min-w-[40px] px-2 py-1 rounded-lg text-sm font-semibold ${(nuevaH + nuevaM) > 0 ? 'bg-blue-100 text-blue-700' : 'text-slate-400'}`}>
                  {nuevaH + nuevaM || 0}
                </span>
              </div>
              <button type="button" onClick={() => setNueva(null)}
                className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                <X size={13} />
              </button>
            </div>
          )}
        </div>

        {/* Total general */}
        {hayActivas && (
          <div className="grid grid-cols-[1fr_90px_90px_72px] items-center px-4 py-2.5 bg-blue-600 border-t border-blue-700">
            <span className="text-xs font-bold text-white uppercase tracking-wide">Total general</span>
            <div className="px-2 text-center"><span className="text-sm font-bold text-white">{totalH + nuevaH}</span></div>
            <div className="px-2 text-center"><span className="text-sm font-bold text-white">{totalM + nuevaM}</span></div>
            <div className="px-1 text-center">
              <span className="text-sm font-bold text-white bg-white/20 px-2 py-1 rounded-lg">
                {totalH + totalM + nuevaH + nuevaM}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Botones */}
      <div className="mt-3 flex gap-2">
        {nueva === null ? (
          <button type="button" onClick={() => setNueva(NUEVA_INIT)}
            className="flex items-center gap-2 px-4 py-2 border border-dashed border-slate-300 rounded-xl text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors w-full justify-center">
            <Plus size={14} /> Agregar otro grupo
          </button>
        ) : (
          <button type="button" onClick={confirmarNueva}
            disabled={!nueva.label.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <Check size={14} /> Confirmar grupo
          </button>
        )}
      </div>
    </section>
  )
}
