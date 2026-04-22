import { createClient } from '@/lib/supabase/server'
import NuevoUsuario    from './NuevoUsuario'
import AccionesUsuario from './AccionesUsuario'

const ROL_COLORS: Record<string, string> = {
  programador:   'bg-violet-100 text-violet-700',
  administrador: 'bg-red-100 text-red-700',
  usuario:       'bg-blue-100 text-blue-700',
}

const ROL_LABELS: Record<string, string> = {
  programador:   'Programador',
  administrador: 'Administrador',
  usuario:       'Usuario',
}

export default async function UsuariosPage() {
  const supabase = await createClient()

  const { data: usuarios } = await supabase
    .from('profiles')
    .select('*, grupos(numero)')
    .order('nombre')

  const { data: grupos } = await supabase.from('grupos').select('*').order('numero')

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Usuarios</h1>
          <p className="text-slate-500 text-sm mt-1">{usuarios?.length ?? 0} usuarios registrados</p>
        </div>
        <NuevoUsuario />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Nombre</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Correo</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Rol</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Cargo</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {usuarios?.map((u: any) => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-800">{u.nombre}</td>
                <td className="px-4 py-3 text-slate-500">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${ROL_COLORS[u.rol] ?? 'bg-slate-100 text-slate-600'}`}>
                    {ROL_LABELS[u.rol] ?? u.rol}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs">{u.cargo ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${u.activo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <AccionesUsuario
                    usuario={{
                      id:                  u.id,
                      nombre:              u.nombre,
                      email:               u.email,
                      rol:                 u.rol,
                      cargo:               u.cargo,
                      empresa:             u.empresa             ?? null,
                      empresa_supervision: u.empresa_supervision ?? null,
                      activo:              u.activo,
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
