'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MESES } from '@/types'

interface Props {
  informeId: string
}

interface InfoState {
  nombre: string
  codigo: string
  empresa_obras: string
  periodo_mes: number
  periodo_anio: number
}

export default function EscuelaInfoHeader({ informeId }: Props) {
  const [info, setInfo] = useState<InfoState | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: informe } = await supabase
        .from('informes').select('escuela_id, periodo_mes, periodo_anio').eq('id', informeId).single()
      if (!informe?.escuela_id) return

      const { data: escuela } = await supabase
        .from('escuelas').select('nombre, codigo, empresa_obras').eq('id', informe.escuela_id).single()
      if (escuela) {
        setInfo({
          nombre: escuela.nombre,
          codigo: escuela.codigo,
          empresa_obras: escuela.empresa_obras,
          periodo_mes: informe.periodo_mes,
          periodo_anio: informe.periodo_anio,
        })
      }
    }
    load()
  }, [informeId])

  if (!info) return null

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 bg-blue-50 border border-blue-100 rounded-xl px-5 py-3">
      <div>
        <span className="text-xs text-blue-400 font-medium uppercase tracking-wide">Informe</span>
        <p className="text-sm font-bold text-blue-700 mt-0.5">{MESES[info.periodo_mes - 1]} {info.periodo_anio}</p>
      </div>
      <div className="h-8 w-px bg-blue-200 hidden md:block" />
      <div>
        <span className="text-xs text-blue-400 font-medium uppercase tracking-wide">Centro Educativo</span>
        <p className="text-sm font-semibold text-blue-900 mt-0.5">{info.nombre}</p>
      </div>
      <div className="h-8 w-px bg-blue-200 hidden md:block" />
      <div>
        <span className="text-xs text-blue-400 font-medium uppercase tracking-wide">Código</span>
        <p className="text-sm font-mono font-semibold text-blue-900 mt-0.5">{info.codigo}</p>
      </div>
      <div className="h-8 w-px bg-blue-200 hidden md:block" />
      <div>
        <span className="text-xs text-blue-400 font-medium uppercase tracking-wide">Empresa Contratista</span>
        <p className="text-sm font-semibold text-blue-900 mt-0.5">{info.empresa_obras ?? '—'}</p>
      </div>
    </div>
  )
}
