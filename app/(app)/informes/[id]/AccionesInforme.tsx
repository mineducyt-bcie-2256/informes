'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, Send, Loader2, ExternalLink } from 'lucide-react'

interface Props {
  informeId: string
  estado: string
  pdfUrl: string | null
  rolUsuario: string
}

export default function AccionesInforme({ informeId, estado, pdfUrl, rolUsuario }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function cambiarEstado(nuevoEstado: string) {
    setLoading(true)
    setError('')
    const { error: err } = await supabase
      .from('informes')
      .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
      .eq('id', informeId)
    if (err) { setError(err.message); setLoading(false); return }
    router.refresh()
    setLoading(false)
  }

  const puedeAprobar = ['programador', 'administrador'].includes(rolUsuario)

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Ver PDF subido */}
      {pdfUrl && (
        <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm hover:bg-slate-50 transition">
          <ExternalLink size={15} /> Ver PDF subido
        </a>
      )}

      {/* Enviar (borrador → enviado) */}
      {estado === 'borrador' && (
        <button onClick={() => cambiarEstado('enviado')} disabled={loading}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={15} />}
          Enviar para revisión
        </button>
      )}

      {/* Aprobar (enviado → aprobado) — solo roles autorizados */}
      {estado === 'enviado' && puedeAprobar && (
        <button onClick={() => cambiarEstado('aprobado')} disabled={loading}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={15} />}
          Aprobar informe
        </button>
      )}

      {/* Devolver a borrador */}
      {estado === 'enviado' && puedeAprobar && (
        <button onClick={() => cambiarEstado('borrador')} disabled={loading}
          className="flex items-center gap-2 border border-red-300 text-red-600 px-4 py-2 rounded-lg text-sm hover:bg-red-50 disabled:opacity-60">
          Devolver a borrador
        </button>
      )}

      {/* Badge aprobado */}
      {estado === 'aprobado' && (
        <span className="flex items-center gap-2 text-green-700 font-medium text-sm">
          <CheckCircle size={16} className="text-green-500" /> Informe aprobado
        </span>
      )}

      {error && <p className="text-red-500 text-xs w-full">{error}</p>}
    </div>
  )
}
