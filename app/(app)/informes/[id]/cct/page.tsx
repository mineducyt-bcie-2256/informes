'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import FormWrapper from '@/components/forms/FormWrapper'
import EscuelaInfoHeader from '@/components/forms/EscuelaInfoHeader'
import DescripcionCondicion from '@/components/forms/DescripcionCondicion'
import RegistroFotografico, { type Foto } from '@/components/forms/RegistroFotografico'
import CapacitacionesSection from '@/components/forms/CapacitacionesSection'

// ════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════
type VerificacionItem = {
  id: string
  nombre: string
  cumple: boolean | null
  observacion: string
}

type SeccionVerificacion = {
  titulo: string
  items: VerificacionItem[]
}

type DocumentoItem = {
  nombre: string
  cumple: boolean | null
  observacion: string
}

type Capacitacion = {
  id: string
  fecha: string
  tematica: string
  hombres: number
  mujeres: number
  total: number
}

type FormData = {
  descripcion_condicion: string
  secciones: SeccionVerificacion[]
  documentos: DocumentoItem[]
  comentarios_generales: string
  tiene_capacitaciones: string
  capacitaciones: Capacitacion[]
  fotos: Foto[]
}

// ════════════════════════════════════════════════════════════════
// DATOS INICIALES
// ════════════════════════════════════════════════════════════════
const DOCUMENTOS_BASE: DocumentoItem[] = [
  { nombre: 'Código de Conducta firmado', cumple: null, observacion: '' },
  { nombre: 'Registro de inducción', cumple: null, observacion: '' },
  { nombre: 'Lista de personal activo', cumple: null, observacion: '' },
  { nombre: 'Contratos o planillas', cumple: null, observacion: '' },
  { nombre: 'Registro de capacitaciones', cumple: null, observacion: '' },
  { nombre: 'Registro disciplinario', cumple: null, observacion: '' },
  { nombre: 'Mecanismo de quejas', cumple: null, observacion: '' },
]

const SECCIONES_VERIFICACION: SeccionVerificacion[] = [
  {
    titulo: '1. Código de Conducta del Personal',
    items: [
      { id: 'cc-aprobado', nombre: 'Existe Código de Conducta aprobado en obra', cumple: null, observacion: '' },
      { id: 'cc-aceptacion', nombre: 'Todo trabajador firmó aceptación del código', cumple: null, observacion: '' },
      { id: 'cc-nuevos', nombre: 'Nuevos ingresos firman al ingresar', cumple: null, observacion: '' },
      { id: 'cc-socializacion', nombre: 'El código fue socializado mediante charla', cumple: null, observacion: '' },
      { id: 'cc-copia', nombre: 'Copia visible en oficina/campamento', cumple: null, observacion: '' },
      { id: 'cc-sanciones', nombre: 'Se explican sanciones por incumplimiento', cumple: null, observacion: '' },
    ],
  },
  {
    titulo: '2. Conducta de los Trabajadores en Centro Escolar',
    items: [
      { id: 'cond-lenguaje', nombre: 'No uso de lenguaje vulgar u ofensivo', cumple: null, observacion: '' },
      { id: 'cond-acoso', nombre: 'No acoso verbal o físico', cumple: null, observacion: '' },
      { id: 'cond-fotos', nombre: 'No toman fotos a menores sin autorización', cumple: null, observacion: '' },
      { id: 'cond-acceso', nombre: 'No ingreso a áreas restringidas', cumple: null, observacion: '' },
      { id: 'cond-orden', nombre: 'Orden y disciplina en jornada laboral', cumple: null, observacion: '' },
      { id: 'cond-alcohol', nombre: 'No consumo de alcohol o drogas', cumple: null, observacion: '' },
      { id: 'cond-fumar', nombre: 'No fumar en el área de trabajo', cumple: null, observacion: '' },
    ],
  },
  {
    titulo: '3. Derechos en el Lugar de Trabajo',
    items: [
      { id: 'der-pago', nombre: 'Pago puntual a trabajadores', cumple: null, observacion: '' },
      { id: 'der-jornada', nombre: 'Jornada conforme ley laboral', cumple: null, observacion: '' },
      { id: 'der-descansos', nombre: 'Descansos establecidos', cumple: null, observacion: '' },
      { id: 'der-forzoso', nombre: 'No trabajo forzoso', cumple: null, observacion: '' },
      { id: 'der-infantil', nombre: 'No trabajo infantil', cumple: null, observacion: '' },
      { id: 'der-discriminacion', nombre: 'No discriminación por sexo, edad, religión, discapacidad, etc.', cumple: null, observacion: '' },
      { id: 'der-igualdad', nombre: 'Igualdad de trato entre personal', cumple: null, observacion: '' },
      { id: 'der-contratos', nombre: 'Contratos o acuerdos laborales claros', cumple: null, observacion: '' },
      { id: 'der-afiliacion', nombre: 'Afiliación legal cuando aplique', cumple: null, observacion: '' },
    ],
  },
  {
    titulo: '4. Prevención de Acoso y Violencia',
    items: [
      { id: 'prev-politica', nombre: 'Política de cero tolerancia al acoso', cumple: null, observacion: '' },
      { id: 'prev-canales', nombre: 'Personal conoce canales de denuncia', cumple: null, observacion: '' },
      { id: 'prev-denuncias', nombre: 'No existen denuncias activas sin atender', cumple: null, observacion: '' },
      { id: 'prev-mujeres', nombre: 'Respeto hacia mujeres trabajadoras', cumple: null, observacion: '' },
      { id: 'prev-jefes', nombre: 'No intimidación entre jefes y obreros', cumple: null, observacion: '' },
    ],
  },
  {
    titulo: '5. Seguridad y Salud Ocupacional',
    items: [
      { id: 'seg-epp', nombre: 'Uso de casco, botas, chaleco, EPP', cumple: null, observacion: '' },
      { id: 'seg-herramientas', nombre: 'Herramientas en buen estado', cumple: null, observacion: '' },
      { id: 'seg-senalizacion', nombre: 'Señalización de áreas peligrosas', cumple: null, observacion: '' },
      { id: 'seg-botiquin', nombre: 'Botiquín disponible', cumple: null, observacion: '' },
      { id: 'seg-acceso', nombre: 'Control de acceso a obra', cumple: null, observacion: '' },
    ],
  },
]

