import { createClient } from '@/lib/supabase/server'
import NuevoUsuario    from './NuevoUsuario'
import AccionesUsuario from './AccionesUsuario'
import { AlertTriangle } from 'lucide-react'

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

  // Rol del usuario que está viendo la página
  const { data: { user } } = await supabase.auth.getUser()
  const { data: miPerfil } = user
    ? await supabase.from('profiles').select('rol').eq('id', user.id).single()
    : { data: null }
  const miRol = miPerfil?.rol ?? 'programador'

  const { data: usuarios } = await supabase
    .from('profiles')
    .select('*, grupos(numero)')
    .order('activo', { ascending: false })
    .order('nombre')

  const { data: grupos } = await supabase.from('grupos').select('*').order('numero')

  // Cuentas pendientes de activación (rol usuario, inactivas)
  const pendientes = usuarios?.filter(u => !u.activo && u.rol === 'usuario') ?? []

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Usuarios</h1>
          <p className="text-slate-500 text-sm mt-1">{usuarios?.length ?? 0} usuarios registrados</p>
        </div>
        <NuevoUsuario miRol={miRol} />
      </div>

      {/* Banner de cuentas pendientes */}
      {pendientes.length > 0 && (
        <div className="mb-5 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-4">
          <AlertTriangle size={18} className="text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {pendientes.length} cuenta{pendientes.length > 1 ? 's' : ''} pendiente{pendientes.length > 1 ? 's' : ''} de activación
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              {pendientes.map(u => u.nombre).join(', ')} — Actívalas desde el botón de editar (✏️) de cada fila.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Empresa / Institución</th>
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
                <td className="px-4 py-3 text-xs max-w-52">
                  {(u.empresa_supervision || u.institucion)
                    ? <span className="text-blue-600 font-medium">{u.empresa_supervision || u.institucion}</span>
                    : <span className="text-slate-300 italic">—</span>
                  }
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800">{u.nombre}</p>
                  {u.username && <p className="text-xs text-slate-400 font-mono">@{u.username}</p>}
                </td>
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
                    miRol={miRol}
                    usuario={{
                      id:                  u.id,
                      username:            u.username            ?? null,
                      nombre:              u.nombre,
                      email:               u.email,
                      rol:                 u.rol,
                      cargo:               u.cargo,
                      empresa:             u.empresa             ?? null,
                      empresa_supervision: u.empresa_supervision ?? null,
                      institucion:         u.institucion          ?? null,
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
