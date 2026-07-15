'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import { MESES } from '@/types'

interface RegistrosPppiProps {
  supervision?: string
  empresaObras?: string
  busqueda?: string
  mesDesde?: string
  mesHasta?: string
}

interface RegistroPppi {
  codigo: string
  nombre: string
  supervision: string
  empresa_obras: string
  periodo_mes: number
  descripcion_condicion: string
  tiene_capacitaciones: string
  observaciones: string
}

export default function RegistrosPppi({
  supervision,
  empresaObras,
  busqueda,
  mesDesde,
  mesHasta,
}: RegistrosPppiProps) {
  const supabase = createClient()
  const [registros, setRegistros] = useState<RegistroPppi[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function cargarDatos() {
      setCargando(true)
      try {
        // Obtener escuelas según filtros
        let escuelasQuery = supabase
          .from('escuelas')
          .select('id, nombre, codigo, empresa_supervision, empresa_obras')
          .eq('activa', true)
          .neq('numero_contrato', 'SIN ADJUDICAR')
          .not('numero_contrato', 'is', null)

        if (supervision) {
          escuelasQuery = escuelasQuery.eq('empresa_supervision', supervision)
        }

        if (empresaObras) {
          escuelasQuery = escuelasQuery.eq('empresa_obras', empresaObras)
        }

        if (busqueda && busqueda.length > 0) {
          // Si busqueda es un ID, filtrar por ID, si no, es texto para búsqueda
          if (busqueda.includes('-') || busqueda.length > 10) {
            escuelasQuery = escuelasQuery.eq('id', busqueda)
          }
        }

        const { data: escuelas } = await escuelasQuery

        if (!escuelas || escuelas.length === 0) {
          setRegistros([])
          setCargando(false)
          return
        }

        const escuelaIds = escuelas.map(e => e.id)

        // Obtener informes
        let informesQuery = supabase
          .from('informes')
          .select('id, escuela_id, periodo_mes, periodo_anio')
          .in('escuela_id', escuelaIds)

        const { data: informes } = await informesQuery

        if (!informes || informes.length === 0) {
          setRegistros([])
          setCargando(false)
          return
        }

        const informeIds = informes.map(i => i.id)

        // Obtener datos PPPI
        const { data: pppiData } = await supabase
          .from('informe_pppi')
          .select('informe_id, descripcion_condicion, tiene_capacitaciones, observaciones')
          .in('informe_id', informeIds)

        // Combinar datos
        const combinados = informes
          .map(inf => {
            const escuelaInfo = escuelas.find(e => e.id === inf.escuela_id)
            const pppiInfo = pppiData?.find(p => p.informe_id === inf.id)

            return {
              codigo: escuelaInfo?.codigo || '',
              nombre: escuelaInfo?.nombre || '',
              supervision: escuelaInfo?.empresa_supervision || '',
              empresa_obras: escuelaInfo?.empresa_obras || '',
              periodo_mes: inf.periodo_mes,
              periodo_anio: inf.periodo_anio,
              descripcion_condicion: pppiInfo?.descripcion_condicion || '—',
              tiene_capacitaciones: pppiInfo?.tiene_capacitaciones || '—',
              observaciones: pppiInfo?.observaciones || '—',
            }
          })
          .filter(r => {
            // Filtrar por período si está especificado
            if (mesDesde && parseInt(mesDesde) > r.periodo_mes) return false
            if (mesHasta && parseInt(mesHasta) < r.periodo_mes) return false
            return true
          })
          .sort((a, b) => a.codigo.localeCompare(b.codigo))

        setRegistros(combinados as RegistroPppi[])
      } catch (error) {
        console.error('Error cargando PPPI:', error)
        setRegistros([])
      } finally {
        setCargando(false)
      }
    }

    cargarDatos()
  }, [supervision, empresaObras, busqueda, mesDesde, mesHasta, supabase])

  const handleDescargarExcel = () => {
    if (registros.length === 0) return

    const datos = registros.map(r => ({
      'Código': r.codigo,
      'Centro Educativo': r.nombre,
      'Supervisión': r.supervision,
      'Empresa Obras': r.empresa_obras,
      'Mes': MESES[r.periodo_mes - 1],
      'Descripción de Condición': r.descripcion_condicion,
      'Tiene Capacitaciones': r.tiene_capacitaciones,
      'Observaciones': r.observaciones,
    }))

    const worksheet = XLSX.utils.json_to_sheet(datos)
    worksheet['!cols'] = [
      { wch: 12 },
      { wch: 30 },
      { wch: 20 },
      { wch: 20 },
      { wch: 12 },
      { wch: 35 },
      { wch: 18 },
      { wch: 35 },
    ]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'PPPI')
    XLSX.writeFile(workbook, 'PPPI-Registros.xlsx')
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-600">
          Registros de PPPI ({registros.length})
        </h2>
        {registros.length > 0 && (
          <button
            onClick={handleDescargarExcel}
            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            <Download size={14} />
            Descargar Excel
          </button>
        )}
      </div>

      {/* Tabla */}
      {cargando ? (
        <div className="text-center py-8 text-slate-500">Cargando registros...</div>
      ) : registros.length === 0 ? (
        <div className="text-center py-8 text-slate-500">No hay registros para los filtros seleccionados</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-xs">
            <thead className="bg-slate-100 border-b border-slate-200 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Código</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Centro Educativo</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Supervisión</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Empresa Obras</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Mes</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Descripción de Condición</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Capacitaciones</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((registro, idx) => (
                <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50 transition">
                  <td className="px-3 py-2 font-medium text-slate-900">{registro.codigo}</td>
                  <td className="px-3 py-2 text-slate-700">{registro.nombre}</td>
                  <td className="px-3 py-2 text-slate-700 text-[11px]">{registro.supervision}</td>
                  <td className="px-3 py-2 text-slate-700 text-[11px]">{registro.empresa_obras}</td>
                  <td className="px-3 py-2 text-slate-700 text-[11px]">{MESES[registro.periodo_mes - 1]}</td>
                  <td className="px-3 py-2 text-slate-700 max-w-xs truncate text-[11px]">{registro.descripcion_condicion}</td>
                  <td className="px-3 py-2 text-slate-700 text-[11px]">{registro.tiene_capacitaciones}</td>
                  <td className="px-3 py-2 text-slate-700 max-w-xs truncate text-[11px]">{registro.observaciones}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
