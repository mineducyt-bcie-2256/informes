'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'
import FormWrapper from '@/components/forms/FormWrapper'
import EscuelaInfoHeader from '@/components/forms/EscuelaInfoHeader'
import DescripcionCondicion from '@/components/forms/DescripcionCondicion'
import { AlertCircle } from 'lucide-react'

export default function CumplimientoAmbientalPage() {
  const params = useParams()
  const informeId = params.id as string
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>({
    descripcion_condicion: '',
    // Tala
    tala_se_realizara: null,
    tala_tiene_permiso: null,
    tala_tipo_permiso: '',
    tala_tiene_plan_compensacion: null,
    tala_alerta_critica: false,
    // Asbesto
    asbesto_presencia_msac: null,
    asbesto_tiene_plan: null,
    asbesto_alerta_critica: false,
    asbesto_metros_cuadrados: null,
    // Biodiversidad
    biodiversidad_tiene_danos: null,
    biodiversidad_descripcion: '',
    // Reubicación
    reubicacion_involuntaria: null,
    reubicacion_tiene_pri: null,
    reubicacion_alerta_critica: false,
    reubicacion_sitio_pri: '',
    reubicacion_condiciones: '',
    reubicacion_estado: '',
  })

  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const { data: existingData, error } = await supabase
        .from('informe_cumplimiento_ambiental')
        .select('*')
        .eq('informe_id', informeId)
        .single()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows found, which is expected for new records
        console.warn('Error loading data:', error)
      }

      if (existingData) {
        setData(existingData)
      }
    } catch (error) {
      console.warn('Error loading cumplimiento ambiental data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    try {
      const { data: existingData } = await supabase
        .from('informe_cumplimiento_ambiental')
        .select('id')
        .eq('informe_id', informeId)
        .single()

      const payload = { informe_id: informeId, ...data }

      if (existingData) {
        const { error } = await supabase
          .from('informe_cumplimiento_ambiental')
          .update(payload)
          .eq('id', existingData.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('informe_cumplimiento_ambiental')
          .insert([payload])
        if (error) throw error
      }
    } catch (error: any) {
      console.error('Error saving cumplimiento ambiental:', error)
      throw error
    }
  }

  if (loading) return <div className="p-4">Cargando...</div>

  return (
    <FormWrapper
      title="Condición 9 - Cumplimiento Ambiental"
      short="CUMPL.AMB"
      informeId={informeId}
      onSave={handleSave}
    >
      <EscuelaInfoHeader informeId={informeId} />
      <DescripcionCondicion
        informeId={informeId}
        tabla="informe_cumplimiento_ambiental"
        value={data.descripcion_condicion}
        onChange={val => setData((p: any) => ({ ...p, descripcion_condicion: val }))}
      />

      {/* SECCIÓN 1: TALA DE ÁRBOLES */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold text-slate-800 mb-6 border-b pb-4">1. Tala de Árboles</h2>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <label className="flex items-center gap-3 font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={data.tala_se_realizara === true}
              onChange={e => setData((p: any) => ({ ...p, tala_se_realizara: e.target.checked ? true : null }))}
              className="w-5 h-5"
            />
            ¿Se realizará tala de árboles?
          </label>
        </div>

        {data.tala_se_realizara === true && (
          <div className="p-4 bg-amber-50 rounded-lg border-l-4 border-amber-500">
            <h3 className="font-bold text-slate-800 mb-4">Permiso para tala</h3>
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={data.tala_tiene_permiso === true}
                  onChange={() => setData((p: any) => ({ ...p, tala_tiene_permiso: true }))}
                />
                Sí, tiene permiso
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={data.tala_tiene_permiso === false}
                  onChange={() => setData((p: any) => ({ ...p, tala_tiene_permiso: false }))}
                />
                No tiene permiso
              </label>
            </div>

            {data.tala_tiene_permiso === true && (
              <div className="mt-4">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Institución que emite:</label>
                <select
                  value={data.tala_tipo_permiso}
                  onChange={e => setData((p: any) => ({ ...p, tala_tipo_permiso: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="">Seleccione...</option>
                  <option value="MARN">MARN</option>
                  <option value="DOT">DOT</option>
                  <option value="Municipalidad">Municipalidad</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            )}

            {data.tala_tiene_permiso === false && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-300">
                <h4 className="font-bold text-red-800 mb-3">Plan de Compensación Interna</h4>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={data.tala_tiene_plan_compensacion === true}
                      onChange={() => setData((p: any) => ({ ...p, tala_tiene_plan_compensacion: true, tala_alerta_critica: false }))}
                    />
                    Sí, tiene plan
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={data.tala_tiene_plan_compensacion === false}
                      onChange={() => setData((p: any) => ({ ...p, tala_tiene_plan_compensacion: false, tala_alerta_critica: true }))}
                    />
                    No tiene plan
                  </label>
                </div>

                {data.tala_alerta_critica && (
                  <div className="mt-3 p-3 bg-red-100 border border-red-400 rounded flex gap-3">
                    <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                    <div className="text-sm text-red-700">
                      <p className="font-bold">⚠️ SITUACIÓN CRÍTICA</p>
                      <p>Debe presentar un plan de compensación de forma inmediata.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECCIÓN 2: ASBESTO CEMENTO */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold text-slate-800 mb-6 border-b pb-4">2. Asbesto Cemento</h2>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <label className="flex items-center gap-3 font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={data.asbesto_presencia_msac === true}
              onChange={e => setData((p: any) => ({ ...p, asbesto_presencia_msac: e.target.checked ? true : null }))}
              className="w-5 h-5"
            />
            ¿Hay presencia de material sospechoso de Asbesto Cemento (MSAC)?
          </label>
        </div>

        {data.asbesto_presencia_msac === true && (
          <div className="p-4 bg-amber-50 rounded-lg border-l-4 border-amber-500">
            <h3 className="font-bold text-slate-800 mb-3">Plan de Manejo de MSAC</h3>
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={data.asbesto_tiene_plan === true}
                  onChange={() => setData((p: any) => ({ ...p, asbesto_tiene_plan: true, asbesto_alerta_critica: false }))}
                />
                Sí, tiene plan
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={data.asbesto_tiene_plan === false}
                  onChange={() => setData((p: any) => ({ ...p, asbesto_tiene_plan: false, asbesto_alerta_critica: true }))}
                />
                No tiene plan
              </label>
            </div>

            {data.asbesto_alerta_critica && (
              <div className="p-3 bg-red-100 border border-red-400 rounded flex gap-3 mb-4">
                <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                <div className="text-sm text-red-700">
                  <p className="font-bold">⚠️ ALERTA INMEDIATA</p>
                  <p>Presentar plan de manejo de MSAC de forma inmediata.</p>
                </div>
              </div>
            )}

            {data.asbesto_tiene_plan === true && (
              <div className="mt-4">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Cantidad de metros cuadrados:</label>
                <input
                  type="number"
                  step="0.01"
                  value={data.asbesto_metros_cuadrados || ''}
                  onChange={e => setData((p: any) => ({ ...p, asbesto_metros_cuadrados: e.target.value ? parseFloat(e.target.value) : null }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="m²"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECCIÓN 3: BIODIVERSIDAD */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold text-slate-800 mb-6 border-b pb-4">3. Daños a la Biodiversidad</h2>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <label className="flex items-center gap-3 font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={data.biodiversidad_tiene_danos === true}
              onChange={e => setData((p: any) => ({ ...p, biodiversidad_tiene_danos: e.target.checked ? true : null }))}
              className="w-5 h-5"
            />
            ¿Hay daños a la biodiversidad y ecosistemas?
          </label>
        </div>

        {data.biodiversidad_tiene_danos === true && (
          <textarea
            value={data.biodiversidad_descripcion}
            onChange={e => setData((p: any) => ({ ...p, biodiversidad_descripcion: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            rows={4}
            placeholder="Descripción de daños..."
          />
        )}
      </div>

      {/* SECCIÓN 4: REUBICACIÓN INVOLUNTARIA */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold text-slate-800 mb-6 border-b pb-4">4. Reubicación Involuntaria</h2>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <label className="flex items-center gap-3 font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={data.reubicacion_involuntaria === true}
              onChange={e => setData((p: any) => ({ ...p, reubicacion_involuntaria: e.target.checked ? true : null }))}
              className="w-5 h-5"
            />
            ¿Hay reubicación involuntaria?
          </label>
        </div>

        {data.reubicacion_involuntaria === true && (
          <div className="p-4 bg-amber-50 rounded-lg border-l-4 border-amber-500">
            <h3 className="font-bold text-slate-800 mb-4">Plan de Reubicación Involuntaria (PRI)</h3>
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={data.reubicacion_tiene_pri === true}
                  onChange={() => setData((p: any) => ({ ...p, reubicacion_tiene_pri: true, reubicacion_alerta_critica: false }))}
                />
                Sí, tiene PRI
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={data.reubicacion_tiene_pri === false}
                  onChange={() => setData((p: any) => ({ ...p, reubicacion_tiene_pri: false, reubicacion_alerta_critica: true }))}
                />
                No tiene PRI
              </label>
            </div>

            {data.reubicacion_alerta_critica && (
              <div className="p-3 bg-red-100 border border-red-400 rounded flex gap-3 mb-4">
                <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                <div className="text-sm text-red-700">
                  <p className="font-bold">⚠️ ELABORACIÓN INMEDIATA</p>
                  <p>Elaborar un Plan de Reubicación Involuntaria de forma inmediata.</p>
                </div>
              </div>
            )}

            {data.reubicacion_tiene_pri === true && (
              <div className="space-y-4">
                <input
                  type="text"
                  value={data.reubicacion_sitio_pri}
                  onChange={e => setData((p: any) => ({ ...p, reubicacion_sitio_pri: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="Sitio de PRI..."
                />
                <textarea
                  value={data.reubicacion_condiciones}
                  onChange={e => setData((p: any) => ({ ...p, reubicacion_condiciones: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  rows={3}
                  placeholder="Condiciones..."
                />
                <input
                  type="text"
                  value={data.reubicacion_estado}
                  onChange={e => setData((p: any) => ({ ...p, reubicacion_estado: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="Estado..."
                />
              </div>
            )}
          </div>
        )}
      </div>
    </FormWrapper>
  )
}
