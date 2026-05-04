'use client'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Save, CheckCircle, DownloadCloud, X } from 'lucide-react'
import { useState } from 'react'

interface Props {
  title: string
  short: string
  informeId: string
  children: React.ReactNode
  onSave: (justificacion?: string) => Promise<void>
  onPreload?: () => Promise<void>
  isModified?: () => boolean
  saved?: boolean
}

export default function FormWrapper({ title, short, informeId, children, onSave, onPreload, isModified }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [preloading, setPreloading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // Modal "sin cambios"
  const [showModal, setShowModal] = useState(false)
  const [justificacion, setJustificacion] = useState('')
  const [justError, setJustError] = useState(false)

  async function handlePreload() {
    if (!onPreload) return
    setPreloading(true)
    setError('')
    try {
      await onPreload()
    } catch (e: any) {
      setError(e.message ?? 'Error al precargar')
    }
    setPreloading(false)
  }

  async function handleSave() {
    // Si hay función de precarga y no se modificó nada → mostrar modal
    if (onPreload && isModified && !isModified()) {
      setJustificacion('')
      setJustError(false)
      setShowModal(true)
      return
    }
    await ejecutarGuardado()
  }

  async function ejecutarGuardado(just?: string) {
    setLoading(true)
    setError('')
    try {
      await onSave(just)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (e: any) {
      setError(e.message ?? 'Error al guardar')
    }
    setLoading(false)
  }

  async function confirmarSinCambios() {
    if (!justificacion.trim()) {
      setJustError(true)
      return
    }
    setShowModal(false)
    await ejecutarGuardado(justificacion.trim())
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* ── Barra superior sticky ── */}
      <div className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 px-8 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-700 text-sm"
          >
            <ChevronLeft size={16} />
            Volver
          </button>
          <span className="text-slate-300">|</span>
          <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">{short}</span>
          <h1 className="text-lg font-bold text-slate-800 truncate">{title}</h1>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {success && (
            <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
              <CheckCircle size={16} />
              Guardado
            </span>
          )}
          {error && (
            <span className="text-red-500 text-sm">{error}</span>
          )}
          {onPreload && (
            <button
              type="button"
              onClick={handlePreload}
              disabled={preloading}
              className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-60"
            >
              <DownloadCloud size={15} />
              {preloading ? 'Precargando...' : 'Precargar mes anterior'}
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-60"
          >
            <Save size={15} />
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>

      {/* ── Contenido ── */}
      <div className="p-8 max-w-4xl w-full">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          {children}
        </div>
      </div>

      {/* ── Modal sin cambios ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-800">¿Continuar sin cambios?</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-5">
              No se han realizado modificaciones a la información precargada. ¿Desea continuar?
            </p>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Explique por qué no se realizaron cambios <span className="text-red-500">*</span>
              </label>
              <textarea
                value={justificacion}
                onChange={e => { setJustificacion(e.target.value); setJustError(false) }}
                rows={3}
                placeholder="Escriba la justificación aquí..."
                className={`w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  justError ? 'border-red-400 bg-red-50' : 'border-slate-300'
                }`}
              />
              {justError && <p className="text-xs text-red-500 mt-1">Este campo es obligatorio.</p>}
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarSinCambios}
                className="px-4 py-2 text-sm rounded-lg bg-blue-900 text-white font-medium hover:bg-blue-800"
              >
                Guardar de todas formas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
