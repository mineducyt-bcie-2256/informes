export default function LoadingEscuelas() {
  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-screen-xl mx-auto animate-pulse">

      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-32 bg-slate-200 rounded-lg" />
          <div className="h-4 w-48 bg-slate-100 rounded-lg" />
        </div>
        <div className="h-9 w-36 bg-slate-200 rounded-lg" />
      </div>

      {/* Buscador */}
      <div className="h-10 w-80 bg-slate-200 rounded-lg" />

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="h-10 bg-slate-50 border-b border-slate-200" />
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-slate-100">
            <div className="h-4 w-64 bg-slate-200 rounded" />
            <div className="h-4 w-20 bg-slate-100 rounded ml-auto" />
            <div className="h-4 w-32 bg-slate-100 rounded" />
            <div className="h-4 w-16 bg-slate-100 rounded" />
          </div>
        ))}
      </div>

    </div>
  )
}
