'use client'
import { useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table'
import { Download, ChevronUp, ChevronDown } from 'lucide-react'
import { exportarExcel } from '@/lib/reportes/exportar'

interface TablaPRTProps {
  datos: any[]
}

export default function TablaPRT({ datos }: TablaPRTProps) {
  const [sorting, setSorting] = useState<SortingState>([])

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'codigo',
      header: 'Código',
      cell: (info) => <span className="font-mono text-sm">{info.getValue()}</span>,
    },
    {
      accessorKey: 'centro',
      header: 'Centro Educativo',
      cell: (info) => <span className="font-medium">{info.getValue()}</span>,
    },
    {
      accessorKey: 'supervision',
      header: 'Supervisión',
      cell: (info) => <span className="text-sm">{info.getValue()}</span>,
    },
    {
      accessorKey: 'modalidad',
      header: 'Modalidad',
      cell: (info) => {
        const modalidad = info.getValue()
        const isArray = Array.isArray(modalidad)
        const text = isArray ? modalidad.join(', ') : modalidad
        return (
          <div className="flex gap-1">
            {isArray && modalidad.map((m: string) => (
              <span key={m} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">
                {m}
              </span>
            ))}
            {!isArray && <span>{text}</span>}
          </div>
        )
      },
    },
    {
      accessorKey: 'sitio_reubicacion',
      header: 'Sitio de Reubicación',
      cell: (info) => <span className="text-sm">{info.getValue()}</span>,
    },
    {
      accessorKey: 'total_estudiantes',
      header: 'Est. Presencial',
      cell: (info) => <span className="font-semibold text-blue-600">{info.getValue()}</span>,
    },
    {
      accessorKey: 'total_docentes',
      header: 'Doc. Presencial',
      cell: (info) => <span className="font-semibold text-green-600">{info.getValue()}</span>,
    },
    {
      id: 'total_virtual',
      header: 'Est. Virtual',
      cell: (info) => {
        const row = info.row.original
        const total = (row.estudiantes_virtual_ninos || 0) + (row.estudiantes_virtual_ninas || 0)
        return <span className="font-semibold text-purple-600">{total}</span>
      },
    },
    {
      accessorKey: 'condicion_uso',
      header: 'Condición',
      cell: (info) => (
        <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 text-xs rounded">
          {info.getValue()}
        </span>
      ),
    },
  ]

  const table = useReactTable({
    data: datos,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  const handleExportar = () => {
    exportarExcel(datos, 'PRT')
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <h2 className="text-xl font-bold">Tabla de Datos</h2>
        <button
          onClick={handleExportar}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <Download size={18} />
          Descargar Excel
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-2">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() && (
                        header.column.getIsSorted() === 'asc' ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, idx) => (
              <tr
                key={row.id}
                className={`border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition ${
                  idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800/50'
                }`}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-6 py-4">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400">
        Mostrando {table.getRowModel().rows.length} de {datos.length} registros
      </div>
    </div>
  )
}
