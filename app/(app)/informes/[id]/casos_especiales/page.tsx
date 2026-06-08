'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import FormWrapper from '@/components/forms/FormWrapper'
import EscuelaInfoHeader from '@/components/forms/EscuelaInfoHeader'
import DescripcionCondicion from '@/components/forms/DescripcionCondicion'
import { AlertCircle, Upload, File, X, CheckCircle } from 'lucide-react'

const TIPOS_CASO = [
  { value: 'incumplimiento', label: 'Incumplimiento de entrega' },
  { value: 'pausa_tecnica', label: 'Pausa técnica' },
  { value: 'finalizacion_cierre', label: 'Finalización de obras (proceso de cierre)' },
  { value: 'otro', label: 'Otro' },
]

const ESTADOS = [
  { value: 'activo', label: 'Activo (pendiente de resolución)' },
  { value: 'resuelto', label: 'Resuelto' },
  { value: 'seguimiento', label: 'Seguimiento' },
]

const INIT = {
  tipo_caso: '',
  fecha_inicio: '',
  estado: 'activo',
  descripcion_condicion: '',
  casos_reportados: '',
  acciones_tomadas: '',
  documento_url: '',
  documento_nombre: '',
  reemplaza_informe: false,
}

const inputCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const textareaCls = `${inputCls} resize-none`
const labelCls = 'text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 block'
const selectCls = inputCls

