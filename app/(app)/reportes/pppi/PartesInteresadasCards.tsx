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

export default function PartesInteresadasCards({
  supervision,
  empresaObras,
  busqueda,
  mesDesde,
  mesHasta,
}: PartesInteresadasCardsProps) {
  const supabase = createClient()
  const [datos, setDatos] = useState({
    estudiantes_ninos: 0,
    estudiantes_ninas: 0,
    maestros_hombres: 0,
    maestros_mujeres: 0,
    directores: 0,
    cde: 0,
    personal: 0,
  })

  useEffect(() => {
    async function cargarDatos() {
      try {
        let escuelasQuery = supabase
          .from('escuelas')
          .select('id')
          .eq('activa', true)

        if (supervision) escuelasQuery = escuelasQuery.eq('empresa_supervision', supervision)
        if (empresaObras) escuelasQuery = escuelasQuery.eq('empresa_obras', empresaObras)
        if (busqueda) escuelasQuery = escuelasQuery.eq('id', busqueda)

        const { data: escuelas } = await escuelasQuery
        if (!escuelas?.length) return

        const { data: informes } = await supabase
          .from('informes')
          .select('id, periodo_mes')
          .in('escuela_id', escuelas.map(e => e.id))

        if (!informes?.length) return

        const { data: pppiData } = await supabase
          .from('informe_pppi')
          .select('partes_interesadas')
          .in('informe_id', informes.map(i => i.id))

        const informesFiltrados = informes.filter(inf => {
          if (mesDesde && parseInt(mesDesde) > inf.periodo_mes) return false
          if (mesHasta && parseInt(mesHasta) < inf.periodo_mes) return false
          return true
        })

        let totales = {
          estudiantes_ninos: 0,
          estudiantes_ninas: 0,
          maestros_hombres: 0,
          maestros_mujeres: 0,
          directores: 0,
          cde: 0,
          personal: 0,
        }

        pppiData?.forEach(pppi => {
          const partes = pppi.partes_interesadas as any
          if (!partes) return

          if (partes.alumnos?.activa) {
            totales.estudiantes_ninos += partes.alumnos.hombres || 0
            totales.estudiantes_ninas += partes.alumnos.mujeres || 0
          }

          if (partes.profesores?.activa) {
            totales.maestros_hombres += partes.profesores.hombres || 0
            totales.maestros_mujeres += partes.profesores.mujeres || 0
          }

          if (partes.director?.activa) {
            totales.directores += (partes.director.hombres || 0) + (partes.director.mujeres || 0)
          }

          if (partes.cde?.activa) {
            totales.cde += (partes.cde.hombres || 0) + (partes.cde.mujeres || 0)
          }

          if (partes.personal?.activa) {
            totales.personal += (partes.personal.hombres || 0) + (partes.personal.mujeres || 0)
          }
        })

        setDatos(totales)
      } catch (error) {
        console.error('Error:', error)
      }
    }

    cargarDatos()
  }, [supervision, empresaObras, busqueda, mesDesde, mesHasta, supabase])

  const cards = [
    {
      label: 'Estudiantes',
      icon: Users,
      color: 'blue',
      items: [
        { label: 'Niños', value: datos.estudiantes_ninos },
        { label: 'Niñas', value: datos.estudiantes_ninas },
        { label: 'Total', value: datos.estudiantes_ninos + datos.estudiantes_ninas, highlight: true },
      ],
    },
    {
      label: 'Docentes',
      icon: BookOpen,
      color: 'green',
      items: [
        { label: 'Hombres', value: datos.maestros_hombres },
        { label: 'Mujeres', value: datos.maestros_mujeres },
        { label: 'Total', value: datos.maestros_hombres + datos.maestros_mujeres, highlight: true },
      ],
    },
    {
      label: 'Directores',
      icon: User,
      color: 'purple',
      items: [{ label: 'Total', value: datos.directores, highlight: true }],
    },
    {
      label: 'CDE',
      icon: Briefcase,
      color: 'orange',
      items: [{ label: 'Total', value: datos.cde, highlight: true }],
    },
    {
      label: 'Personal Proyecto',
      icon: Briefcase,
      color: 'red',
      items: [{ label: 'Total', value: datos.personal, highlight: true }],
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
