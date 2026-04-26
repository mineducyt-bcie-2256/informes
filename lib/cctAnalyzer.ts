// ════════════════════════════════════════════════════════════════
// ANALIZADOR DE CCT - Clasificación inteligente de hallazgos
// ════════════════════════════════════════════════════════════════

export type NivelRiesgo = 'critico' | 'alto' | 'medio' | 'bajo'

export interface Hallazgo {
  item: string
  categoria: string
  nivel: NivelRiesgo
  riesgo: string
  accion: string
}

export interface AnalisisResultado {
  resumenEjecutivo: string
  hallazgos: Hallazgo[]
  nivelGlobal: NivelRiesgo
  accionesInmediatas: string[]
}

const CRITERIOS_CRITICO = [
  'no cumple del codigo de conducta',
  'acoso sexual',
  'acoso laboral',
  'violencia fisica',
  'trabajo infantil',
  'consumo de alcohol',
  'consumo de drogas',
  'estudiantes con acceso',
  'falta total de cerramiento',
  'zanja abierta',
  'riesgo electrico',
  'falta total de epp',
  'maquinaria operando',
  'impago reiterado',
  'accidente grave',
]

const CRITERIOS_ALTO = [
  'cerramiento parcial',
  'polvo excesivo',
  'ruido severo',
  'botiquin inexistente',
  'extintor inexistente',
  'herramientas inseguras',
  'jornadas excesivas',
  'lenguaje ofensivo',
  'materiales mal almacenados',
  'rutas compartidas',
  'mecanismo de quejas',
]

const CRITERIOS_MEDIO = [
  'registros incompletos',
  'codigo no visible',
  'capacitaciones desactualizadas',
  'señalizacion insuficiente',
  'orden deficiente',
  'retraso puntual',
  'epp incompleto',
  'sanitarios deficientes',
  'coordinacion debil',
]

function clasificarNivel(cumple: boolean | null, nombre: string): NivelRiesgo {
  if (cumple === true) return 'bajo'
  if (cumple === false) {
    const texto = nombre.toLowerCase()

    // Críticos
    for (const criterio of CRITERIOS_CRITICO) {
      if (texto.includes(criterio)) return 'critico'
    }

    // Altos
    for (const criterio of CRITERIOS_ALTO) {
      if (texto.includes(criterio)) return 'alto'
    }

    // Medios
    for (const criterio of CRITERIOS_MEDIO) {
      if (texto.includes(criterio)) return 'medio'
    }

    return 'medio' // default para no cumple sin especificar
  }

  return 'bajo' // null = sin evaluar
}

function obtenerRiesgo(nivel: NivelRiesgo): string {
  const riesgos = {
    critico: 'Riesgo inminente, requiere intervención inmediata',
    alto: 'Riesgo significativo, corrección en 48 horas',
    medio: 'Deficiencia observable, corrección en 1 semana',
    bajo: 'Cumple requisitos',
  }
  return riesgos[nivel]
}

function obtenerAccion(nivel: NivelRiesgo): string {
  const acciones = {
    critico: 'DETENER actividades relacionadas hasta corrección',
    alto: 'Corrección inmediata, seguimiento diario',
    medio: 'Plan de mejora con seguimiento semanal',
    bajo: 'Mantener cumplimiento',
  }
  return acciones[nivel]
}

