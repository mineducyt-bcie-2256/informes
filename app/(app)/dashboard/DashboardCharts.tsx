'use client'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const data = [
  { name: 'Aprobados', value: 0, color: '#16a34a' },
  { name: 'Enviados',  value: 0, color: '#2563eb' },
  { name: 'Borradores',value: 0, color: '#d97706' },
]

export default function DashboardCharts() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="font-semibold text-slate-800 mb-4">Estado de informes</h2>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
            {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
