'use client'
import { useState } from 'react'
import { Trash2, X, AlertTriangle } from 'lucide-react'

export default function BorrarInforme({ informeId, nombre, periodo }: {
  informeId: string
  nombre:    string
  periodo:   string
}) {
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function handleDelete() {
    setLoading(true)
    const res = await fetch('/api/delete-informe', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ informeId }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Error al eliminar'); setLoading(false); return }
    window.location.reload()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Eliminar informe"
        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
      >
        <Trash2 size={14} />
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex flex-col items-center text-center gap-3 mb-5">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle size={26} className="text-red-500" />
              </div>
              <h2 className="font-bold text-lg text-slate-800">Eliminar informe</h2>
              <p className="text-sm text-slate-500">
                ¿Eliminar el informe de <strong>{nombre}</strong> — {periodo}?
                <br />Esta acción no se puede deshacer.
              </p>
            </div>
            {error && <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>}
            <div className="flex gap-3">
              <button onClick={() => setOpen(false)}
                className="flex-1 border border-slate-300 text-slate-600 py-2.5 rounded-lg text-sm hover:bg-slate-50">
                Cancelar
              </button>
              <button onClick={handleDelete} disabled={loading}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60">
                {loading ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
