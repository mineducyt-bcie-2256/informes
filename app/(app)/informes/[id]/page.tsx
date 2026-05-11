import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MESES, CONDICIONES } from '@/types'
import { CheckCircle, Clock, FileDown, ChevronRight, AlertTriangle, CircleCheck } from 'lucide-react'
import AccionesInforme from './AccionesInforme'

export default async function InformePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: informe } = await supabase
    .from('informes')
    .select('*, escuelas(nombre, codigo, departamento, empresa_obras, grupos(numero))')
    .eq('id', id)
    .single()

  if (!informe) notFound()

  const esc = informe.escuelas as any

  // Obtener rol del usuario actual
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('rol').eq('id', user?.id ?? '').single()
  const rol = profile?.rol ?? 'usuario'

  // Check which condiciones have been filled
  const filled: Record<string, boolean> = {}
  await Promise.all(CONDICIONES.map(async ({ key }) => {
    const table = key === 'c1317' ? 'informe_c1317' : `informe_${key}`
    const { data } = await supabase.from(table).select('id').eq('informe_id', id).single()
    filled[key] = !!data
  }))

  const completadas = Object.values(filled).filter(Boolean).length

  // Cargar observaciones solo si el informe fue enviado o aprobado
  // (en borrador el administrador aún no puede observar)
  const obsMap: Record<string, string> = {}
  if (informe.estado !== 'borrador') {
    const { data: rawObservaciones } = await supabase
      .from('informe_observaciones')
      .select('seccion, estado')
      .eq('informe_id', id)
      .neq('observacion', '')
    rawObservaciones?.forEach(o => { obsMap[o.seccion] = o.estado })
  }

  return (
    
      <div className="p-8 w-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
              <Link href="/informes" className="hover:text-blue-600">Informes</Link>
              <ChevronRight size={14} />
              <span>{esc?.nombre}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">{esc?.nombre}</h1>
            <p className="text-slate-500 text-sm mt-1">
              Informe {MESES[informe.periodo_mes - 1]} {informe.periodo_anio} ·
              Grupo {esc?.grupos?.numero ?? '?'} · {esc?.departamento}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${
              informe.estado === 'aprobado' ? 'bg-green-100 text-green-700' :
              informe.estado === 'enviado' ? 'bg-blue-100 text-blue-700' :
              'bg-amber-100 text-amber-700'
            }`}>
              {informe.estado}
            </span>
            <Link
              href={`/informes/${id}/pdf`}
              className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-700"
            >
              <FileDown size={16} />
              PDF
            </Link>
          </div>
        </div>

        {/* Acciones */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-5">
          <p className="text-xs text-slate-500 mb-3 font-medium uppercase tracking-wide">Acciones del informe</p>
          <AccionesInforme
            informeId={id}
            estado={informe.estado}
            pdfUrl={informe.pdf_url}
            rolUsuario={rol}
          />
        </div>

        {/* Progress */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-700">Progreso del informe</span>
            <span className="text-sm text-slate-500">{completadas} / {CONDICIONES.length} condiciones</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all"
              style={{ width: `${(completadas / CONDICIONES.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Condiciones */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CONDICIONES.map(({ key, label, short }) => {
            const obsEstado = obsMap[short]  // 'pendiente' | 'atendido' | 'aprobado' | undefined
            const tieneObsPendiente = obsEstado === 'pendiente'
            const tieneObsAtendida  = obsEstado === 'atendido'
            const borderCls =
              tieneObsPendiente ? 'border-amber-300 bg-amber-50/40' :
              tieneObsAtendida  ? 'border-blue-300  bg-blue-50/30'  :
                                  'border-slate-200'
            return (
              <Link
                key={key}
                href={`/informes/${id}/${key}`}
                className={`bg-white rounded-xl border p-5 hover:shadow-sm transition-all group ${borderCls}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{short}</span>
                      {filled[key] ? (
                        <CheckCircle size={14} className="text-green-500" />
                      ) : (
                        <Clock size={14} className="text-amber-400" />
                      )}
                    </div>
                    <p className={`text-sm font-medium group-hover:text-blue-700 ${
                      tieneObsPendiente ? 'text-amber-800' :
                      tieneObsAtendida  ? 'text-blue-800'  :
                                          'text-slate-700'
                    }`}>{label}</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-500 mt-1" />
                </div>

                {/* Estado del formulario + badge de observación */}
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs font-medium">
                    {filled[key]
                      ? <span className="text-green-600">Completado</span>
                      : <span className="text-amber-500">Pendiente</span>
                    }
                  </p>
                  {tieneObsPendiente && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                      <AlertTriangle size={11} /> Observado
                    </span>
                  )}
                  {tieneObsAtendida && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-100 border border-blue-300 px-2 py-0.5 rounded-full">
                      <CircleCheck size={11} /> Atendido
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    
  )
}
