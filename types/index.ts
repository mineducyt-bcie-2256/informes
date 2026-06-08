export type Rol = 'programador' | 'administrador' | 'usuario'

export interface Profile {
  id: string
  username: string | null
  nombre: string
  email: string
  rol: Rol
  cargo: string | null
  grupo_id: number | null
  activo: boolean
  created_at: string
}

export interface Grupo {
  id: number
  numero: number
  empresa_supervision: string
}

export interface Escuela {
  id: number
  codigo: string
  nombre: string
  departamento: string
  distrito: string
  latitud: number
  longitud: number
  grupo_id: number
  empresa_obras: string
  numero_contrato: string
  empresa_supervision: string
  administrador_contrato: string
  etapa: string
  porcentaje_avance: string
  pegas_elaboracion: string
  pegas_ejecucion: string
  accidentes_acumulados: number
  reubicacion_temporal: string
  activa: boolean
  grupos?: Grupo
}

export interface Informe {
  id: string
  escuela_id: number
  periodo_mes: number
  periodo_anio: number
  creado_por: string
  estado: 'borrador' | 'enviado' | 'aprobado'
  pdf_url: string | null
  created_at: string
  updated_at: string
  escuelas?: Escuela
  profiles?: Profile
}

export const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
]

export const CONDICIONES = [
  { key: 'portada', label: 'Portada del Informe',                      short: 'PORTADA' },
  { key: 'c1317',   label: 'Generales del Informe de Supervisión',     short: 'C13-17'  },
  { key: 'hsso',    label: 'Higiene, Salud y Seguridad Ocupacional',   short: 'HSSO'    },
  { key: 'garo',    label: 'Gestión de Aguas Residuales Ordinarias',   short: 'GARO'    },
  { key: 'pgr',     label: 'Plan de Gestión de Residuos',              short: 'PGR'     },
  { key: 'mcear',   label: 'Monitoreo de Emisiones y Ruido',           short: 'MCEAR'   },
  { key: 'pppi',    label: 'Partes Interesadas',                       short: 'PPPI'    },
  { key: 'maqr',    label: 'Mecanismo de Quejas y Reclamos',           short: 'MAQR'    },
  { key: 'prt',     label: 'Plan de Reubicación Temporal',             short: 'PRT'     },
  { key: 'cct',     label: 'Código de Conducta de Trabajadores',       short: 'CCT'     },
  { key: 'cumplimiento_ambiental', label: 'Riesgos Críticos - Cumplimiento Ambiental', short: 'CUMPL.AMB' },
  { key: 'casos_especiales', label: 'Casos Especiales',                short: 'CASOS'   },
]
