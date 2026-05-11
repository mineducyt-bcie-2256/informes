export default function LoadingDashboard() {
  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-screen-xl mx-auto animate-pulse">

      {/* Encabezado */}
      <div className="space-y-2">
        <div className="h-7 w-40 bg-slate-200 rounded-lg" />
        <div className="h-4 w-64 bg-slate-100 rounded-lg" />
      </div>

      {/* Filtros */}
      <div className="flex gap-3">
        <div className="h-9 w-52 bg-slate-200 rounded-lg" />
        <div className="h-9 w-32 bg-slate-200 rounded-lg" />
        <div className="h-9 w-24 bg-slate-200 rounded-lg" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-slate-200" />
            <div className="space-y-2">
              <div className="h-7 w-12 bg-slate-200 rounded" />
              <div className="h-3 w-24 bg-slate-100 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="h-10 bg-slate-50 border-b border-slate-200" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-slate-100">
            <div className="h-4 w-48 bg-slate-200 rounded" />
            <div className="h-4 w-8 bg-slate-100 rounded ml-auto" />
            <div className="h-4 w-8 bg-slate-100 rounded" />
            <div className="h-4 w-8 bg-slate-100 rounded" />
            <div className="h-4 w-16 bg-slate-100 rounded" />
          </div>
        ))}
      </div>

    </div>
  )
}
