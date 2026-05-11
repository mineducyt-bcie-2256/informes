'use client'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const COLORS = ['#3b82f6', '#8b5cf6'] // azul hombres, violeta mujeres

function IconoHombre({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 80" className={className} fill="currentColor">
      {/* Cabeza */}
      <circle cx="20" cy="12" r="9" />
      {/* Cuerpo / torso */}
      <rect x="11" y="23" width="18" height="24" rx="4" />
      {/* Pierna izquierda */}
      <rect x="11" y="44" width="8" height="22" rx="3" />
      {/* Pierna derecha */}
      <rect x="21" y="44" width="8" height="22" rx="3" />
    </svg>
  )
}

function IconoMujer({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 80" className={className} fill="currentColor">
      {/* Cabeza */}
      <circle cx="20" cy="11" r="9" />
      {/* Falda / cuerpo */}
      <path d="M10 24 Q10 34 5 66 L35 66 Q30 34 30 24 Q26 28 20 28 Q14 28 10 24Z" />
      {/* Torso */}
      <rect x="13" y="22" width="14" height="14" rx="3" />
    </svg>
  )
}

interface Props {
  hombres: number
  mujeres: number
  total: number
}

export default function PersonalDonut({ hombres, mujeres, total }: Props) {
  const pctH = total > 0 ? Math.round((hombres / total) * 100) : 0
  const pctM = total > 0 ? Math.round((mujeres / total) * 100) : 0

  const data = [
    { name: 'Hombres', value: hombres },
    { name: 'Mujeres', value: mujeres },
  ]

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Personal en obra</p>

      <div className="flex items-center justify-between gap-4">

        {/* Gráfico donut */}
        <div className="relative w-36 h-36 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={62}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                strokeWidth={2}
                stroke="#fff"
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number, name: string) => [`${v} personas`, name]}
                contentStyle={{ fontSize: 11, borderRadius: 8 }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Total en el centro */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-xl font-bold text-slate-800 leading-none">{total}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Total</p>
          </div>
        </div>

        {/* Leyenda con íconos */}
        <div className="flex flex-col gap-4 flex-1">

          {/* Hombres */}
          <div className="flex items-center gap-3">
            <IconoHombre className="w-7 h-14 text-blue-500 shrink-0" />
            <div>
              <p className="text-2xl font-bold text-blue-600 leading-none">{hombres}</p>
              <p className="text-xs text-slate-500">Hombres</p>
              <div className="flex items-center gap-1 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-xs font-semibold text-blue-600">{pctH}%</span>
              </div>
            </div>
          </div>

          {/* Mujeres */}
          <div className="flex items-center gap-3">
            <IconoMujer className="w-7 h-14 text-violet-500 shrink-0" />
            <div>
              <p className="text-2xl font-bold text-violet-600 leading-none">{mujeres}</p>
              <p className="text-xs text-slate-500">Mujeres</p>
              <div className="flex items-center gap-1 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-violet-500" />
                <span className="text-xs font-semibold text-violet-600">{pctM}%</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
