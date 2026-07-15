'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, BookOpen, User, Briefcase } from 'lucide-react'

interface PartesInteresadasCardsProps {
  supervision?: string
  empresaObras?: string
  busqueda?: string
  mesDesde?: string
  mesHasta?: string
}

interface ParteData {
  total_estudiantes_ninos: number
  total_estudiantes_ninas: number
  total_estudiantes: number
  total_maestros_hombres: number
  total_maestros_mujeres: number
  total_maestros: number
  total_directores: number
  total_cde: number
  total_personal_proyecto: number
}

export default function PartesInteresadasCards({
  supervision,
  empresaObras,
  busqueda,
  mesDesde,
  mesHasta,
}: PartesInteresadasCardsProps) {
  const supabase = createClient()
  const [datos, setDatos] = useState<ParteData>({
    total_estudiantes_ninos: 0,
    total_estudiantes_ninas: 0,
    total_estudiantes: 0,
    total_maestros_hombres: 0,
    total_maestros_mujeres: 0,
    total_maestros: 0,
    total_directores: 0,
    total_cde: 0,
    total_personal_proyecto: 0,
  })
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function cargarDatos() {
      setCargando(true)
      try {
        // Obtener escuelas según filtros
        let escuelasQuery = supabase
          .from('escuelas')
          .select('id')
          .eq('activa', true)
          .neq('numero_contrato', 'SIN ADJUDICAR')
          .not('numero_contrato', 'is', null)

        if (supervision) {
          escuelasQuery = escuelasQuery.eq('empresa_supervision', supervision)
        }

        if (empresaObras) {
          escuelasQuery = escuelasQuery.eq('empresa_obras', empresaObras)
        }

        if (busqueda) {
          escuelasQuery = escuelasQuery.eq('id', busqueda)
        }

        const { data: escuelas } = await escuelasQuery

        if (!escuelas || escuelas.length === 0) {
          setDatos({
            total_estudiantes_ninos: 0,
            total_estudiantes_ninas: 0,
            total_estudiantes: 0,
            total_maestros_hombres: 0,
            total_maestros_mujeres: 0,
            total_maestros: 0,
            total_directores: 0,
            total_cde: 0,
            total_personal_proyecto: 0,
          })
          setCargando(false)
          return
        }

        const escuelaIds = escuelas.map(e => e.id)

        // Obtener informes
        let informesQuery = supabase
          .from('informes')
          .select('id, periodo_mes')
          .in('escuela_id', escuelaIds)

        const { data: informes } = await informesQuery

        if (!informes || informes.length === 0) {
          setDatos({
            total_estudiantes_ninos: 0,
            total_estudiantes_ninas: 0,
            total_estudiantes: 0,
            total_maestros_hombres: 0,
            total_maestros_mujeres: 0,
            total_maestros: 0,
            total_directores: 0,
            total_cde: 0,
            total_personal_proyecto: 0,
          })
          setCargando(false)
          return
        }

        const informeIds = informes.map(i => i.id)

        // Obtener datos PPPI
        const { data: pppiData } = await supabase
          .from('informe_pppi')
          .select('partes_interesadas')
          .in('informe_id', informeIds)

        // Procesar datos de partes interesadas
        let totales: ParteData = {
          total_estudiantes_ninos: 0,
          total_estudiantes_ninas: 0,
          total_estudiantes: 0,
          total_maestros_hombres: 0,
          total_maestros_mujeres: 0,
          total_maestros: 0,
          total_directores: 0,
          total_cde: 0,
          total_personal_proyecto: 0,
        }

        // Filtrar por período
        const informesFiltrados = informes.filter(inf => {
          if (mesDesde && parseInt(mesDesde) > inf.periodo_mes) return false
          if (mesHasta && parseInt(mesHasta) < inf.periodo_mes) return false
          return true
        })

        const informesFiltradosIds = informesFiltrados.map(i => i.id)

        pppiData?.forEach(pppi => {
          if (!informesFiltradosIds.includes(pppi.informe_id ?? '')) return

          const partes = pppi.partes_interesadas as any
          if (!partes) return

          // Alumnos
          if (partes.alumnos?.activa) {
            totales.total_estudiantes_ninos += partes.alumnos.hombres || 0
            totales.total_estudiantes_ninas += partes.alumnos.mujeres || 0
          }

          // Profesores
          if (partes.profesores?.activa) {
            totales.total_maestros_hombres += partes.profesores.hombres || 0
            totales.total_maestros_mujeres += partes.profesores.mujeres || 0
          }

          // Director
          if (partes.director?.activa) {
            totales.total_directores += partes.director.hombres + partes.director.mujeres || 0
          }

          // CDE
          if (partes.cde?.activa) {
            totales.total_cde += partes.cde.hombres + partes.cde.mujeres || 0
          }

          // Personal
          if (partes.personal?.activa) {
            totales.total_personal_proyecto += partes.personal.hombres + partes.personal.mujeres || 0
          }
        })

        totales.total_estudiantes = totales.total_estudiantes_ninos + totales.total_estudiantes_ninas
        totales.total_maestros = totales.total_maestros_hombres + totales.total_maestros_mujeres

        setDatos(totales)
      } catch (error) {
        console.error('Error cargando partes interesadas:', error)
      } finally {
        setCargando(false)
      }
    }

    cargarDatos()
  }, [supervision, empresaObras, busqueda, mesDesde, mesHasta, supabase])

  if (cargando) {
    return <div className="text-center py-8 text-slate-500">Cargando datos...</div>
  }

  const cards = [
    {
      label: 'Estudiantes',
      icon: Users,
      color: 'blue',
      items: [
        { label: 'Niños', value: datos.total_estudiantes_ninos },
        { label: 'Niñas', value: datos.total_estudiantes_ninas },
        { label: 'Total', value: datos.total_estudiantes, highlight: true },
      ],
    },
    {
      label: 'Docentes',
      icon: BookOpen,
      color: 'green',
      items: [
        { label: 'Hombres', value: datos.total_maestros_hombres },
        { label: 'Mujeres', value: datos.total_maestros_mujeres },
        { label: 'Total', value: datos.total_maestros, highlight: true },
      ],
    },
    {
      label: 'Directores',
      icon: User,
      color: 'purple',
      items: [{ label: 'Total', value: datos.total_directores, highlight: true }],
    },
    {
      label: 'CDE',
      icon: Briefcase,
      color: 'orange',
      items: [{ label: 'Total', value: datos.total_cde, highlight: true }],
    },
    {
      label: 'Personal Proyecto',
      icon: Briefcase,
      color: 'red',
      items: [{ label: 'Total', value: datos.total_personal_proyecto, highlight: true }],
    },
  ]

  const colorMap = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    red: 'bg-red-50 border-red-200 text-red-700',
  }

  return (
    <div className="mb-8">
      <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <Users size={18} />
        Partes Interesadas Identificadas
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {cards.map((card, idx) => {
          const Icon = card.icon
          const colorClass = colorMap[card.color as keyof typeof colorMap]

          return (
            <div key={idx} className={`rounded-lg border p-4 ${colorClass}`}>
              <div className="flex items-center gap-2 mb-3">
                <Icon size={16} />
                <h4 className="font-semibold text-sm">{card.label}</h4>
              </div>

              <div className="space-y-2">
                {card.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="flex justify-between items-center">
                    <span className="text-xs">{item.label}</span>
                    <span className={`font-semibold ${item.highlight ? 'text-lg' : 'text-sm'}`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