const INIT: FormData = {
  descripcion_condicion: '',
  secciones: SECCIONES_VERIFICACION,
  documentos: DOCUMENTOS_BASE,
  comentarios_generales: '',
  tiene_capacitaciones: '',
  capacitaciones: [],
  fotos: [],
}

// ════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════
export default function SeccionCCT() {
  const params = useParams()
  const informeId = params.id as string
  const supabase = createClient()

  const [data, setData] = useState<FormData>(INIT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Cargar datos
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: cctData } = await supabase
          .from('informe_cct')
          .select('*')
          .eq('informe_id', informeId)
          .single()

        if (cctData) {
          setData(prev => ({
            ...prev,
            descripcion_condicion: cctData.descripcion_condicion ?? '',
            secciones: cctData.secciones ?? prev.secciones,
            documentos: cctData.documentos ?? prev.documentos,
            comentarios_generales: cctData.comentarios_generales ?? '',
            tiene_capacitaciones: cctData.tiene_capacitaciones ?? '',
            capacitaciones: cctData.capacitaciones ?? prev.capacitaciones,
            fotos: cctData.fotos ?? prev.fotos,
          }))
        }
      } catch (err) {
        console.error('Error loading CCT data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [informeId, supabase])

  // Guardar datos
  const handleSave = async () => {
    setSaving(true)
    try {
      const { data: existing, error: checkError } = await supabase
        .from('informe_cct')
        .select('id')
        .eq('informe_id', informeId)
        .maybeSingle()

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError
      }

      const saveData = {
        descripcion_condicion: data.descripcion_condicion,
        secciones: data.secciones,
        documentos: data.documentos,
        comentarios_generales: data.comentarios_generales,
        tiene_capacitaciones: data.tiene_capacitaciones,
        capacitaciones: data.capacitaciones,
        fotos: data.fotos,
      }

      if (existing?.id) {
        const { error: updateError } = await supabase
          .from('informe_cct')
          .update(saveData)
          .eq('id', existing.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('informe_cct')
          .insert({
            informe_id: informeId,
            ...saveData,
          })

        if (insertError) throw insertError
      }
    } catch (err: any) {
      console.error('Error saving CCT data:', err)
      throw new Error(err?.message ?? 'Error al guardar los datos')
    } finally {
      setSaving(false)
    }
  }

  // Actualizar item de verificación
  const updateVerificacion = (seccionIdx: number, itemIdx: number, field: keyof VerificacionItem, value: any) => {
    setData(prev => {
      const newData = { ...prev }
      const item = newData.secciones[seccionIdx].items[itemIdx]
      ;(item as any)[field] = value
      return newData
    })
  }

  // Actualizar documento
  const updateDocumento = (idx: number, field: keyof DocumentoItem, value: any) => {
    setData(prev => ({
      ...prev,
      documentos: prev.documentos.map((d, i) => i === idx ? { ...d, [field]: value } : d),
    }))
  }


  if (loading) return <div className="p-4">Cargando...</div>

  return (
    <FormWrapper title="Condición 8 - Código de Conducta de Trabajadores" short="CCT" informeId={informeId} onSave={handleSave}>
      <EscuelaInfoHeader />
      <DescripcionCondicion value={data.descripcion_condicion} onChange={val => setData(prev => ({ ...prev, descripcion_condicion: val }))} />

      {/* Secciones de Verificación */}
      {data.secciones.map((seccion, secIdx) => (
        <div key={secIdx} className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-bold text-navy mb-4">{seccion.titulo}</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="border border-slate-300 px-3 py-2 text-left text-sm font-bold">Ítem</th>
                  <th className="border border-slate-300 px-3 py-2 text-center text-sm font-bold w-20">Cumple</th>
                  <th className="border border-slate-300 px-3 py-2 text-center text-sm font-bold w-20">No Cumple</th>
                  <th className="border border-slate-300 px-3 py-2 text-left text-sm font-bold">Observación</th>
                </tr>
              </thead>
              <tbody>
                {seccion.items.map((item, itemIdx) => (
                  <tr key={item.id} className={itemIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="border border-slate-300 px-3 py-2 text-sm">{item.nombre}</td>
                    <td className="border border-slate-300 px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={item.cumple === true}
                        onChange={() => updateVerificacion(secIdx, itemIdx, 'cumple', item.cumple === true ? null : true)}
                        className="cursor-pointer w-5 h-5"
                      />
                    </td>
                    <td className="border border-slate-300 px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={item.cumple === false}
                        onChange={() => updateVerificacion(secIdx, itemIdx, 'cumple', item.cumple === false ? null : false)}
                        className="cursor-pointer w-5 h-5"
                      />
                    </td>
                    <td className="border border-slate-300 px-3 py-2">
                      <input
                        type="text"
                        value={item.observacion}
                        onChange={e => updateVerificacion(secIdx, itemIdx, 'observacion', e.target.value)}
                        className="w-full border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                        placeholder="Observaciones..."
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Evidencia Documental */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-bold text-navy mb-4">6. Evidencia Documental</h3>
        <div className="overflow-x-auto mb-4">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="border border-slate-300 px-3 py-2 text-left text-sm font-bold">Documento</th>
                <th className="border border-slate-300 px-3 py-2 text-center text-sm font-bold w-20">Cumple</th>
                <th className="border border-slate-300 px-3 py-2 text-center text-sm font-bold w-20">No Cumple</th>
                <th className="border border-slate-300 px-3 py-2 text-left text-sm font-bold">Comentarios</th>
              </tr>
            </thead>
            <tbody>
              {data.documentos.map((doc, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="border border-slate-300 px-3 py-2 text-sm">{doc.nombre}</td>
                  <td className="border border-slate-300 px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={doc.cumple === true}
                      onChange={() => updateDocumento(idx, 'cumple', doc.cumple === true ? null : true)}
                      className="cursor-pointer w-5 h-5"
                    />
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={doc.cumple === false}
                      onChange={() => updateDocumento(idx, 'cumple', doc.cumple === false ? null : false)}
                      className="cursor-pointer w-5 h-5"
                    />
                  </td>
                  <td className="border border-slate-300 px-3 py-2">
                    <input
                      type="text"
                      value={doc.observacion}
                      onChange={e => updateDocumento(idx, 'observacion', e.target.value)}
                      className="w-full border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                      placeholder="Comentarios..."
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t pt-4">
          <label className="block text-sm font-bold text-navy mb-2">Comentarios Generales</label>
          <textarea
            value={data.comentarios_generales}
            onChange={e => setData(prev => ({ ...prev, comentarios_generales: e.target.value }))}
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            placeholder="Ingrese comentarios generales sobre la evidencia documental..."
            rows={4}
          />
        </div>
      </div>

      {/* Capacitaciones */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <CapacitacionesSection
          tieneCapacitaciones={data.tiene_capacitaciones}
          capacitaciones={data.capacitaciones}
          onChangeTiene={v => setData(prev => ({ ...prev, tiene_capacitaciones: v }))}
          onChangeCapacitaciones={v => setData(prev => ({ ...prev, capacitaciones: v }))}
        />
      </div>

      {/* Registro Fotográfico */}
      <RegistroFotografico
        fotos={data.fotos}
        onChange={fotos => setData(prev => ({ ...prev, fotos }))}
      />
    </FormWrapper>
  )
}