export function analizarCCT(
  secciones: any[],
  documentos: any[],
  comentariosGenerales: string
): AnalisisResultado {
  const hallazgos: Hallazgo[] = []
  const categoriasMap: Record<string, Hallazgo[]> = {}

  let nivelMaximo: NivelRiesgo = 'bajo'

  // Validar entrada
  if (!Array.isArray(secciones)) secciones = []
  if (!Array.isArray(documentos)) documentos = []

  // Procesar cada sección
  secciones.forEach((seccion, secIdx) => {
    if (!seccion || !seccion.titulo) return
    const titulo = seccion.titulo.replace(/\d+\.\s*/, '').trim()

    seccion.items?.forEach((item: any) => {
      const nivel = clasificarNivel(item.cumple, item.nombre)

      // Solo registrar si no cumple o no evaluado (cumple=null)
      if (item.cumple !== true) {
        const hallazgo: Hallazgo = {
          item: item.nombre,
          categoria: titulo,
          nivel,
          riesgo: obtenerRiesgo(nivel),
          accion: obtenerAccion(nivel),
        }

        hallazgos.push(hallazgo)

        if (!categoriasMap[titulo]) categoriasMap[titulo] = []
        categoriasMap[titulo].push(hallazgo)

        // Actualizar nivel global
        const nivelIdx = { critico: 0, alto: 1, medio: 2, bajo: 3 }
        if (nivelIdx[nivel] < nivelIdx[nivelMaximo]) {
          nivelMaximo = nivel
        }
      }
    })
  })

  // Documentos faltantes
  if (Array.isArray(documentos)) {
    documentos.forEach((doc: any) => {
      if (!doc || !doc.nombre) return
      if (doc.cumple === false) {
        const hallazgo: Hallazgo = {
          item: `Documento: ${doc.nombre}`,
          categoria: 'Gestión Documental / Cumplimiento BCIE',
          nivel: 'medio',
          riesgo: obtenerRiesgo('medio'),
          accion: obtenerAccion('medio'),
        }
        hallazgos.push(hallazgo)

        if (!categoriasMap['Gestión Documental / Cumplimiento BCIE']) {
          categoriasMap['Gestión Documental / Cumplimiento BCIE'] = []
        }
        categoriasMap['Gestión Documental / Cumplimiento BCIE'].push(hallazgo)
      }
    })
  }

  // Generar resumen ejecutivo
  const totalHallazgos = hallazgos.length
  const criticos = hallazgos.filter(h => h.nivel === 'critico').length
  const altos = hallazgos.filter(h => h.nivel === 'alto').length
  const medios = hallazgos.filter(h => h.nivel === 'medio').length

  const resumenEjecutivo =
    totalHallazgos === 0
      ? `Se registra cumplimiento total en la implementación del Código de Conducta de Trabajadores. El proyecto demuestra adherencia a los requisitos de conducta laboral, derechos en el trabajo, seguridad ocupacional y documentación requerida.`
      : `Se identificaron ${totalHallazgos} hallazgos en la auditoría de Código de Conducta: ${criticos > 0 ? `${criticos} crítico(s)` : ''}${altos > 0 ? `${criticos > 0 ? ', ' : ''}${altos} alto(s)` : ''}${medios > 0 ? `${criticos > 0 || altos > 0 ? ', ' : ''}${medios} medio(s)` : ''}. ${criticos > 0 ? 'Se requiere acción inmediata en hallazgos críticos.' : 'Se recomienda plan de mejora para los hallazgos identificados.'}`

  // Acciones inmediatas
  const accionesInmediatas: string[] = []

  if (criticos > 0) {
    const criticosHallazgos = hallazgos.filter(h => h.nivel === 'critico')
    criticosHallazgos.slice(0, 3).forEach(h => {
      accionesInmediatas.push(`[CRÍTICO] ${h.item}`)
    })
  }

  if (altos > 0 && accionesInmediatas.length < 3) {
    const altosHallazgos = hallazgos.filter(h => h.nivel === 'alto')
    altosHallazgos.slice(0, 3 - accionesInmediatas.length).forEach(h => {
      accionesInmediatas.push(`[ALTO] ${h.item}`)
    })
  }

  if (accionesInmediatas.length === 0 && hallazgos.length > 0) {
    accionesInmediatas.push('Implementar plan de mejora según hallazgos medios identificados')
  }

  return {
    resumenEjecutivo,
    hallazgos,
    nivelGlobal: nivelMaximo,
    accionesInmediatas,
  }
}

export function obtenerColorNivel(nivel: NivelRiesgo): string {
  const colores = {
    critico: '#dc2626',  // rojo
    alto: '#ea580c',     // naranja
    medio: '#eab308',    // amarillo
    bajo: '#16a34a',     // verde
  }
  return colores[nivel]
}

export function obtenerEmojiNivel(nivel: NivelRiesgo): string {
  const emojis = {
    critico: '🔴',
    alto: '🟠',
    medio: '🟡',
    bajo: '🟢',
  }
  return emojis[nivel]
}
