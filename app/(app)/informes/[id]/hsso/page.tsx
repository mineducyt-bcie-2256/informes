'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import FormWrapper from '@/components/forms/FormWrapper'
import EscuelaInfoHeader from '@/components/forms/EscuelaInfoHeader'
import DescripcionCondicion from '@/components/forms/DescripcionCondicion'
import AccidentesSection from '@/components/forms/AccidentesSection'
import CapacitacionesSection from '@/components/forms/CapacitacionesSection'

const INIT = {
  descripcion_condicion: '',
  personal_hombres: 0, personal_mujeres: 0, personal_total: 0,
  epp_entregado: '', epp_personal_cubierto: 0, epp_sin_uso: 0, epp_motivo_no_uso: '', epp_recomendaciones: '',
  tiene_accidentes: '',
  accidentes: [] as any[],
  tiene_capacitaciones: '',
  capacitaciones_list: [] as any[],
}

export default function HssoPage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState(INIT)
  const supabase = createClient()

  useEffect(() => {
    supabase.from('informe_hsso').select('*').eq('informe_id', id).single()
      .then(({ data: d }) => { if (d) setData(d) })
  }, [id])

  function set(field: string, value: any) {
    setData(prev => {
      const next = { ...prev, [field]: value }
      if (field === 'personal_hombres' || field === 'personal_mujeres') {
        const h = field === 'personal_hombres' ? (parseInt(value) || 0) : (parseInt(String(prev.personal_hombres)) || 0)
        const m = field === 'personal_mujeres' ? (parseInt(value) || 0) : (parseInt(String(prev.personal_mujeres)) || 0)
        next.personal_total = h + m
      }
      return next
    })
  }

  async function onSave() {
    const { error } = await supabase.from('informe_hsso').upsert({ ...data, informe_id: id }, { onConflict: 'informe_id' })
    if (error) throw new Error(error.message)
  }

  const input = (field: keyof typeof INIT, type = 'text', placeholder = '', readOnly = false) => (
    <input type={type} value={data[field] as any}
      onChange={e => !readOnly && set(field, type === 'number' ? e.target.value : e.target.value)}
      onBlur={e => type === 'number' && set(field, parseInt(e.target.value) || 0)}
      placeholder={placeholder} readOnly={readOnly}
      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        readOnly ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-default' : 'border-slate-300'}`}
    />
  )
  const textarea = (field: keyof typeof INIT, placeholder = '') => (
    <textarea value={data[field] as any} onChange={e => set(field, e.target.value)}
      placeholder={placeholder} rows={2}
      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
  )
  const epp_select = (field: keyof typeof INIT, options: string[]) => (
    <select value={data[field] as any} onChange={e => set(field, e.target.value)}
      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
      <option value="">Seleccionar...</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )

  return (
    <FormWrapper title="Condición 1 - Seguimiento al Plan de Higiene, Salud y Seguridad Ocupacional" short="HSSO" informeId={id} onSave={onSave}>
      <div className="space-y-8">

        <EscuelaInfoHeader informeId={id} />

        <DescripcionCondicion
          informeId={id}
          tabla="informe_hsso"
          value={data.descripcion_condicion}
          onChange={v => set('descripcion_condicion', v)}
        />

        <section>
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4 pb-2 border-b border-slate-100">Personal en obra</h3>
          <div className="grid grid-cols-3 gap-4 max-w-sm">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Hombres</label>
              {input('personal_hombres', 'number')}
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Mujeres</label>
              {input('personal_mujeres', 'number')}
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Total</label>
              <div className="relative">
                {input('personal_total', 'number', '', true)}
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-blue-500 font-medium">auto</span>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4 pb-2 border-b border-slate-100">Equipo de Protección Personal (EPP)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">La empresa contratista hace entrega de EPP</label>
              {epp_select('epp_entregado', ['Sí', 'No', 'Parcialmente'])}
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">
                Personal cubierto por EPP
                <span className="ml-1 font-normal text-slate-400">(coloque cantidad de personal)</span>
              </label>
              {input('epp_personal_cubierto', 'number')}
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">
                Personal que no hace uso de EPP
                <span className="ml-1 font-normal text-slate-400">(coloque cantidad de personal)</span>
              </label>
              {input('epp_sin_uso', 'number')}
            </div>

            {(parseInt(String(data.epp_sin_uso)) >= 1) && (
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-amber-600 mb-1 block">
                  Describa los motivos de no usar EPP
                  <span className="ml-1 font-normal text-slate-400">(describa los casos donde no se hizo uso de EPP o uso incorrecto)</span>
                </label>
                <textarea
                  value={data.epp_motivo_no_uso}
                  onChange={e => set('epp_motivo_no_uso', e.target.value)}
                  rows={3}
                  placeholder="Describa los casos donde no se hizo uso de EPP o uso incorrecto..."
                  className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none bg-amber-50"
                />
              </div>
            )}

            <div className="md:col-span-2">
              <label className="text-xs font-medium text-slate-500 mb-1 block">Avance en la implementación, comentarios o recomendaciones generales sobre el uso de EPP</label>
              {textarea('epp_recomendaciones', 'Describa el avance, comentarios o recomendaciones...')}
            </div>

          </div>
        </section>

        <AccidentesSection
          tieneAccidentes={data.tiene_accidentes}
          accidentes={data.accidentes}
          onChangeTiene={v => set('tiene_accidentes', v)}
          onChangeAccidentes={v => set('accidentes', v)}
        />

        <CapacitacionesSection
          tieneCapacitaciones={data.tiene_capacitaciones}
          capacitaciones={data.capacitaciones_list}
          onChangeTiene={v => set('tiene_capacitaciones', v)}
          onChangeCapacitaciones={v => set('capacitaciones_list', v)}
        />

      </div>
    </FormWrapper>
  )
}
