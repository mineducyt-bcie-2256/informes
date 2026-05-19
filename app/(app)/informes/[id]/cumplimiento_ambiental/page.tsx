'use client'

import { useState, useEffect, useRef } from 'react'
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

  // Estados para expandir/contraer secciones
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [savedSections, setSavedSections] = useState<Set<string>>(new Set())

  const [data, setData] = useState<any>({
    descripcion_condicion: '',
    // Tala
    tala_se_realizara: null,
    tala_tiene_permiso: null,
    tala_tipo_permiso: '',
    tala_numero_documento: '',
    tala_fecha_emision: '',
    tala_fecha_caducidad: '',
    tala_tiene_plan_compensacion: null,
    tala_alerta_critica: false,
    tala_cantidad_arboles: null,
    tala_mecanismo_compensacion: '',
    tala_especies_compensacion: null,
    tala_sitios_compensacion: '',
    // Tabla de impacto (8 condiciones)
    tala_impacto: [
      { id: 1, condicion: 'Afectación o reducción de recurso agua o impacto al consumo de agua', afectacion: null, analisis: '' },
      { id: 2, condicion: 'Impacto en la impermeabilización del suelo / Área de cobertura / Uso actual de suelo / Pendiente del terreno', afectacion: null, analisis: '' },
      { id: 3, condicion: 'El diseño mantiene condiciones naturales de la cobertura de árboles en el CE', afectacion: null, analisis: '' },
      { id: 4, condicion: 'Diseño con medidas de prevención', afectacion: null, analisis: '' },
      { id: 5, condicion: 'Afectación a la cobertura vegetal (identificación de especies tabla 1)', afectacion: null, analisis: '' },
      { id: 6, condicion: 'Alteración al habitat naturales de vida silvestre, alteración al paisaje, corredores biológicos', afectacion: null, analisis: '' },
      { id: 7, condicion: 'Estado fitosanitario / Evidencia de plagas, enfermedades, o estado general de las especies', afectacion: null, analisis: '' },
      { id: 8, condicion: 'Función ambiental y social', afectacion: null, analisis: '' },
    ],
    // Asbesto
    asbesto_presencia_msac: null,
    asbesto_tiene_plan: null,
    asbesto_alerta_critica: false,
    asbesto_metros_cuadrados: null,
    asbesto_tratamiento: '', // 'confinamiento' o 'disposicion'
    asbesto_sitio_confinamiento: '',
    asbesto_nombre_empresa: '',
    asbesto_tiene_permiso: null,
    asbesto_documentos_permiso: '',
    asbesto_procedimiento: '',
    asbesto_etapas: [
      { id: 1, nombre: 'Preparación de condiciones', avance: '', cumplimiento: '' },
      { id: 2, nombre: 'Desmontaje de láminas de AC', avance: '', cumplimiento: '' },
      { id: 3, nombre: 'Embalado de láminas', avance: '', cumplimiento: '' },
    ],
    asbesto_resumen_impactos: '',
    // Biodiversidad
    biodiversidad_tiene_danos: null,
    biodiversidad_descripcion: '',
    // Reubicación
    reubicacion_involuntaria: null,
    reubicacion_tiene_pri: null,
    reubicacion_alerta_critica: false,
    // Documentos PRI (checklist)
    reubicacion_doc_censo: false,
    reubicacion_doc_informe_visita: false,
    reubicacion_doc_condicion_social: false,
    reubicacion_doc_autorizacion: false,
    reubicacion_doc_sitio: false,
    reubicacion_doc_valuo: false,
    reubicacion_doc_inventario: false,
    reubicacion_doc_entrega: false,
    reubicacion_doc_partes: false,
    reubicacion_documentos_alerta: false,
    // Etapas
    reubicacion_etapas: [
      { id: 1, condicion: 'Desmontaje de sitio', estado: '', descripcion: '' },
      { id: 2, condicion: 'Adecuaciones (construcción)', estado: '', descripcion: '' },
      { id: 3, condicion: 'Traslado', estado: '', descripcion: '' },
      { id: 4, condicion: 'Monitoreo', estado: '', descripcion: '' },
    ],
    // Resumen
    reubicacion_resumen_impactos: '',
    sin_cambios_justificacion: '',
  })

  const preloadSnapshot = useRef<string | null>(null)
  const isPreloaded = useRef(false)

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
        setData((prev: any) => ({
          ...prev,
          ...existingData,
          reubicacion_resumen_impactos: existingData.reubicacion_resumen_impactos ?? '',
          asbesto_resumen_impactos: existingData.asbesto_resumen_impactos ?? '',
          reubicacion_etapas: existingData.reubicacion_etapas ?? prev.reubicacion_etapas,
          tala_impacto: existingData.tala_impacto ?? prev.tala_impacto,
        }))
      }
    } catch (error) {
      console.warn('Error loading cumplimiento ambiental data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(justificacion?: string) {
    try {
      const { data: existingData } = await supabase
        .from('informe_cumplimiento_ambiental')
        .select('id')
        .eq('informe_id', informeId)
        .single()

      // Limpiar valores vacíos y convertir a null
      const cleanData = { ...data, sin_cambios_justificacion: justificacion ?? data.sin_cambios_justificacion ?? '' }
      if (cleanData.tala_fecha_emision === '') cleanData.tala_fecha_emision = null
      if (cleanData.tala_fecha_caducidad === '') cleanData.tala_fecha_caducidad = null
      if (cleanData.tala_numero_documento === '') cleanData.tala_numero_documento = null
      if (cleanData.tala_mecanismo_compensacion === '') cleanData.tala_mecanismo_compensacion = null
      if (cleanData.tala_sitios_compensacion === '') cleanData.tala_sitios_compensacion = null

      // Eliminar campos que no existen como columnas en la tabla
      const { reubicacion_documentos_alerta, ...cleanDataSinEtapas } = cleanData
      const payload = { informe_id: informeId, ...cleanDataSinEtapas }

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
      if (justificacion) setData((prev: any) => ({ ...prev, sin_cambios_justificacion: justificacion }))
    } catch (error: any) {
      console.error('Error saving cumplimiento ambiental:', error)
      throw error
    }
  }

  function isModified() {
    if (!isPreloaded.current || preloadSnapshot.current === null) return true
    const { sin_cambios_justificacion: _j, fotos: _f, ...rest } = data
    return JSON.stringify(rest) !== preloadSnapshot.current
  }

  async function handlePreload() {
    // Obtener escuela del informe actual
    const { data: informe } = await supabase
      .from('informes').select('escuela_id, mes, anio').eq('id', informeId).single()
    if (!informe) throw new Error('No se encontró el informe')

    // Buscar informe del mes anterior
    let prevMes = informe.mes - 1
    let prevAnio = informe.anio
    if (prevMes < 1) { prevMes = 12; prevAnio-- }

    const { data: prevInforme } = await supabase
      .from('informes').select('id')
      .eq('escuela_id', informe.escuela_id)
      .eq('mes', prevMes).eq('anio', prevAnio).single()

    if (!prevInforme) throw new Error('No hay informe del mes anterior')

    const { data: prevData } = await supabase
      .from('informe_cumplimiento_ambiental').select('*')
      .eq('informe_id', prevInforme.id).single()

    if (!prevData) throw new Error('No hay datos de Cumplimiento Ambiental en el mes anterior')

    const { id: _id, informe_id: _inf, sin_cambios_justificacion: _j, ...campos } = prevData
    setData((prev: any) => ({ ...prev, ...campos, sin_cambios_justificacion: '' }))

    const { sin_cambios_justificacion: __j, fotos: _f, ...snap } = { ...campos }
    preloadSnapshot.current = JSON.stringify(snap)
    isPreloaded.current = true
  }

  // Funciones para compactar/expandir secciones
  const saveSection = (sectionName: string) => {
    setSavedSections(prev => new Set([...prev, sectionName]))
    setExpandedSection(null)
  }

  const editSection = (sectionName: string) => {
    setExpandedSection(sectionName)
    setSavedSections(prev => {
      const newSet = new Set(prev)
      newSet.delete(sectionName)
      return newSet
    })
  }

  const SectionHeader = ({ section, title }: { section: string; title: string }) => (
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-bold text-slate-800">{title}</h2>
      {savedSections.has(section) && (
        <button
          onClick={() => editSection(section)}
          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
        >
          ✎ Editar
        </button>
      )}
    </div>
  )

  const SectionFooter = ({ section }: { section: string }) => (
    expandedSection === section && (
      <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
        <button
          onClick={() => saveSection(section)}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 font-semibold"
        >
          💾 Guardar Sección
        </button>
      </div>
    )
  )

  if (loading) return <div className="p-4">Cargando...</div>

  return (
    <FormWrapper
      title="Condición 9 - Cumplimiento Ambiental"
      short="CUMPL.AMB"
      informeId={informeId}
      onSave={handleSave}
      onPreload={handlePreload}
      isModified={isModified}
    >
      <EscuelaInfoHeader informeId={informeId} />

      {data.sin_cambios_justificacion && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
          <p className="text-sm font-semibold text-amber-800 mb-1">Justificación (sin cambios respecto al mes anterior):</p>
          <p className="text-sm text-amber-900">{data.sin_cambios_justificacion}</p>
        </div>
      )}
      <DescripcionCondicion
        informeId={informeId}
        tabla="informe_cumplimiento_ambiental"
        value={data.descripcion_condicion}
        onChange={val => setData((p: any) => ({ ...p, descripcion_condicion: val }))}
      />

      {/* SECCIÓN 1: TALA DE ÁRBOLES */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="mb-6 border-b pb-4">
          <SectionHeader section="tala" title="1. Tala de Árboles" />
        </div>

        {/* Vista compactada */}
        {savedSections.has('tala') && (
          <div className="p-4 bg-slate-50 rounded">
            <p className="text-sm text-slate-600"><strong>Tala:</strong> {data.tala_se_realizara === true ? '✓ Se realizará' : data.tala_se_realizara === false ? '✗ No se realizará' : '— No especificado'}</p>
            {data.tala_cantidad_arboles && <p className="text-sm text-slate-600"><strong>Árboles a talar:</strong> {data.tala_cantidad_arboles}</p>}
          </div>
        )}

        {/* Contenido expandible */}
        {(!savedSections.has('tala') || expandedSection === 'tala') && (
          <>
        {/* Paso 1: ¿Se realizará tala? */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-3">
          <p className="font-semibold text-slate-700">¿Se realizará tala de árboles?</p>
          <div className="space-y-2">
            <label className="flex items-center gap-3">
              <input
                type="radio"
                name="tala_se_realizara"
                checked={data.tala_se_realizara === true}
                onChange={() => setData((p: any) => ({ ...p, tala_se_realizara: true, tala_tiene_permiso: null, tala_tipo_permiso: '', tala_numero_documento: '', tala_fecha_emision: '', tala_fecha_caducidad: '', tala_tiene_plan_compensacion: null, tala_alerta_critica: false, tala_cantidad_arboles: null, tala_mecanismo_compensacion: '', tala_especies_compensacion: null, tala_sitios_compensacion: '' }))}
                className="w-4 h-4"
              />
              <span className="text-slate-700">Sí, se realizará tala de árboles</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="radio"
                name="tala_se_realizara"
                checked={data.tala_se_realizara === false}
                onChange={() => setData((p: any) => ({ ...p, tala_se_realizara: false, tala_tiene_permiso: null, tala_tipo_permiso: '', tala_numero_documento: '', tala_fecha_emision: '', tala_fecha_caducidad: '', tala_tiene_plan_compensacion: null, tala_alerta_critica: false, tala_cantidad_arboles: null, tala_mecanismo_compensacion: '', tala_especies_compensacion: null, tala_sitios_compensacion: '' }))}
                className="w-4 h-4"
              />
              <span className="text-slate-700">No se realizará tala de árboles</span>
            </label>
          </div>
        </div>

        {data.tala_se_realizara === false && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-300">
            <p className="text-green-700 font-semibold">✓ En este centro educativo no se realizará tala de árboles</p>
          </div>
        )}

        {data.tala_se_realizara === true && (
          <>
            {/* Paso 2: ¿Se tiene permiso? */}
            <div className="mb-6 p-4 bg-amber-50 rounded-lg border-l-4 border-amber-500 space-y-4">
              <div>
                <p className="font-bold text-slate-800 mb-3">¿Se tiene permiso para tala?</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="tala_tiene_permiso"
                      checked={data.tala_tiene_permiso === true}
                      onChange={() => setData((p: any) => ({ ...p, tala_tiene_permiso: true, tala_alerta_critica: false }))}
                      className="w-4 h-4"
                    />
                    <span className="text-slate-700">Sí, tiene permiso</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="tala_tiene_permiso"
                      checked={data.tala_tiene_permiso === false}
                      onChange={() => setData((p: any) => ({ ...p, tala_tiene_permiso: false }))}
                      className="w-4 h-4"
                    />
                    <span className="text-slate-700">No tiene permiso</span>
                  </label>
                </div>
              </div>

              {/* Si tiene permiso */}
              {data.tala_tiene_permiso === true && (
                <div className="space-y-4 p-4 bg-white rounded border border-amber-200">
                  <div>
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
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Número de documento:</label>
                    <input
                      type="text"
                      value={data.tala_numero_documento}
                      onChange={e => setData((p: any) => ({ ...p, tala_numero_documento: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      placeholder="Ej: RES-2024-001"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Fecha de emisión:</label>
                      <input
                        type="date"
                        value={data.tala_fecha_emision}
                        onChange={e => setData((p: any) => ({ ...p, tala_fecha_emision: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Fecha de caducidad:</label>
                      <input
                        type="date"
                        value={data.tala_fecha_caducidad}
                        onChange={e => setData((p: any) => ({ ...p, tala_fecha_caducidad: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Si NO tiene permiso */}
              {data.tala_tiene_permiso === false && (
                <div className="p-4 bg-red-50 rounded-lg border border-red-300 space-y-4">
                  <div className="p-3 bg-red-100 border border-red-400 rounded flex gap-3">
                    <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                    <div className="text-sm text-red-700">
                      <p className="font-bold">⚠️ PROCEDIMIENTO REQUERIDO</p>
                      <p>Debe tramitar permisos para tala ante la DOT.</p>
                    </div>
                  </div>

                  <div>
                    <p className="font-bold text-slate-800 mb-3">¿Tiene plan de compensación interna?</p>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="tala_tiene_plan_compensacion"
                          checked={data.tala_tiene_plan_compensacion === true}
                          onChange={() => setData((p: any) => ({ ...p, tala_tiene_plan_compensacion: true, tala_alerta_critica: false }))}
                          className="w-4 h-4"
                        />
                        <span className="text-slate-700">Sí, tiene plan</span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="tala_tiene_plan_compensacion"
                          checked={data.tala_tiene_plan_compensacion === false}
                          onChange={() => setData((p: any) => ({ ...p, tala_tiene_plan_compensacion: false, tala_alerta_critica: true }))}
                          className="w-4 h-4"
                        />
                        <span className="text-slate-700">No tiene plan</span>
                      </label>
                    </div>

                    {data.tala_alerta_critica && (
                      <div className="mt-3 p-3 bg-red-100 border border-red-400 rounded flex gap-3">
                        <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                        <div className="text-sm text-red-700">
                          <p className="font-bold">🚨 SITUACIÓN CRÍTICA</p>
                          <p>Debe presentar un plan de compensación de forma inmediata.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Paso 3: Compensación */}
            {(data.tala_tiene_permiso === true || data.tala_tiene_plan_compensacion === true) && (
              <div className="mb-6 p-4 bg-green-50 rounded-lg border-l-4 border-green-500 space-y-4">
                <h3 className="font-bold text-slate-800">Compensación de tala de árboles</h3>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Cantidad de árboles a talar:</label>
                  <input
                    type="number"
                    value={data.tala_cantidad_arboles || ''}
                    onChange={e => setData((p: any) => ({ ...p, tala_cantidad_arboles: e.target.value ? parseInt(e.target.value) : null }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Mecanismo de compensación:</label>
                  <textarea
                    value={data.tala_mecanismo_compensacion}
                    onChange={e => setData((p: any) => ({ ...p, tala_mecanismo_compensacion: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    rows={3}
                    placeholder="¿Cómo será la compensación por la tala de árboles?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Cuántas especies será la compensación:</label>
                  <input
                    type="number"
                    value={data.tala_especies_compensacion || ''}
                    onChange={e => setData((p: any) => ({ ...p, tala_especies_compensacion: e.target.value ? parseInt(e.target.value) : null }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Sitios de compensación:</label>
                  <textarea
                    value={data.tala_sitios_compensacion}
                    onChange={e => setData((p: any) => ({ ...p, tala_sitios_compensacion: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    rows={3}
                    placeholder="Describa los sitios donde se realizará la compensación"
                  />
                </div>
              </div>
            )}

            {/* Paso 4: Tabla de identificación del impacto */}
            {data.tala_cantidad_arboles && data.tala_cantidad_arboles > 0 && (
              <div className="mb-6 p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                <h3 className="font-bold text-slate-800 mb-4">Identificación del impacto - Condiciones a evaluar</h3>
                <p className="text-sm text-slate-600 mb-4">Evalúe cada condición según el impacto de la tala de árboles</p>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-purple-200">
                        <th className="border border-purple-300 px-2 py-2 text-center font-semibold w-8">No</th>
                        <th className="border border-purple-300 px-2 py-2 text-left font-semibold w-40">Condiciones</th>
                        <th className="border border-purple-300 px-2 py-2 text-center font-semibold w-20">Afectación</th>
                        <th className="border border-purple-300 px-3 py-2 text-left font-semibold flex-1">Análisis</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.tala_impacto?.map((row: any, idx: number) => (
                        <tr key={row.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-purple-50'}>
                          <td className="border border-purple-300 px-2 py-2 text-center font-semibold text-xs">{row.id}</td>
                          <td className="border border-purple-300 px-2 py-2 text-xs">{row.condicion}</td>
                          <td className="border border-purple-300 px-2 py-2">
                            <div className="flex justify-center gap-2">
                              <label className="flex items-center gap-1">
                                <input
                                  type="radio"
                                  checked={row.afectacion === true}
                                  onChange={() => setData((p: any) => ({
                                    ...p,
                                    tala_impacto: p.tala_impacto.map((r: any) => r.id === row.id ? { ...r, afectacion: true } : r)
                                  }))}
                                  className="w-4 h-4"
                                />
                                <span className="text-xs">Sí</span>
                              </label>
                              <label className="flex items-center gap-1">
                                <input
                                  type="radio"
                                  checked={row.afectacion === false}
                                  onChange={() => setData((p: any) => ({
                                    ...p,
                                    tala_impacto: p.tala_impacto.map((r: any) => r.id === row.id ? { ...r, afectacion: false } : r)
                                  }))}
                                  className="w-4 h-4"
                                />
                                <span className="text-xs">No</span>
                              </label>
                            </div>
                          </td>
                          <td className="border border-purple-300 px-3 py-2">
                            <textarea
                              value={row.analisis}
                              onChange={e => setData((p: any) => ({
                                ...p,
                                tala_impacto: p.tala_impacto.map((r: any) => r.id === row.id ? { ...r, analisis: e.target.value } : r)
                              }))}
                              className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                              rows={3}
                              placeholder="Escriba su análisis"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            <SectionFooter section="tala" />
          </>
        )}
          </>
        )}
      </div>

      {/* SECCIÓN 2: ASBESTO CEMENTO */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="mb-6 border-b pb-4">
          <SectionHeader section="asbesto" title="2. Asbesto Cemento" />
        </div>

        {/* Vista compactada */}
        {savedSections.has('asbesto') && (
          <div className="p-4 bg-slate-50 rounded">
            <p className="text-sm text-slate-600"><strong>Asbesto:</strong> {data.asbesto_presencia_msac === true ? '✓ Hay MSAC' : data.asbesto_presencia_msac === false ? '✗ Sin MSAC' : '— No especificado'}</p>
            {data.asbesto_metros_cuadrados && <p className="text-sm text-slate-600"><strong>Metros cuadrados:</strong> {data.asbesto_metros_cuadrados} m²</p>}
          </div>
        )}

        {/* Contenido expandible */}
        {(!savedSections.has('asbesto') || expandedSection === 'asbesto') && (
          <>
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <label className="flex items-center gap-3 font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={data.asbesto_presencia_msac === true}
              onChange={e => setData((p: any) => ({ ...p, asbesto_presencia_msac: e.target.checked ? true : null, asbesto_tiene_plan: null, asbesto_alerta_critica: false, asbesto_metros_cuadrados: null, asbesto_tratamiento: '', asbesto_sitio_confinamiento: '', asbesto_nombre_empresa: '', asbesto_tiene_permiso: null, asbesto_documentos_permiso: '', asbesto_procedimiento: '' }))}
              className="w-5 h-5"
            />
            ¿Hay presencia de material sospechoso de Asbesto Cemento (MSAC)?
          </label>
        </div>

        {data.asbesto_presencia_msac === true && (
          <div className="p-4 bg-amber-50 rounded-lg border-l-4 border-amber-500 space-y-4">
            <div>
              <h3 className="font-bold text-slate-800 mb-3">Plan de Manejo de MSAC</h3>
              <div className="flex gap-4">
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
                <div className="p-3 bg-red-100 border border-red-400 rounded flex gap-3 mt-3">
                  <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                  <div className="text-sm text-red-700">
                    <p className="font-bold">⚠️ ALERTA INMEDIATA</p>
                    <p>Presentar plan de manejo de MSAC de forma inmediata.</p>
                  </div>
                </div>
              )}
            </div>

            {data.asbesto_tiene_plan === true && (
              <>
                {/* Cantidad de m² */}
                <div>
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

                {/* Tratamiento para disposición final */}
                <div className="p-4 bg-white rounded border border-amber-200 space-y-4">
                  <div>
                    <p className="font-bold text-slate-800 mb-3">Tratamiento para la disposición final según plan de acción:</p>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="asbesto_tratamiento"
                          checked={data.asbesto_tratamiento === 'confinamiento'}
                          onChange={() => setData((p: any) => ({ ...p, asbesto_tratamiento: 'confinamiento', asbesto_sitio_confinamiento: '', asbesto_nombre_empresa: '', asbesto_tiene_permiso: null, asbesto_documentos_permiso: '', asbesto_procedimiento: '' }))}
                          className="w-4 h-4"
                        />
                        <span className="text-slate-700">a) Confinamiento interno</span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="asbesto_tratamiento"
                          checked={data.asbesto_tratamiento === 'disposicion'}
                          onChange={() => setData((p: any) => ({ ...p, asbesto_tratamiento: 'disposicion', asbesto_sitio_confinamiento: '', asbesto_nombre_empresa: '', asbesto_tiene_permiso: null, asbesto_documentos_permiso: '', asbesto_procedimiento: '' }))}
                          className="w-4 h-4"
                        />
                        <span className="text-slate-700">b) Disposición final en sitio autorizado</span>
                      </label>
                    </div>
                  </div>

                  {/* Si selecciona CONFINAMIENTO */}
                  {data.asbesto_tratamiento === 'confinamiento' && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Sitio donde se realizará el confinamiento:</label>
                      <textarea
                        value={data.asbesto_sitio_confinamiento}
                        onChange={e => setData((p: any) => ({ ...p, asbesto_sitio_confinamiento: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        rows={3}
                        placeholder="Describa el sitio de confinamiento"
                      />
                    </div>
                  )}

                  {/* Si selecciona DISPOSICIÓN */}
                  {data.asbesto_tratamiento === 'disposicion' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Nombre de la empresa que dará el tratamiento:</label>
                        <input
                          type="text"
                          value={data.asbesto_nombre_empresa}
                          onChange={e => setData((p: any) => ({ ...p, asbesto_nombre_empresa: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                          placeholder="Nombre de la empresa"
                        />
                      </div>

                      <div>
                        <p className="font-semibold text-slate-700 mb-2">¿Cuenta con permiso de institución competente?</p>
                        <div className="space-y-2">
                          <label className="flex items-center gap-3">
                            <input
                              type="radio"
                              checked={data.asbesto_tiene_permiso === true}
                              onChange={() => setData((p: any) => ({ ...p, asbesto_tiene_permiso: true, asbesto_procedimiento: '' }))}
                              className="w-4 h-4"
                            />
                            <span className="text-slate-700">Sí</span>
                          </label>
                          <label className="flex items-center gap-3">
                            <input
                              type="radio"
                              checked={data.asbesto_tiene_permiso === false}
                              onChange={() => setData((p: any) => ({ ...p, asbesto_tiene_permiso: false, asbesto_documentos_permiso: '' }))}
                              className="w-4 h-4"
                            />
                            <span className="text-slate-700">No</span>
                          </label>
                        </div>

                        {data.asbesto_tiene_permiso === true && (
                          <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Documentos que respaldan el permiso:</label>
                            <textarea
                              value={data.asbesto_documentos_permiso}
                              onChange={e => setData((p: any) => ({ ...p, asbesto_documentos_permiso: e.target.value }))}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                              rows={3}
                              placeholder="Describa los respaldos o evidencias"
                            />
                            <p className="text-xs text-blue-600 mt-2">ℹ️ La supervision verifica los respaldos y evidencias y garantiza su legitimidad.</p>
                          </div>
                        )}

                        {data.asbesto_tiene_permiso === false && (
                          <div className="mt-3 p-3 bg-orange-50 rounded border border-orange-200">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Procedimiento a seguir y respaldos a presentar:</label>
                            <textarea
                              value={data.asbesto_procedimiento}
                              onChange={e => setData((p: any) => ({ ...p, asbesto_procedimiento: e.target.value }))}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                              rows={3}
                              placeholder="Describa el procedimiento a seguir y los respaldos a presentar"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Tabla de ETAPAS (se activa en cualquier caso) */}
                {data.asbesto_tratamiento && (() => {
                  const etapasBase = [
                    { id: 1, nombre: 'Preparación de condiciones' },
                    { id: 2, nombre: 'Desmontaje de láminas de AC' },
                    { id: 3, nombre: 'Embalado de láminas' },
                  ].concat(
                    data.asbesto_tratamiento === 'confinamiento'
                      ? [
                          { id: 4, nombre: 'Preparación de sitio de confinamiento' },
                          { id: 5, nombre: 'Confinamiento y cierre' },
                        ]
                      : [
                          { id: 4, nombre: 'Gestiones para disposición final' },
                          { id: 5, nombre: 'Traslado de MSAC' },
                          { id: 6, nombre: 'Disposición final' },
                        ]
                  )
                  // Sincronizar etapas si cambia el tratamiento
                  const etapasGuardadas: any[] = data.asbesto_etapas ?? []
                  const etapas = etapasBase.map((e: any) => {
                    const guardada = etapasGuardadas.find((g: any) => g.id === e.id)
                    return guardada ?? { ...e, avance: '', cumplimiento: '' }
                  })

                  const updateEtapa = (id: number, field: string, value: string) => {
                    const nuevas = etapas.map((e: any) => e.id === id ? { ...e, [field]: value } : e)
                    setData((p: any) => ({ ...p, asbesto_etapas: nuevas }))
                  }

                  return (
                    <div className="p-4 bg-green-50 rounded border border-green-300 space-y-4">
                      <h4 className="font-bold text-slate-800">Seguimiento de Etapas</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-xs">
                          <thead>
                            <tr className="bg-green-200">
                              <th className="border border-green-300 px-2 py-2 text-left font-semibold w-40">Etapa</th>
                              <th className="border border-green-300 px-2 py-2 text-left font-semibold w-20">Avance</th>
                              <th className="border border-green-300 px-2 py-2 text-left font-semibold">Pasos o Cumplimiento</th>
                            </tr>
                          </thead>
                          <tbody>
                            {etapas.map((etapa: any, idx: number) => (
                              <tr key={etapa.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-green-50'}>
                                <td className="border border-green-300 px-2 py-2 font-semibold">{etapa.nombre}</td>
                                <td className="border border-green-300 px-2 py-2">
                                  <input
                                    type="text"
                                    value={etapa.avance}
                                    onChange={e => updateEtapa(etapa.id, 'avance', e.target.value)}
                                    placeholder="0%"
                                    className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                                  />
                                </td>
                                <td className="border border-green-300 px-2 py-2">
                                  <textarea
                                    value={etapa.cumplimiento}
                                    onChange={e => updateEtapa(etapa.id, 'cumplimiento', e.target.value)}
                                    placeholder="Descripción"
                                    className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                                    rows={2}
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                })()}

                {/* Resumen de impactos */}
                {data.asbesto_tratamiento && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Resumen de impactos generados de esta actividad:</label>
                    <textarea
                      value={data.asbesto_resumen_impactos}
                      onChange={e => setData((p: any) => ({ ...p, asbesto_resumen_impactos: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      rows={4}
                      placeholder="Describa impactos, hallazgos, áreas de mejora, otros"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}
        <SectionFooter section="asbesto" />
          </>
        )}
      </div>

      {/* SECCIÓN 3: BIODIVERSIDAD */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="mb-6 border-b pb-4">
          <SectionHeader section="biodiversidad" title="3. Daños a la Biodiversidad" />
        </div>

        {/* Vista compactada */}
        {savedSections.has('biodiversidad') && (
          <div className="p-4 bg-slate-50 rounded">
            <p className="text-sm text-slate-600"><strong>Biodiversidad:</strong> {data.biodiversidad_tiene_danos === true ? '✓ Hay daños' : data.biodiversidad_tiene_danos === false ? '✗ Sin daños' : '— No especificado'}</p>
          </div>
        )}

        {/* Contenido expandible */}
        {(!savedSections.has('biodiversidad') || expandedSection === 'biodiversidad') && (
          <>
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-3">
          <p className="font-semibold text-slate-700">¿Hay daños a la biodiversidad y ecosistemas?</p>
          <div className="space-y-2">
            <label className="flex items-center gap-3">
              <input
                type="radio"
                name="biodiversidad_tiene_danos"
                checked={data.biodiversidad_tiene_danos === true}
                onChange={() => setData((p: any) => ({ ...p, biodiversidad_tiene_danos: true }))}
                className="w-4 h-4"
              />
              <span className="text-slate-700">Sí</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="radio"
                name="biodiversidad_tiene_danos"
                checked={data.biodiversidad_tiene_danos === false}
                onChange={() => setData((p: any) => ({ ...p, biodiversidad_tiene_danos: false, biodiversidad_descripcion: '' }))}
                className="w-4 h-4"
              />
              <span className="text-slate-700">No</span>
            </label>
          </div>
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

        {data.biodiversidad_tiene_danos === false && (
          <div className="p-4 bg-green-50 rounded-lg border border-green-300">
            <p className="text-green-700 font-semibold">✓ El proyecto no ha causado daños a la biodiversidad.</p>
          </div>
        )}
        <SectionFooter section="biodiversidad" />
          </>
        )}
      </div>

      {/* SECCIÓN 4: REUBICACIÓN INVOLUNTARIA */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="mb-6 border-b pb-4">
          <SectionHeader section="reubicacion" title="4. Reubicación Involuntaria" />
        </div>

        {/* Vista compactada */}
        {savedSections.has('reubicacion') && (
          <div className="p-4 bg-slate-50 rounded">
            <p className="text-sm text-slate-600"><strong>Reubicación:</strong> {data.reubicacion_involuntaria === true ? '✓ Hay reubicación' : data.reubicacion_involuntaria === false ? '✗ Sin reubicación' : '— No especificado'}</p>
          </div>
        )}

        {/* Contenido expandible */}
        {(!savedSections.has('reubicacion') || expandedSection === 'reubicacion') && (
          <>


        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-3">
          <p className="font-semibold text-slate-700">¿Hay reubicación involuntaria?</p>
          <div className="space-y-2">
            <label className="flex items-center gap-3">
              <input
                type="radio"
                name="reubicacion_involuntaria"
                checked={data.reubicacion_involuntaria === true}
                onChange={() => setData((p: any) => ({ ...p, reubicacion_involuntaria: true, reubicacion_tiene_pri: null, reubicacion_alerta_critica: false }))}
                className="w-4 h-4"
              />
              <span className="text-slate-700">Sí, hay reubicación involuntaria</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="radio"
                name="reubicacion_involuntaria"
                checked={data.reubicacion_involuntaria === false}
                onChange={() => setData((p: any) => ({ ...p, reubicacion_involuntaria: false, reubicacion_tiene_pri: null, reubicacion_alerta_critica: false }))}
                className="w-4 h-4"
              />
              <span className="text-slate-700">No hay reubicación involuntaria</span>
            </label>
          </div>
        </div>

        {data.reubicacion_involuntaria === false && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-300">
            <p className="text-green-700 font-semibold">✓ Este centro educativo no tiene reubicación involuntaria, no aplica gestión</p>
          </div>
        )}

        {data.reubicacion_involuntaria === true && (
          <>
            {/* ¿Tiene PRI? */}
            <div className="mb-6 p-4 bg-amber-50 rounded-lg border-l-4 border-amber-500 space-y-4">
              <div>
                <p className="font-bold text-slate-800 mb-3">¿Tiene Plan de Reubicación Involuntaria (PRI)?</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="reubicacion_tiene_pri"
                      checked={data.reubicacion_tiene_pri === true}
                      onChange={() => setData((p: any) => ({ ...p, reubicacion_tiene_pri: true, reubicacion_alerta_critica: false, reubicacion_documentos_alerta: false }))}
                      className="w-4 h-4"
                    />
                    <span className="text-slate-700">Sí, tiene PRI</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="reubicacion_tiene_pri"
                      checked={data.reubicacion_tiene_pri === false}
                      onChange={() => setData((p: any) => ({ ...p, reubicacion_tiene_pri: false, reubicacion_alerta_critica: true }))}
                      className="w-4 h-4"
                    />
                    <span className="text-slate-700">No tiene PRI</span>
                  </label>
                </div>
              </div>

              {data.reubicacion_alerta_critica && (
                <div className="p-3 bg-red-100 border border-red-400 rounded flex gap-3">
                  <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                  <div className="text-sm text-red-700">
                    <p className="font-bold">⚠️ ELABORACIÓN INMEDIATA</p>
                    <p>Elaborar un Plan de Reubicación Involuntaria de forma inmediata.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Checklist de documentos (si tiene PRI) */}
            {data.reubicacion_tiene_pri === true && (
              <div className="mb-6 p-4 bg-indigo-50 rounded-lg border-l-4 border-indigo-500 space-y-4">
                <h3 className="font-bold text-slate-800">El PRI cuenta con los siguientes documentos:</h3>

                <div className="space-y-2">
                  {[
                    { key: 'reubicacion_doc_censo', label: 'Censo socioeconómico de reasentamiento' },
                    { key: 'reubicacion_doc_informe_visita', label: 'Informe de visita (empresa)' },
                    { key: 'reubicacion_doc_condicion_social', label: 'Resumen de condición social de persona que aplica al reasentamiento' },
                    { key: 'reubicacion_doc_autorizacion', label: 'Constancia de autorización y consentimiento de reasentamiento' },
                    { key: 'reubicacion_doc_sitio', label: 'Constancia de sitio de reasentamiento' },
                    { key: 'reubicacion_doc_valuo', label: 'Valuó de vivienda actual' },
                    { key: 'reubicacion_doc_inventario', label: 'Inventario de activos' },
                    { key: 'reubicacion_doc_entrega', label: 'Acta de entrega de compensación' },
                    { key: 'reubicacion_doc_partes', label: 'Informe de partes interesadas (reubicación involuntaria)' },
                  ].map((doc: any) => (
                    <label key={doc.key} className="flex items-center gap-3 p-2 hover:bg-indigo-100 rounded">
                      <input
                        type="checkbox"
                        checked={data[doc.key]}
                        onChange={e => setData((p: any) => ({ ...p, [doc.key]: e.target.checked }))}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-slate-700">{doc.label}</span>
                    </label>
                  ))}
                </div>

                {!([
                  data.reubicacion_doc_censo,
                  data.reubicacion_doc_informe_visita,
                  data.reubicacion_doc_condicion_social,
                  data.reubicacion_doc_autorizacion,
                  data.reubicacion_doc_sitio,
                  data.reubicacion_doc_valuo,
                  data.reubicacion_doc_inventario,
                  data.reubicacion_doc_entrega,
                  data.reubicacion_doc_partes,
                ].every(d => d === true)) && (
                  <div className="p-3 bg-red-100 border border-red-400 rounded flex gap-3">
                    <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                    <div className="text-sm text-red-700">
                      <p className="font-bold">⚠️ DOCUMENTOS INCOMPLETOS</p>
                      <p>Es necesario completar estos respaldos para continuar.</p>
                    </div>
                  </div>
                )}

                {/* Tabla de Etapas del PRI */}
                <div className="mt-6 p-4 bg-white rounded border border-indigo-300 space-y-4">
                  <h4 className="font-bold text-slate-800">Etapas del Plan de Reubicación Involuntaria</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="bg-indigo-200">
                          <th className="border border-indigo-300 px-2 py-2 text-left font-semibold w-32">Condición</th>
                          <th className="border border-indigo-300 px-2 py-2 text-left font-semibold w-28">Estado</th>
                          <th className="border border-indigo-300 px-2 py-2 text-left font-semibold">Descripción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { id: 1, condicion: 'Desmontaje de sitio' },
                          { id: 2, condicion: 'Adecuaciones (construcción)' },
                          { id: 3, condicion: 'Traslado' },
                          { id: 4, condicion: 'Monitoreo' },
                        ].map((etapa: any, idx: number) => (
                          <tr key={etapa.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-indigo-50'}>
                            <td className="border border-indigo-300 px-2 py-2 font-semibold">{etapa.condicion}</td>
                            <td className="border border-indigo-300 px-2 py-2">
                              <select
                                className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                                onChange={e => setData((p: any) => ({
                                  ...p,
                                  reubicacion_etapas: p.reubicacion_etapas.map((r: any) => r.id === etapa.id ? { ...r, estado: e.target.value } : r)
                                }))}
                              >
                                <option value="">Seleccione</option>
                                <option value="Sin iniciar">Sin iniciar</option>
                                <option value="Ejecutándose">Ejecutándose</option>
                                <option value="Finalizado">Finalizado</option>
                              </select>
                            </td>
                            <td className="border border-indigo-300 px-2 py-2">
                              <textarea
                                className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                                rows={2}
                                placeholder="Descripción"
                                onChange={e => setData((p: any) => ({
                                  ...p,
                                  reubicacion_etapas: p.reubicacion_etapas.map((r: any) => r.id === etapa.id ? { ...r, descripcion: e.target.value } : r)
                                }))}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Resumen de impactos */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Resumen de impactos generados de esta actividad:</label>
                  <textarea
                    value={data.reubicacion_resumen_impactos}
                    onChange={e => setData((p: any) => ({ ...p, reubicacion_resumen_impactos: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    rows={4}
                    placeholder="Describa impactos, hallazgos, áreas de mejora, otros"
                  />
                </div>
              </div>
            )}
          <SectionFooter section="reubicacion" />
          </>
        )}
          </>
        )}
      </div>
    </FormWrapper>
  )
}
