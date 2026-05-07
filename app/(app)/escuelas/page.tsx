import { createClient } from '@/lib/supabase/server'

import Link from 'next/link'
import { Plus, Upload } from 'lucide-react'
import ImportarEscuelas from './ImportarEscuelas'

export default async function EscuelasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; grupo?: string; etapa?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams
  const q = params.q ?? ''
  const grupo = params.grupo ?? ''
  const etapa = params.etapa ?? ''

  // Detectar rol visitante → solo escuelas demo
  const { data: { user } } = await supabase.auth.getUser()
  let rolActual = 'usuario'
  if (user) {
    const { data: prof } = await supabase.from('profiles').select('rol').eq('id', user.id).single()
    rolActual = prof?.rol ?? 'usuario'
  }
  const esVisitante = rolActual === 'visitante'

  let query = supabase
    .from('escuelas')
    .select('*, grupos(numero)')
    .eq('activa', true)
    .order('grupo_id', { ascending: true })
    .order('nombre', { ascending: true })

  if (esVisitante) query = query.eq('es_demo', true)

  if (q) query = query.ilike('nombre', `%${q}%`)
  if (grupo) query = query.eq('grupo_id', grupo)
  if (etapa) query = query.eq('etapa', etapa)

  function formatAvance(val: string | null): string {
    if (!val) return '—'
    const n = parseFloat(val)
    if (isNaN(n)) return val
    // Si viene como decimal (0.98) lo convierte a 98%, si ya viene como 98 lo deja
    return (n <= 1 ? Math.round(n * 100) : Math.round(n)) + '%'
  }

  const { data: escuelas } = await query
  const { data: grupos } = await supabase.from('grupos').select('*').order('numero')

  const etapas = [
    'Contructivo finalizado', 'Construcción', 'Diseño de Carpeta',
    'Revision de carpeta UGP', 'Licitación finalizada', 'Diseño de Carpeta Sin adjudicar', 'SIN ADJUDICAR'
  ]

  return (
    
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Centros Educativos Programa Mi Nueva Escuela BCIE</h1>
            <p className="text-slate-500 text-sm mt-1">{escuelas?.length ?? 0} centros educativos</p>
          </div>
          {!esVisitante && <ImportarEscuelas />}
        </div>

        {/* Filtros */}
        <form method="GET" className="flex flex-wrap gap-3 mb-6 bg-white border border-slate-200 rounded-xl p-4">
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por nombre..."
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select name="grupo" defaultValue={grupo} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Todos los grupos</option>
            {grupos?.map(g => (
              <option key={g.id} value={g.id}>Grupo {g.numero}</option>
            ))}
          </select>
          <select name="etapa" defaultValue={etapa} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Todas las etapas</option>
            {etapas.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <button type="submit" className="bg-blue-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-800 transition">
            Filtrar
          </button>
        </form>

        {/* Tabla */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Grupo</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Código</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Centro Educativo</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Etapa</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">% Avance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {escuelas?.map(esc => (
                  <tr key={esc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                        G{(esc as any).grupos?.numero ?? '?'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{esc.codigo}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{esc.nombre}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{esc.etapa}</td>
                    <td className="px-4 py-3 text-slate-600 font-medium">{formatAvance(esc.porcentaje_avance)}</td>
                  </tr>
                ))}
                {!escuelas?.length && (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-slate-400">
                      No se encontraron escuelas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    
  )
}