export default function CasosEspecialesPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState(INIT)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [informe, setInforme] = useState<any>(null)

  useEffect(() => {
    async function load() {
      // Cargar informe
      const { data: inf } = await supabase
        .from('informes')
        .select('*, escuelas(nombre), profiles(nombre)')
        .eq('id', id)
        .single()

      if (inf) setInforme(inf)

      // Cargar datos existentes
      const { data: casos } = await supabase
        .from('informe_casos_especiales')
        .select('*')
        .eq('informe_id', id)
        .single()

      if (casos) {
        setForm({
          tipo_caso: casos.tipo_caso ?? '',
          fecha_inicio: casos.fecha_inicio ?? '',
          estado: casos.estado ?? 'activo',
          descripcion_condicion: casos.descripcion_condicion ?? '',
          casos_reportados: casos.casos_reportados ?? '',
          acciones_tomadas: casos.acciones_tomadas ?? '',
          documento_url: casos.documento_url ?? '',
          documento_nombre: casos.documento_nombre ?? '',
          reemplaza_informe: casos.reemplaza_informe ?? false,
        })
      }

      setLoading(false)
    }
    load()
  }, [id, supabase])

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')

    try {
      const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!
      const PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!

      const fd = new FormData()
      fd.append('file', file)
      fd.append('upload_preset', PRESET)
      fd.append('folder', `informes/${id}/casos-especiales`)
      fd.append('resource_type', 'raw') // para archivos no-imagen

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD}/raw/upload`,
        { method: 'POST', body: fd }
      )

      const json = await res.json()
      if (!json.secure_url) throw new Error('Error al cargar archivo')

      setForm((p) => ({
        ...p,
        documento_url: json.secure_url,
        documento_nombre: file.name,
      }))
    } catch (err: any) {
      setError(err.message || 'Error al cargar documento')
    } finally {
      setUploading(false)
    }
  }

  async function handleSave(justificacion?: string) {
    if (!form.tipo_caso) {
      setError('Debes seleccionar un tipo de caso')
      return
    }

    if (form.reemplaza_informe && !form.documento_url) {
      setError('Debes cargar un documento para reemplazar el informe')
      return
    }

    const payload = {
      informe_id: id,
      tipo_caso: form.tipo_caso || null,
      fecha_inicio: form.fecha_inicio || null,
      estado: form.estado,
      descripcion_condicion: form.descripcion_condicion || null,
      casos_reportados: form.casos_reportados || null,
      acciones_tomadas: form.acciones_tomadas || null,
      documento_url: form.documento_url || null,
      documento_nombre: form.documento_nombre || null,
      reemplaza_informe: form.reemplaza_informe,
      reemplaza_fecha: form.reemplaza_informe ? new Date().toISOString() : null,
    }

    const { error: saveErr } = await supabase
      .from('informe_casos_especiales')
      .upsert(payload, { onConflict: 'informe_id' })

    if (saveErr) throw new Error(saveErr.message)

    // Si reemplaza informe, marcarlo como enviado
    if (form.reemplaza_informe) {
      const { error: updateErr } = await supabase
        .from('informes')
        .update({ estado: 'enviado' })
        .eq('id', id)

      if (updateErr) throw new Error(updateErr.message)

      // Redirigir a lista de informes
      setTimeout(() => {
        router.push('/informes')
      }, 2000)
    }
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
            Utiliza esta sección para reportar cuando la empresa ya no entrega informes por incumplimiento, pausa técnica o finalización de obras.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Tipo de caso</label>
            <select
              value={form.tipo_caso}
              onChange={(e) => setForm((p) => ({ ...p, tipo_caso: e.target.value }))}
              className={selectCls}
            >
              <option value="">Selecciona un tipo...</option>
              {TIPOS_CASO.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Fecha de inicio del problema</label>
            <input
              type="date"
              value={form.fecha_inicio}
              onChange={(e) => setForm((p) => ({ ...p, fecha_inicio: e.target.value }))}
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Estado del caso</label>
          <select
            value={form.estado}
            onChange={(e) => setForm((p) => ({ ...p, estado: e.target.value }))}
            className={selectCls}
          >
            {ESTADOS.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls}>Casos reportados</label>
          <textarea
            value={form.casos_reportados}
            onChange={(e) => setForm((p) => ({ ...p, casos_reportados: e.target.value }))}
            placeholder="Describe los casos especiales o situaciones detectadas..."
            rows={4}
            className={textareaCls}
          />
        </div>

        <div>
          <label className={labelCls}>Acciones tomadas</label>
          <textarea
            value={form.acciones_tomadas}
            onChange={(e) => setForm((p) => ({ ...p, acciones_tomadas: e.target.value }))}
            placeholder="Detalla las acciones que se han implementado..."
            rows={4}
            className={textareaCls}
          />
        </div>

        {/* Upload de documento */}
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-6">
          <div className="flex flex-col items-center gap-2">
            <File size={32} className="text-slate-400" />
            <p className="text-sm font-medium text-slate-700">Nota oficial de supervisión</p>
            <p className="text-xs text-slate-500">PDF, DOC, DOCX (máx 10MB)</p>

            <label className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 text-sm font-medium">
              {uploading ? 'Cargando...' : 'Cargar documento'}
              <input
                type="file"
                onChange={handleFileUpload}
                disabled={uploading}
                accept=".pdf,.doc,.docx"
                className="hidden"
              />
            </label>

            {form.documento_nombre && (
              <div className="mt-4 w-full bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600" />
                  <span className="text-sm text-green-700">{form.documento_nombre}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, documento_url: '', documento_nombre: '' }))}
                  className="text-green-600 hover:text-green-800"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Checkbox reemplaza informe */}
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.reemplaza_informe}
              onChange={(e) => setForm((p) => ({ ...p, reemplaza_informe: e.target.checked }))}
              className="w-5 h-5 mt-0.5 rounded border-slate-300 text-amber-600"
            />
            <div>
              <p className="text-sm font-medium text-amber-900">
                Esta acción reemplaza el informe y enviar
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Al marcar esto, el informe se enviará automáticamente con solo la portada y este formulario. No se puede deshacer después del envío.
              </p>
            </div>
          </label>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {form.reemplaza_informe && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
            ✓ Al guardar, el informe será marcado como ENVIADO
          </div>
        )}
      </div>
    </FormWrapper>
  )
}
