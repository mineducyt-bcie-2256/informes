'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FileText, Upload, X, Loader2 } from 'lucide-react'

interface Props {
  escuelaId: number
  escuelaNombre: string
  mes: number
  anio: number
}

export default function PendienteCell({ escuelaId, escuelaNombre, mes, anio }: Props) {
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleUploadPdf() {
    const file = fileRef.current?.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')

    try {
      // 1. Crear el informe en estado 'enviado'
      const { data: { user } } = await supabase.auth.getUser()
      const { data: informe, error: errInforme } = await supabase
        .from('informes')
        .insert({
          escuela_id: escuelaId,
          periodo_mes: mes,
          periodo_anio: anio,
          creado_por: user?.id,
          estado: 'enviado',
        })
        .select()
        .single()

      if (errInforme) throw new Error(errInforme.message)

      // 2. Subir PDF a Storage
      const fileName = `${escuelaId}/${anio}-${String(mes).padStart(2,'0')}-${Date.now()}.pdf`
      const { error: errStorage } = await supabase.storage
        .from('informes-pdf')
        .upload(fileName, file, { contentType: 'application/pdf', upsert: true })

      if (errStorage) throw new Error(errStorage.message)

      // 3. Guardar URL del PDF en el informe
      const { data: { publicUrl } } = supabase.storage
        .from('informes-pdf')
        .getPublicUrl(fileName)

      await supabase.from('informes')
        .update({ pdf_url: publicUrl })
        .eq('id', informe.id)

      setOpen(false)
      router.refresh()
    } catch (e: any) {
      setError(e.message ?? 'Error al subir el archivo')
    } finally {
      setUploading(false)
    }
  }

  function handleNuevoInforme() {
    router.push(`/informes/nuevo?escuela_id=${escuelaId}&mes=${mes}&anio=${anio}`)
  }

  const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-block px-1 py-0.5 rounded text-xs font-medium bg-red-100 text-red-600 hover:bg-red-200 transition-colors cursor-pointer"
      >
        Pendiente
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-slate-800 text-base">Informe pendiente</h2>
                <p className="text-xs text-slate-500 mt-0.5">{escuelaNombre}</p>
                <p className="text-xs text-slate-400">{MESES[mes-1]} {anio}</p>
              </div>
              <button onClick={() => { setOpen(false); setError('') }}>
                <X size={20} className="text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            {/* Options */}
            <div className="p-6 space-y-3">
              <p className="text-sm text-slate-600 mb-4">¿Cómo deseas registrar este informe?</p>

              {/* Opción A: Crear informe */}
              <button
                onClick={handleNuevoInforme}
                className="w-full flex items-center gap-4 p-4 border-2 border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all group text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200">
                  <FileText size={20} className="text-blue-700" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">Llenar informe en el sistema</p>
                  <p className="text-xs text-slate-500 mt-0.5">Completa los formularios de las 8 condiciones ambientales y sociales</p>
                </div>
              </button>

              {/* Opción B: Subir PDF */}
              <div className="w-full border-2 border-slate-200 rounded-xl p-4 hover:border-green-400 transition-all">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Upload size={20} className="text-green-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">Subir informe en PDF</p>
                    <p className="text-xs text-slate-500 mt-0.5">Sube un PDF ya elaborado para revisión y aprobación</p>
                  </div>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf"
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-green-100 file:text-green-700 file:font-medium file:text-xs hover:file:bg-green-200 cursor-pointer"
                />
                {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
                <button
                  onClick={handleUploadPdf}
                  disabled={uploading}
                  className="mt-3 w-full bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {uploading ? <><Loader2 size={14} className="animate-spin" /> Subiendo...</> : 'Subir PDF'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
