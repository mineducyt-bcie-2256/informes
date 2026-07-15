'use client'
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
  const cards = [
    {
      label: 'Estudiantes',
      icon: Users,
      color: 'blue',
      items: [
        { label: 'Niños', value: 0 },
        { label: 'Niñas', value: 0 },
        { label: 'Total', value: 0, highlight: true },
      ],
    },
    {
      label: 'Docentes',
      icon: BookOpen,
      color: 'green',
      items: [
        { label: 'Hombres', value: 0 },
        { label: 'Mujeres', value: 0 },
        { label: 'Total', value: 0, highlight: true },
      ],
    },
    {
      label: 'Directores',
      icon: User,
      color: 'purple',
      items: [{ label: 'Total', value: 0, highlight: true }],
    },
    {
      label: 'CDE',
      icon: Briefcase,
      color: 'orange',
      items: [{ label: 'Total', value: 0, highlight: true }],
    },
    {
      label: 'Personal Proyecto',
      icon: Briefcase,
      color: 'red',
      items: [{ label: 'Total', value: 0, highlight: true }],
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
