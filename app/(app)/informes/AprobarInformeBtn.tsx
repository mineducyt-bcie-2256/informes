'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, Loader2 } from 'lucide-react'

interface AprobarInformeBtnProps {
  informeId: string
  estado: string
  rolUsuario: string
}

export default function AprobarInformeBtn({ informeId, estado, rolUsuario }: AprobarInformeBtnProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const puedeAprobar = ['programador', 'administrador'].includes(rolUsuario)

  async function handleAprobar() {
    setLoading(true)
    setError('')
    const { error: err } = await supabase
      .from('informes')
      .update({ estado: 'aprobado', updated_at: new Date().toISOString() })
      .eq('id', informeId)
    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }
    router.refresh()
    setLoading(false)
  }

  if (!puedeAprobar || estado === 'aprobado') {
    return null
  }

  if (estado !== 'enviado') {
    return null
  }

  return (
    <button
      onClick={handleAprobar}
      disabled={loading}
      title="Aprobar informe"
      className="text-green-600 hover:text-green-800 font-medium text-xs hover:bg-green-50 px-2 py-1 rounded transition disabled:opacity-60"
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin inline" />
      ) : (
        <>
          <CheckCircle size={14} className="inline mr-1" />
          Aprobar
        </>
      )}
    </button>
  )
}
