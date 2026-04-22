'use client'
import { useState, useEffect } from 'react'
import { Pencil, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  informeId: string
  tabla: string   // e.g. 'informe_hsso'
  value: string
  onChange: (v: string) => void
}

const MAX = 5000

export default function DescripcionCondicion({ informeId, tabla, value, onChange }: Props) {
  const [editando, setEditando] = useState(false)
  const [cargando, setCargando] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // Solo busca el mes anterior si el campo está vacío (informe nuevo)
    if (value) return

    async function cargarAnterior() {
      setCargando(true)

      const { data: informe } = await supabase
        .from('informes')
        .select('escuela_id, periodo_mes, periodo_anio')
        .eq('id', informeId)
        .single()

      if (!informe) { setCargando(false); return }

      const { escuela_id, periodo_mes, periodo_anio } = informe

      // Busca el informe anterior más reciente de la misma escuela
      const { data: anterior } = await supabase
        .from('informes')
        .select('id')
        .eq('escuela_id', escuela_id)
        .neq('id', informeId)
        .or(`periodo_anio.lt.${periodo_anio},and(periodo_anio.eq.${periodo_anio},periodo_mes.lt.${periodo_mes})`)
        .order('periodo_anio', { ascending: false })
        .order('periodo_mes', { ascending: false })
        .limit(1)
        .single()

      if (anterior?.id) {
        const { data: condAnterior } = await supabase
          .from(tabla)
          .select('descripcion_condicion')
          .eq('informe_id', anterior.id)
          .single()

        if (condAnterior?.descripcion_condicion) {
          onChange(condAnterior.descripcion_condicion)
        }
      }

      setCargando(false)
    }

    cargarAnterior()
  }, [informeId, tabla])

  const restantes = MAX - (value?.length ?? 0)
  const porcentaje = Math.min(100, ((value?.length ?? 0) / MAX) * 100)

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      {/* Cabecera */}
      <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5 border-b border-slate-200">
        <div>
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
            Descripción de la condición
          </span>
          {cargando && (
            <span className="ml-2 text-xs text-blue-500 animate-pulse">Cargando informe anterior...</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setEditando(prev => !prev)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            editando
              ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              : 'bg-blue-900 text-white hover:bg-blue-800'
          }`}
        >
          {editando ? (
            <><Lock size={12} /> Bloquear</>
          ) : (
            <><Pencil size={12} /> Editar</>
          )}
        </button>
      </div>

      {/* Área de texto */}
      <div className="relative">
        <textarea
          value={value}
          onChange={e => onChange(e.target.value.slice(0, MAX))}
          disabled={!editando}
          rows={6}
          placeholder="Describa brevemente la implementación de esta condición, clic en editar"
          className={`w-full px-4 py-3 text-sm resize-none focus:outline-none transition-colors ${
            editando
              ? 'bg-white text-slate-800 focus:ring-0'
              : 'bg-slate-50 text-slate-600 cursor-default'
          }`}
        />

        {/* Barra de progreso de caracteres */}
        {editando && (
          <div className="absolute bottom-0 left-0 right-0">
            <div className="h-0.5 bg-slate-100">
              <div
                className={`h-full transition-all ${restantes < 500 ? 'bg-amber-400' : 'bg-blue-400'}`}
                style={{ width: `${porcentaje}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Pie con contador */}
      {editando && (
        <div className="flex justify-end px-4 py-1.5 bg-white border-t border-slate-100">
          <span className={`text-xs ${restantes < 500 ? 'text-amber-500 font-medium' : 'text-slate-400'}`}>
            {restantes.toLocaleString()} caracteres restantes
          </span>
        </div>
      )}
    </div>
  )
}
