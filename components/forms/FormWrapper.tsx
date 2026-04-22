'use client'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Save, CheckCircle } from 'lucide-react'
import { useState } from 'react'

interface Props {
  title: string
  short: string
  informeId: string
  children: React.ReactNode
  onSave: () => Promise<void>
  saved?: boolean
}

export default function FormWrapper({ title, short, informeId, children, onSave, saved }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    setLoading(true)
    setError('')
    try {
      await onSave()
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (e: any) {
      setError(e.message ?? 'Error al guardar')
    }
    setLoading(false)
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
    </div>
  )
}
