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
    <div className="rounded-2xl p-4 h-full flex flex-col" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Personal en obra</p>

      {/* Donut centrado arriba */}
      <div className="flex justify-center">
        <div className="relative w-32 h-32">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={34}
                outerRadius={52}
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
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-xl font-bold text-[#1e2a45] dark:text-white leading-none">{total}</p>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">Total</p>
          </div>
        </div>
      </div>

      {/* Iconos con datos abajo */}
      <div className="flex gap-3 mt-4">
        {/* Hombres */}
        <div className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: 'linear-gradient(135deg,#3b82f615,#3b82f608)', border: '1px solid #3b82f630' }}>
          <IconoHombre className="w-6 h-10 text-blue-500 dark:text-blue-400 shrink-0" />
          <div>
            <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 leading-none">{hombres}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Hombres</p>
            <p className="text-[10px] font-semibold text-blue-400 dark:text-blue-500">{pctH}%</p>
          </div>
        </div>
        {/* Mujeres */}
        <div className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: 'linear-gradient(135deg,#8b5cf615,#8b5cf608)', border: '1px solid #8b5cf630' }}>
          <IconoMujer className="w-6 h-10 text-violet-500 dark:text-violet-400 shrink-0" />
          <div>
            <p className="text-2xl font-extrabold text-violet-600 dark:text-violet-400 leading-none">{mujeres}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Mujeres</p>
            <p className="text-[10px] font-semibold text-violet-400 dark:text-violet-500">{pctM}%</p>
          </div>
        </div>
      </div>
    </div>
  )
}
