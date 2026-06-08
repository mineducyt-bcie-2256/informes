'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import FormWrapper from '@/components/forms/FormWrapper'
import EscuelaInfoHeader from '@/components/forms/EscuelaInfoHeader'
import DescripcionCondicion from '@/components/forms/DescripcionCondicion'
import { AlertCircle } from 'lucide-react'

const INIT = {
  descripcion_condicion: '',
  casos_reportados: '',
  acciones_tomadas: '',
}

const inputCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const textareaCls = `${inputCls} resize-none`
const labelCls = 'text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 block'

export default function CasosEspecialesPage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()

  const [form, setForm] = useState(INIT)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: casos } = await supabase
        .from('informe_casos_especiales')
        .select('*')
        .eq('informe_id', id)
        .single()

      if (casos) {
        setForm({
          descripcion_condicion: casos.descripcion_condicion ?? '',
          casos_reportados: casos.casos_reportados ?? '',
          acciones_tomadas: casos.acciones_tomadas ?? '',
        })
      }

      setLoading(false)
    }
    load()
  }, [id, supabase])

  async function handleSave() {
    const payload = {
      informe_id: id,
      descripcion_condicion: form.descripcion_condicion || null,
      casos_reportados: form.casos_reportados || null,
      acciones_tomadas: form.acciones_tomadas || null,
    }

    const { error } = await supabase
      .from('informe_casos_especiales')
      .upsert(payload, { onConflict: 'informe_id' })

    if (error) throw new Error(error.message)
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Cargando...</div>
  }

  return (
    <FormWrapper
      title="Casos Especiales"
      short="CASOS"
      informeId={id}
      onSave={handleSave}
    >
      <div className="space-y-6">
        <EscuelaInfoHeader informeId={id} />

        <DescripcionCondicion
          informeId={id}
          tabla="informe_casos_especiales"
          value={form.descripcion_condicion}
          onChange={(v) => setForm((p) => ({ ...p, descripcion_condicion: v }))}
        />

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
          <AlertCircle size={16} className="text-blue-600 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700">
            Utiliza esta sección para reportar cualquier situación especial, incidente o evento relevante que no esté cubierto por otras condiciones.
          </p>
        </div>

        <div>
          <label className={labelCls}>Casos reportados</label>
          <textarea
            value={form.casos_reportados}
            onChange={(e) => setForm((p) => ({ ...p, casos_reportados: e.target.value }))}
            placeholder="Describe los casos especiales o situaciones anormales detectadas..."
            rows={5}
            className={textareaCls}
          />
        </div>

        <div>
          <label className={labelCls}>Acciones tomadas</label>
          <textarea
            value={form.acciones_tomadas}
            onChange={(e) => setForm((p) => ({ ...p, acciones_tomadas: e.target.value }))}
            placeholder="Detalla las acciones que se han implementado para atender estos casos..."
            rows={5}
            className={textareaCls}
          />
        </div>
      </div>
    </FormWrapper>
  )
}
