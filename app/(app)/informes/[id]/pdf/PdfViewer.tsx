'use client'
import {
  PDFDownloadLink, Document, Page, Text, View, StyleSheet,
  PDFViewer, Image,
} from '@react-pdf/renderer'
import { Download, Eye } from 'lucide-react'
import { useState } from 'react'
import { analizarCCT, obtenerColorNivel } from '@/lib/cctAnalyzer'

// ═══════════════════════════════════════════════════════════════════
// PALETA Y ESTILOS
// ═══════════════════════════════════════════════════════════════════
const NAVY   = '#0f2d52'
const NAVY2  = '#1a4070'
const GOLD   = '#c8a951'
const LIGHT  = '#f1f5f9'
const BORDER = '#cbd5e1'
const MUTED  = '#64748b'
const DARK   = '#0f172a'
const GREEN  = '#16a34a'
const RED    = '#dc2626'
const AMBER  = '#d97706'

const s = StyleSheet.create({
  // ── Página ──────────────────────────────────────────────────────
  page: {
    paddingTop: 40, paddingBottom: 50, paddingHorizontal: 45,
    fontFamily: 'Helvetica', fontSize: 9, color: DARK,
    backgroundColor: '#ffffff',
  },

  // ── Footer fijo ─────────────────────────────────────────────────
  footer: {
    position: 'absolute', bottom: 18, left: 45, right: 45,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 5,
  },
  footerText: { fontSize: 7, color: MUTED },
  footerCenter: { fontSize: 7, color: MUTED, textAlign: 'center' },

  // ── Portada ─────────────────────────────────────────────────────
  coverPage: {
    padding: 0,
    backgroundColor: '#ffffff',
  },
  coverTop: {
    backgroundColor: '#ffffff',
    paddingTop: 50, paddingHorizontal: 55, paddingBottom: 0,
    alignItems: 'center',
  },
  coverLogoArea: {
    width: 90, height: 90,
    backgroundColor: NAVY,
    borderRadius: 45,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 18,
    borderWidth: 4, borderColor: '#22c55e',
  },
  coverLogoText: { color: '#ffffff', fontSize: 14, fontFamily: 'Helvetica-Bold' },
  coverLabel: { color: MUTED, fontSize: 7.5, fontFamily: 'Helvetica-Bold', letterSpacing: 2, marginBottom: 10, textAlign: 'center' },
  coverTitle: { color: NAVY, fontSize: 17, fontFamily: 'Helvetica-Bold', textAlign: 'center', lineHeight: 1.35, marginBottom: 6 },
  coverSubtitle: { color: MUTED, fontSize: 9.5, textAlign: 'center', marginBottom: 20 },
  coverDivider: { width: 50, height: 3, backgroundColor: GOLD, marginBottom: 0 },

  coverInfo: {
    backgroundColor: '#ffffff',
    marginHorizontal: 55,
    marginTop: 24,
  },
  coverInfoBlock: { marginBottom: 14 },
  coverInfoLabel: { fontSize: 7, color: MUTED, fontFamily: 'Helvetica-Bold', letterSpacing: 0.8, marginBottom: 3 },
  coverInfoValue: { fontSize: 9, color: DARK, fontFamily: 'Helvetica-Bold' },
  coverInfoSub: { fontSize: 8.5, color: NAVY2, marginTop: 2 },
  coverInfoRow: { flexDirection: 'row', marginBottom: 10, alignItems: 'flex-start' },

  coverBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    alignSelf: 'flex-start',
  },
  coverBadgeText: { fontSize: 8, fontFamily: 'Helvetica-Bold' },

  coverFooterStrip: {
    backgroundColor: NAVY,
    paddingHorizontal: 55, paddingVertical: 22,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    position: 'absolute', bottom: 0, left: 0, right: 0,
  },
  coverFooterLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 7, letterSpacing: 1 },
  coverFooterValue: { color: '#ffffff', fontSize: 8, fontFamily: 'Helvetica-Bold', marginTop: 2 },

  // ── Secciones ────────────────────────────────────────────────────
  sectionBanner: {
    backgroundColor: NAVY, paddingVertical: 7, paddingHorizontal: 12,
    marginBottom: 10, marginTop: 16, flexDirection: 'row', alignItems: 'center',
  },
  sectionNum: { color: GOLD, fontSize: 8, fontFamily: 'Helvetica-Bold', marginRight: 8, width: 20 },
  sectionTitle: { color: '#ffffff', fontSize: 10, fontFamily: 'Helvetica-Bold', flex: 1 },
  sectionBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  sectionBadgeText: { fontSize: 7, fontFamily: 'Helvetica-Bold' },

  subBanner: {
    backgroundColor: LIGHT, paddingVertical: 5, paddingHorizontal: 10,
    marginBottom: 6, marginTop: 10,
    borderLeftWidth: 3, borderLeftColor: NAVY,
  },
  subTitle: { color: NAVY, fontSize: 8, fontFamily: 'Helvetica-Bold', letterSpacing: 0.5 },

  // ── Campos ────────────────────────────────────────────────────────
  fieldRow: { flexDirection: 'row', marginBottom: 5, alignItems: 'flex-start' },
  fieldLabel: { fontSize: 8, color: MUTED, width: '38%', paddingTop: 1 },
  fieldValue: { fontSize: 8, color: DARK, flex: 1, fontFamily: 'Helvetica-Bold' },
  fieldNote: { fontSize: 7.5, color: DARK, flex: 1 },

  // ── Párrafo de texto ──────────────────────────────────────────────
  textBlock: {
    fontSize: 8.5, color: DARK, lineHeight: 1.6,
    marginBottom: 6, textAlign: 'justify',
  },
  noData: { fontSize: 8, color: MUTED, fontStyle: 'italic', marginBottom: 4 },

  // ── Tabla ────────────────────────────────────────────────────────
  table: { marginTop: 6, marginBottom: 6 },
  tableHead: { flexDirection: 'row', backgroundColor: NAVY, paddingVertical: 5, paddingHorizontal: 6 },
  tableHeadCell: { color: '#ffffff', fontSize: 7.5, fontFamily: 'Helvetica-Bold', flex: 1 },
  tableRow: { flexDirection: 'row', paddingVertical: 4, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: BORDER },
  tableRowAlt: { flexDirection: 'row', paddingVertical: 4, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: BORDER, backgroundColor: '#f8fafc' },
  tableCell: { fontSize: 7.5, color: DARK, flex: 1 },
  tableCellBold: { fontSize: 7.5, color: DARK, flex: 1, fontFamily: 'Helvetica-Bold' },

  // ── Tarjeta ───────────────────────────────────────────────────────
  card: {
    borderWidth: 1, borderColor: BORDER, borderRadius: 6,
    padding: 10, marginBottom: 8,
  },
  cardTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: NAVY, marginBottom: 5 },

  // ── Indicadores ──────────────────────────────────────────────────
  kpiRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  kpiBox: {
    flex: 1, borderWidth: 1, borderColor: BORDER, borderRadius: 6,
    padding: 10, alignItems: 'center',
  },
  kpiNum: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: NAVY, marginBottom: 2 },
  kpiLabel: { fontSize: 7, color: MUTED, textAlign: 'center' },

  // ── Dos columnas ─────────────────────────────────────────────────
  cols2: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },

  // ── Chips ────────────────────────────────────────────────────────
  chip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, alignSelf: 'flex-start' },
  chipText: { fontSize: 7, fontFamily: 'Helvetica-Bold' },
  chipGreen: { backgroundColor: '#dcfce7' },
  chipRed: { backgroundColor: '#fee2e2' },
  chipAmber: { backgroundColor: '#fef3c7' },
  chipBlue: { backgroundColor: '#dbeafe' },
})

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════
const val = (v: any, fallback = '—') =>
  v !== null && v !== undefined && v !== '' ? String(v) : fallback

const yesNo = (v: any) => v ? 'Sí' : 'No'
const yn = (v: any) => ({ text: v ? 'Sí' : 'No', color: v ? GREEN : RED })

function Field({ label, value }: { label: string; value?: any }) {
  return (
    <View style={s.fieldRow}>
      <Text style={s.fieldLabel}>{label}:</Text>
      <Text style={s.fieldNote}>{val(value)}</Text>
    </View>
  )
}

function FieldBold({ label, value }: { label: string; value?: any }) {
  return (
    <View style={s.fieldRow}>
      <Text style={s.fieldLabel}>{label}:</Text>
      <Text style={s.fieldValue}>{val(value)}</Text>
    </View>
  )
}

function SubBanner({ title }: { title: string }) {
  return (
    <View style={s.subBanner}>
      <Text style={s.subTitle}>{title.toUpperCase()}</Text>
    </View>
  )
}

function TextBlock({ text }: { text?: string | null }) {
  if (!text) return <Text style={s.noData}>Sin información registrada.</Text>
  return <Text style={s.textBlock}>{text}</Text>
}

function SiNo({ v }: { v: any }) {
  const color = v ? GREEN : MUTED
  return (
    <View style={[s.chip, { backgroundColor: v ? '#dcfce7' : '#f1f5f9' }]}>
      <Text style={[s.chipText, { color }]}>{v ? 'SÍ' : 'NO'}</Text>
    </View>
  )
}

function EstadoBadge({ estado }: { estado: string }) {
  const cfg: Record<string, { bg: string; color: string }> = {
    aprobado: { bg: '#dcfce7', color: GREEN },
    enviado:  { bg: '#dbeafe', color: '#1d4ed8' },
    borrador: { bg: '#fef3c7', color: AMBER },
  }
  const c = cfg[estado] ?? { bg: '#f1f5f9', color: MUTED }
  return (
    <View style={[s.chip, { backgroundColor: c.bg }]}>
      <Text style={[s.chipText, { color: c.color }]}>{estado.toUpperCase()}</Text>
    </View>
  )
}

// ═══════════════════════════════════════════════════════════════════
// FOOTER (fijo en todas las páginas excepto portada)
// ═══════════════════════════════════════════════════════════════════
function Footer({ escuela, periodo }: { escuela: string; periodo: string }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>{escuela}</Text>
      <Text style={s.footerCenter}>Informe de Supervisión SCAS · {periodo}</Text>
      <Text
        style={s.footerText}
        render={({ pageNumber, totalPages }) => `Pág. ${pageNumber} / ${totalPages}`}
      />
    </View>
  )
}

// ═══════════════════════════════════════════════════════════════════
// REGISTRO FOTOGRÁFICO (reutilizable en todas las secciones)
// ═══════════════════════════════════════════════════════════════════
// Contenido: 612 - 45*2 = 522pt. Dos fotos + 10 gap = (522-10)/2 = 256pt c/u
const FW = 256
const FH = 175
const FGAP = 10   // separación entre fotos
const ROW_H = FH + 18  // alto del bloque = foto + descripción

/** Inserta transformación Cloudinary para imagen ya recortada */
function cloudCrop(url: string): string {
  if (!url.includes('cloudinary.com')) return url
  return url.replace('/upload/', `/upload/w_${FW * 2},h_${FH * 2},c_fill,q_80/`)
}

function FotosGrid({ fotos }: { fotos: any[] }) {
  if (!fotos?.length) return null

  const pares: any[][] = []
  for (let i = 0; i < fotos.length; i += 2) pares.push(fotos.slice(i, i + 2))

  return (
    <>
      <SubBanner title="Registro Fotográfico" />
      {pares.map((par, ri) => (
        // Contenedor con altura fija y posicionamiento absoluto para las fotos
        <View key={ri} style={{ width: 522, height: ROW_H, marginBottom: 8, position: 'relative' }}>

          {/* Foto izquierda — posición absoluta en x=0 */}
          <Image
            src={cloudCrop(par[0].url)}
            style={{ position: 'absolute', left: 0, top: 0, width: FW, height: FH, borderRadius: 3 }}
          />
          {par[0].descripcion
            ? <Text style={{ position: 'absolute', left: 0, top: FH + 2, width: FW, fontSize: 7, color: MUTED, textAlign: 'center' }}>{par[0].descripcion}</Text>
            : null}

          {/* Foto derecha — posición absoluta en x = FW + FGAP */}
          {par[1] && (
            <Image
              src={cloudCrop(par[1].url)}
              style={{ position: 'absolute', left: FW + FGAP, top: 0, width: FW, height: FH, borderRadius: 3 }}
            />
          )}
          {par[1]?.descripcion
            ? <Text style={{ position: 'absolute', left: FW + FGAP, top: FH + 2, width: FW, fontSize: 7, color: MUTED, textAlign: 'center' }}>{par[1].descripcion}</Text>
            : null}

        </View>
      ))}
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════
// PORTADA
// ═══════════════════════════════════════════════════════════════════
function Portada({ data }: { data: any }) {
  const { esc, periodo, informe, portada } = data
  const elaboradores: any[] = informe?.elaboradores ?? []
  const estado = informe?.estado ?? 'borrador'

  const estadoCfg: Record<string, { bg: string; color: string }> = {
    aprobado: { bg: '#dcfce7', color: GREEN },
    enviado:  { bg: '#dbeafe', color: '#1d4ed8' },
    borrador: { bg: '#fef3c7', color: AMBER },
  }
  const ec = estadoCfg[estado] ?? estadoCfg.borrador

  // Elaboradores visibles en portada
  const elaVisibles = elaboradores.filter((e: any) => e.aparece_portada !== false)

  // Si no hay elaboradores en informe, usar el de portada como fallback
  const listaFinal: { nombre: string; cargo: string }[] =
    elaVisibles.length > 0
      ? elaVisibles.map((e: any) => ({ nombre: val(e.nombre), cargo: val(e.cargo, '') }))
      : portada?.elaborado_por_nombre
        ? [{ nombre: portada.elaborado_por_nombre, cargo: portada.elaborado_por_cargo ?? '' }]
        : []

  return (
    <Page size="LETTER" style={s.coverPage}>

      {/* ── Encabezado centrado ── */}
      <View style={s.coverTop}>
        <View style={s.coverLogoArea}>
          <Text style={s.coverLogoText}>BCIE</Text>
        </View>

        <Text style={s.coverLabel}>PROGRAMA DE INFRAESTRUCTURA ESCOLAR</Text>

        <Text style={s.coverTitle}>INFORME MENSUAL DE SUPERVISIÓN</Text>

        {portada?.numero_informe && (
          <View style={{ marginTop: 4, marginBottom: 2 }}>
            <Text style={{ color: GOLD, fontSize: 11, fontFamily: 'Helvetica-Bold', textAlign: 'center' }}>
              N.° {String(portada.numero_informe).padStart(3, '0')}
            </Text>
          </View>
        )}

        <Text style={[s.coverSubtitle, { marginBottom: 5, marginTop: 8, fontSize: 12 }]}>
          Implementación de condiciones ambientales y sociales
        </Text>
        <Text style={[s.coverSubtitle, { marginBottom: 5, fontSize: 11 }]}>
          Etapa de construcción
        </Text>
        <Text style={[s.coverSubtitle, { fontSize: 10.5, fontFamily: 'Helvetica-Bold', color: NAVY2, marginBottom: 18 }]}>
          Plan Específico de Gestión Ambiental y Social — PEGAS
        </Text>

        <View style={s.coverDivider} />
      </View>

      {/* ── Cuerpo ── */}
      <View style={s.coverInfo}>

        {/* 1. Nombre CE */}
        <View style={[s.coverInfoBlock, { borderLeftWidth: 4, borderLeftColor: GOLD, paddingLeft: 12, marginBottom: 14 }]}>
          <Text style={[s.coverInfoValue, { fontSize: 14, marginBottom: 6 }]}>{val(esc?.nombre)}</Text>
          {esc?.codigo && (
            <Text style={{ fontSize: 8, color: MUTED, marginBottom: 3 }}>
              <Text style={{ fontFamily: 'Helvetica-Bold', color: DARK }}>Código </Text>
              {esc.codigo}
            </Text>
          )}
          <Text style={{ fontSize: 8, color: MUTED }}>
            {[esc?.departamento, esc?.distrito].filter(Boolean).join('  ·  ')}
          </Text>
        </View>

        {/* Línea */}
        <View style={{ borderTopWidth: 1, borderTopColor: BORDER, marginBottom: 12 }} />

        {/* 2. Datos fijos del proyecto */}
        <View style={{ marginBottom: 14 }}>
          <Text style={{ fontSize: 8.5, color: DARK, marginBottom: 3 }}>
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>Proyecto: </Text>
            Préstamo BCIE No. 2256-SV
          </Text>
          <Text style={{ fontSize: 8.5, color: DARK, marginBottom: 3 }}>
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>Código de proyecto </Text>
            No. 7800
          </Text>
          <Text style={{ fontSize: 8.5, color: DARK }}>
            Programa mi Nueva Escuela de El Salvador
          </Text>
        </View>

        {/* Línea */}
        <View style={{ borderTopWidth: 1, borderTopColor: BORDER, marginBottom: 12 }} />

        {/* 3. Empresa de supervisión */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 20, marginBottom: 14 }}>
          <View style={{ flex: 1 }}>
            <Text style={s.coverInfoLabel}>EMPRESA DE SUPERVISIÓN</Text>
            <Text style={[s.coverInfoValue, { marginTop: 3 }]}>{val(esc?.empresa_supervision)}</Text>
          </View>
          {portada?.numero_contrato_supervision && (
            <View style={{ flex: 1 }}>
              <Text style={s.coverInfoLabel}>CONTRATO DE SUPERVISIÓN</Text>
              <Text style={[s.coverInfoValue, { marginTop: 3 }]}>{portada.numero_contrato_supervision}</Text>
            </View>
          )}
        </View>

        {/* Línea */}
        <View style={{ borderTopWidth: 1, borderTopColor: BORDER, marginBottom: 12 }} />

        {/* 4. Elaborado por */}
        {listaFinal.length > 0 && (
          <View style={{ marginBottom: 14 }}>
            <Text style={[s.coverInfoLabel, { marginBottom: 8 }]}>ELABORADO POR</Text>
            {listaFinal.map((esp, i) => (
              <View key={i} style={{
                marginBottom: i < listaFinal.length - 1 ? 8 : 0,
                paddingBottom: i < listaFinal.length - 1 ? 8 : 0,
                borderBottomWidth: i < listaFinal.length - 1 ? 1 : 0,
                borderBottomColor: BORDER,
              }}>
                <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: DARK, marginBottom: 2 }}>
                  {esp.nombre}
                </Text>
                {esp.cargo ? (
                  <Text style={{ fontSize: 8, color: MUTED }}>{esp.cargo}</Text>
                ) : null}
              </View>
            ))}
          </View>
        )}

        {/* Línea */}
        <View style={{ borderTopWidth: 1, borderTopColor: BORDER, marginBottom: 12 }} />

        {/* 5. Periodo / N° Informe / Estado */}
        <View style={{ flexDirection: 'row', gap: 24 }}>
          <View>
            <Text style={s.coverInfoLabel}>PERIODO</Text>
            <Text style={[s.coverInfoValue, { fontSize: 11, marginTop: 3, color: NAVY }]}>{periodo}</Text>
          </View>
          {portada?.numero_informe && (
            <View>
              <Text style={s.coverInfoLabel}>N.° DE INFORME</Text>
              <Text style={[s.coverInfoValue, { fontSize: 11, marginTop: 3, color: NAVY }]}>
                {String(portada.numero_informe).padStart(3, '0')}
              </Text>
            </View>
          )}
          <View>
            <Text style={[s.coverInfoLabel, { marginBottom: 5 }]}>ESTADO</Text>
            <View style={[s.coverBadge, { backgroundColor: ec.bg }]}>
              <Text style={[s.coverBadgeText, { color: ec.color }]}>{estado.toUpperCase()}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Franja inferior ── */}
      <View style={s.coverFooterStrip}>
        <View>
          <Text style={s.coverFooterLabel}>SISTEMA SCAS</Text>
          <Text style={s.coverFooterValue}>scas.bcie.org</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={s.coverFooterLabel}>PERIODO</Text>
          <Text style={s.coverFooterValue}>{periodo}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={s.coverFooterLabel}>N.° INFORME</Text>
          <Text style={s.coverFooterValue}>
            {portada?.numero_informe ? `N.° ${portada.numero_informe}` : 'SCAS'}
          </Text>
        </View>
      </View>
    </Page>
  )
}

// ═══════════════════════════════════════════════════════════════════
// RESUMEN EJECUTIVO (página 2)
// ═══════════════════════════════════════════════════════════════════
function ResumenEjecutivo({ data }: { data: any }) {
  const { esc, periodo, informe, hsso, garo, pgr, mcear, pppi, maqr, prt, c1317, portada } = data

  const condiciones = [
    { label: 'Portada',                            filled: !!portada },
    { label: 'Generales del Informe (C13-17)',     filled: !!c1317 },
    { label: 'Higiene, Salud y Seguridad (HSSO)',  filled: !!hsso },
    { label: 'Gestión de Aguas Residuales (GARO)', filled: !!garo },
    { label: 'Plan de Gestión de Residuos (PGR)',  filled: !!pgr },
    { label: 'Monitoreo de Emisiones (MCEAR)',     filled: !!mcear },
    { label: 'Partes Interesadas (PPPI)',          filled: !!pppi },
    { label: 'Quejas y Reclamos (MAQR)',           filled: !!maqr },
    { label: 'Reubicación Temporal (PRT)',         filled: !!prt },
  ]
  const completadas = condiciones.filter(c => c.filled).length

  const accs: any[] = hsso?.accidentes ?? []
  const totalAccidentes = accs.length

  const caps: any[] = hsso?.capacitaciones_list ?? []
  const totalPersonasCap = caps.reduce((s, c) => s + (parseInt(c.personal) || 0), 0)

  const quejas = parseInt(maqr?.cantidad_quejas) || 0
  const estudiantesPRT = parseInt(prt?.num_estudiantes) || 0

  return (
    <Page size="LETTER" style={s.page}>
      <Footer escuela={esc?.nombre ?? ''} periodo={periodo} />

      {/* Encabezado de sección */}
      <View style={{ marginBottom: 14 }}>
        <Text style={{ fontSize: 13, fontFamily: 'Helvetica-Bold', color: NAVY, marginBottom: 2 }}>
          Resumen Ejecutivo
        </Text>
        <Text style={{ fontSize: 8, color: MUTED }}>
          {esc?.nombre} · {periodo} · Estado: {informe?.estado ?? '—'}
        </Text>
        <View style={{ borderBottomWidth: 2, borderBottomColor: GOLD, marginTop: 6, width: 50 }} />
      </View>

      {/* KPIs */}
      <View style={s.kpiRow}>
        <View style={s.kpiBox}>
          <Text style={s.kpiNum}>{completadas}</Text>
          <Text style={s.kpiLabel}>Condiciones{'\n'}completadas</Text>
        </View>
        <View style={s.kpiBox}>
          <Text style={[s.kpiNum, { color: totalAccidentes > 0 ? RED : GREEN }]}>{totalAccidentes}</Text>
          <Text style={s.kpiLabel}>Accidentes{'\n'}registrados</Text>
        </View>
        <View style={s.kpiBox}>
          <Text style={s.kpiNum}>{totalPersonasCap}</Text>
          <Text style={s.kpiLabel}>Personas{'\n'}capacitadas</Text>
        </View>
        <View style={s.kpiBox}>
          <Text style={[s.kpiNum, { color: quejas > 0 ? AMBER : GREEN }]}>{quejas}</Text>
          <Text style={s.kpiLabel}>Quejas{'\n'}registradas</Text>
        </View>
        {estudiantesPRT > 0 && (
          <View style={s.kpiBox}>
            <Text style={s.kpiNum}>{estudiantesPRT}</Text>
            <Text style={s.kpiLabel}>Estudiantes{'\n'}reubicados</Text>
          </View>
        )}
      </View>

      {/* Progreso */}
      <View style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: DARK }}>
            Progreso del informe
          </Text>
          <Text style={{ fontSize: 8, color: MUTED }}>{completadas} / {condiciones.length}</Text>
        </View>
        <View style={{ height: 6, backgroundColor: LIGHT, borderRadius: 3, overflow: 'hidden' }}>
          <View style={{
            height: 6,
            width: `${(completadas / condiciones.length) * 100}%` as any,
            backgroundColor: completadas === condiciones.length ? GREEN : NAVY,
            borderRadius: 3,
          }} />
        </View>
      </View>

      {/* Tabla estado condiciones */}
      <SubBanner title="Estado de condiciones del informe" />
      <View style={s.table}>
        <View style={s.tableHead}>
          <Text style={[s.tableHeadCell, { flex: 3 }]}>Condición</Text>
          <Text style={[s.tableHeadCell, { flex: 1, textAlign: 'center' }]}>Estado</Text>
        </View>
        {condiciones.map((c, i) => (
          <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
            <Text style={[s.tableCell, { flex: 3 }]}>{c.label}</Text>
            <View style={[s.tableCell, { flex: 1, alignItems: 'center' }]}>
              <View style={[s.chip, { backgroundColor: c.filled ? '#dcfce7' : '#fee2e2' }]}>
                <Text style={[s.chipText, { color: c.filled ? GREEN : RED }]}>
                  {c.filled ? 'COMPLETADO' : 'PENDIENTE'}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Datos del proyecto */}
      <SubBanner title="Datos del proyecto" />
      <View style={s.cols2}>
        <View style={s.col}>
          <FieldBold label="Centro educativo" value={esc?.nombre} />
          <FieldBold label="Código CE" value={esc?.codigo} />
          <FieldBold label="Departamento" value={esc?.departamento} />
          <FieldBold label="Grupo" value={esc?.grupos?.numero ? `Grupo ${esc.grupos.numero}` : undefined} />
        </View>
        <View style={s.col}>
          <FieldBold label="Empresa supervisión" value={esc?.empresa_supervision} />
          <FieldBold label="Empresa contratista" value={esc?.empresa_obras} />
          <FieldBold label="N.° contrato obras" value={esc?.numero_contrato} />
          <FieldBold label="N.° contrato sup." value={portada?.numero_contrato_supervision} />
        </View>
      </View>

      {/* Personal HSSO */}
      {hsso && (
        <>
          <SubBanner title="Personal en obra (HSSO)" />
          <View style={s.kpiRow}>
            <View style={s.kpiBox}>
              <Text style={s.kpiNum}>{val(hsso.personal_hombres, '0')}</Text>
              <Text style={s.kpiLabel}>Hombres</Text>
            </View>
            <View style={s.kpiBox}>
              <Text style={s.kpiNum}>{val(hsso.personal_mujeres, '0')}</Text>
              <Text style={s.kpiLabel}>Mujeres</Text>
            </View>
            <View style={s.kpiBox}>
              <Text style={[s.kpiNum, { color: NAVY }]}>{val(hsso.personal_total, '0')}</Text>
              <Text style={s.kpiLabel}>Total</Text>
            </View>
          </View>
        </>
      )}
    </Page>
  )
}

// ═══════════════════════════════════════════════════════════════════
// GENERALES (C13-17)
// ═══════════════════════════════════════════════════════════════════
function SeccionGenerales({ data }: { data: any }) {
  const { esc, periodo, c1317 } = data
  if (!c1317) return null

  const espContratista: any[] = c1317.especialistas_contratista ?? []
  const espSupervision: any[] = c1317.especialistas_supervision ?? []

  const mapUrl: string | null = data.mapImageUrl ?? null
  const lat = esc?.latitud
  const lon = esc?.longitud

  const resolucionAmbiental = esc?.resolucion_ambiental ?? null
  const fechaRa = esc?.fecha_ra ?? (esc as any)?.fechas_de_ra ?? null

  return (
    <Page size="LETTER" style={s.page}>
      <Footer escuela={esc?.nombre ?? ''} periodo={periodo} />

      {/* Banner sección */}
      <View style={s.sectionBanner}>
        <Text style={s.sectionTitle}>Generales del Informe de Supervisión</Text>
      </View>

      {/* Introducción */}
      <SubBanner title="1. Introducción" />
      <TextBlock text={c1317.introduccion} />

      {/* Objetivo */}
      <SubBanner title="2. Objetivo" />
      <TextBlock text={c1317.objetivo} />

      {/* Alcance */}
      <SubBanner title="3. Alcance" />
      <TextBlock text={c1317.alcance} />

      {/* Ubicación */}
      <SubBanner title="4. Ubicación del Centro Educativo" />
      <View style={[s.card, { marginBottom: 8 }]}>
        <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: NAVY, marginBottom: 4 }}>
          {val(esc?.nombre)}
        </Text>
        <Text style={{ fontSize: 8, color: MUTED, marginBottom: 2 }}>
          Código: {val(esc?.codigo)}
        </Text>
        <Text style={{ fontSize: 8, color: MUTED }}>
          {[esc?.departamento, esc?.distrito].filter(Boolean).join('  ·  ') || '—'}
        </Text>
      </View>

      {/* Resolución Ambiental */}
      <SubBanner title="5. Resolución Ambiental — MARN" />
      {resolucionAmbiental ? (
        <View style={[s.card, { backgroundColor: '#f8fafc', marginBottom: 8 }]}>
          <View style={{ flexDirection: 'row', gap: 30 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 7, color: MUTED, fontFamily: 'Helvetica-Bold', letterSpacing: 0.5, marginBottom: 3 }}>
                N.° RESOLUCIÓN AMBIENTAL
              </Text>
              <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: DARK }}>
                {resolucionAmbiental}
              </Text>
            </View>
            {fechaRa && (
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 7, color: MUTED, fontFamily: 'Helvetica-Bold', letterSpacing: 0.5, marginBottom: 3 }}>
                  FECHA DE RESOLUCIÓN
                </Text>
                <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: DARK }}>
                  {fechaRa}
                </Text>
              </View>
            )}
          </View>
        </View>
      ) : (
        <Text style={s.noData}>Sin resolución ambiental registrada.</Text>
      )}

      {/* Especialistas Contratista */}
      {espContratista.length > 0 && (
        <>
          <SubBanner title="6. Especialistas — Empresa Contratista (Condición 13)" />
          <View style={s.table}>
            <View style={s.tableHead}>
              <Text style={[s.tableHeadCell, { flex: 2 }]}>Nombre</Text>
              <Text style={[s.tableHeadCell, { flex: 2 }]}>Cargo</Text>
              <Text style={[s.tableHeadCell, { flex: 1.5 }]}>Teléfono</Text>
              <Text style={[s.tableHeadCell, { flex: 2 }]}>Correo</Text>
            </View>
            {espContratista.map((e: any, i: number) => (
              <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                <Text style={[s.tableCell, { flex: 2 }]}>{val(e.nombre)}</Text>
                <Text style={[s.tableCell, { flex: 2 }]}>{val(e.cargo)}</Text>
                <Text style={[s.tableCell, { flex: 1.5 }]}>{val(e.tel)}</Text>
                <Text style={[s.tableCell, { flex: 2 }]}>{val(e.correo)}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Especialistas Supervisión */}
      {espSupervision.length > 0 && (
        <>
          <SubBanner title="7. Especialistas — Empresa de Supervisión (Condición 17)" />
          <View style={s.table}>
            <View style={s.tableHead}>
              <Text style={[s.tableHeadCell, { flex: 2 }]}>Nombre</Text>
              <Text style={[s.tableHeadCell, { flex: 2 }]}>Cargo</Text>
              <Text style={[s.tableHeadCell, { flex: 1.5 }]}>Teléfono</Text>
              <Text style={[s.tableHeadCell, { flex: 2 }]}>Correo</Text>
            </View>
            {espSupervision.map((e: any, i: number) => (
              <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                <Text style={[s.tableCell, { flex: 2 }]}>{val(e.nombre)}</Text>
                <Text style={[s.tableCell, { flex: 2 }]}>{val(e.cargo)}</Text>
                <Text style={[s.tableCell, { flex: 1.5 }]}>{val(e.tel)}</Text>
                <Text style={[s.tableCell, { flex: 2 }]}>{val(e.correo)}</Text>
              </View>
            ))}
          </View>
        </>
      )}
      <FotosGrid fotos={c1317?.fotos ?? []} />
    </Page>
  )
}

// ═══════════════════════════════════════════════════════════════════
// HSSO
// ═══════════════════════════════════════════════════════════════════
function SeccionHSSO({ data }: { data: any }) {
  const { esc, periodo, hsso } = data
  if (!hsso) return null

  const accidentes: any[]  = hsso.accidentes        ?? []
  const capacitaciones: any[] = hsso.capacitaciones_list ?? []

  return (
    <Page size="LETTER" style={s.page}>
      <Footer escuela={esc?.nombre ?? ''} periodo={periodo} />

      <View style={s.sectionBanner}>
        <Text style={s.sectionNum}>1</Text>
        <Text style={s.sectionTitle}>Condición 1 — Higiene, Salud y Seguridad Ocupacional (HSSO)</Text>
        <View style={[s.sectionBadge, { backgroundColor: !!hsso ? '#dcfce7' : '#fee2e2' }]}>
          <Text style={[s.chipText, { color: !!hsso ? GREEN : RED }]}>COMPLETADO</Text>
        </View>
      </View>

      {/* Descripción */}
      {hsso.descripcion_condicion && (
        <>
          <SubBanner title="Descripción de la condición" />
          <TextBlock text={hsso.descripcion_condicion} />
        </>
      )}

      {/* Personal */}
      <SubBanner title="Personal que labora en el proyecto" />
      <View style={s.kpiRow}>
        <View style={s.kpiBox}>
          <Text style={s.kpiNum}>{val(hsso.personal_hombres, '0')}</Text>
          <Text style={s.kpiLabel}>Hombres</Text>
        </View>
        <View style={s.kpiBox}>
          <Text style={s.kpiNum}>{val(hsso.personal_mujeres, '0')}</Text>
          <Text style={s.kpiLabel}>Mujeres</Text>
        </View>
        <View style={[s.kpiBox, { borderColor: NAVY, borderWidth: 2 }]}>
          <Text style={[s.kpiNum, { color: NAVY }]}>{val(hsso.personal_total, '0')}</Text>
          <Text style={s.kpiLabel}>Total</Text>
        </View>
      </View>

      {/* EPP */}
      <SubBanner title="Equipos de protección personal (EPP)" />
      <View style={[s.cols2, { marginBottom: 6 }]}>
        <View style={s.col}>
          <Field label="EPP entregado" value={hsso.epp_entregado} />
          <Field label="Personal cubierto" value={hsso.epp_personal_cubierto} />
        </View>
        <View style={s.col}>
          <Field label="Personal sin uso EPP" value={hsso.epp_sin_uso} />
          {hsso.epp_motivo_no_uso && <Field label="Motivo de no uso" value={hsso.epp_motivo_no_uso} />}
        </View>
      </View>
      {hsso.epp_recomendaciones && (
        <Field label="Avance / recomendaciones EPP" value={hsso.epp_recomendaciones} />
      )}

      {/* Tabla detalle EPP */}
      {(hsso.epp_items ?? []).length > 0 && (
        <>
          <SubBanner title="Detalle de EPP entregado" />
          <View style={s.table}>
            <View style={s.tableHead}>
              <Text style={[s.tableHeadCell, { flex: 2 }]}>EPP</Text>
              <Text style={[s.tableHeadCell, { flex: 2 }]}>Tipo (Área de trabajo)</Text>
              <Text style={[s.tableHeadCell, { flex: 1 }]}>Cantidad</Text>
              <Text style={[s.tableHeadCell, { flex: 1.5 }]}>Fecha entrega</Text>
              <Text style={[s.tableHeadCell, { flex: 1.5 }]}>Estado EPP</Text>
            </View>
            {(hsso.epp_items as any[]).map((item: any, i: number) => (
              <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                <Text style={[s.tableCell, { flex: 2 }]}>{val(item.epp)}</Text>
                <Text style={[s.tableCell, { flex: 2 }]}>{val(item.tipo)}</Text>
                <Text style={[s.tableCell, { flex: 1 }]}>{val(item.cantidad)}</Text>
                <Text style={[s.tableCell, { flex: 1.5 }]}>{val(item.fecha_entrega)}</Text>
                <Text style={[s.tableCell, { flex: 1.5 }]}>{val(item.estado)}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Accidentes */}
      <SubBanner title="Accidentes de trabajo" />
      {accidentes.length === 0 ? (
        <View style={[s.chip, s.chipGreen, { marginBottom: 8 }]}>
          <Text style={[s.chipText, { color: GREEN }]}>Sin accidentes registrados en el periodo</Text>
        </View>
      ) : (
        <View style={s.table}>
          <View style={s.tableHead}>
            <Text style={s.tableHeadCell}>Tipo / Gravedad</Text>
            <Text style={s.tableHeadCell}>Causa</Text>
            <Text style={[s.tableHeadCell, { flex: 2 }]}>Descripción</Text>
            <Text style={s.tableHeadCell}>Días perdidos</Text>
          </View>
          {accidentes.map((a: any, i: number) => (
            <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
              <Text style={s.tableCell}>{val(a.gravedad)}</Text>
              <Text style={s.tableCell}>{val(a.causa)}</Text>
              <Text style={[s.tableCell, { flex: 2 }]}>{val(a.descripcion)}</Text>
              <Text style={s.tableCell}>{val(a.dias_perdidos)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Capacitaciones */}
      {capacitaciones.length > 0 && (
        <>
          <SubBanner title="Capacitaciones realizadas" />
          <View style={s.table}>
            <View style={s.tableHead}>
              <Text style={[s.tableHeadCell, { flex: 3 }]}>Temática</Text>
              <Text style={[s.tableHeadCell, { flex: 1.5 }]}>Fecha</Text>
              <Text style={s.tableHeadCell}>Hombres</Text>
              <Text style={s.tableHeadCell}>Mujeres</Text>
              <Text style={s.tableHeadCell}>Total</Text>
            </View>
            {capacitaciones.map((c: any, i: number) => (
              <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                <Text style={[s.tableCell, { flex: 3 }]}>{val(c.tematica)}</Text>
                <Text style={[s.tableCell, { flex: 1.5 }]}>{val(c.fecha)}</Text>
                <Text style={s.tableCell}>{val(c.hombres, '0')}</Text>
                <Text style={s.tableCell}>{val(c.mujeres, '0')}</Text>
                <Text style={[s.tableCell, { fontFamily: 'Helvetica-Bold' }]}>{val(c.total, '0')}</Text>
              </View>
            ))}
          </View>
        </>
      )}
      <FotosGrid fotos={hsso.fotos ?? []} />
    </Page>
  )
}

// ═══════════════════════════════════════════════════════════════════
// GARO
// ═══════════════════════════════════════════════════════════════════
function SeccionGARO({ data }: { data: any }) {
  const { esc, periodo, garo, hsso } = data
  if (!garo) return null

  const unidades: any[]  = garo.unidades_sanitarias ?? []
  const usos: any[]      = garo.usos_agua           ?? []
  const obras: any[]     = garo.obras_infraestructura ?? []
  const incidentes: any[] = garo.incidentes          ?? []

  // Personal desde HSSO
  const ph = hsso?.personal_hombres ?? '—'
  const pm = hsso?.personal_mujeres ?? '—'
  const pt = hsso?.personal_total   ?? '—'

  return (
    <Page size="LETTER" style={s.page}>
      <Footer escuela={esc?.nombre ?? ''} periodo={periodo} />

      <View style={s.sectionBanner}>
        <Text style={s.sectionNum}>2</Text>
        <Text style={s.sectionTitle}>Condición 2 — Gestión de Aguas Residuales Ordinarias (GARO)</Text>
      </View>

      {/* Descripción */}
      {garo.descripcion_condicion && (
        <>
          <SubBanner title="Descripción de la condición" />
          <TextBlock text={garo.descripcion_condicion} />
        </>
      )}

      {/* Personal (tomado de HSSO) */}
      <SubBanner title="Personal en obra" />
      <View style={s.kpiRow}>
        <View style={s.kpiBox}>
          <Text style={s.kpiNum}>{ph}</Text>
          <Text style={s.kpiLabel}>Hombres</Text>
        </View>
        <View style={s.kpiBox}>
          <Text style={s.kpiNum}>{pm}</Text>
          <Text style={s.kpiLabel}>Mujeres</Text>
        </View>
        <View style={[s.kpiBox, { borderColor: NAVY, borderWidth: 2 }]}>
          <Text style={[s.kpiNum, { color: NAVY }]}>{pt}</Text>
          <Text style={s.kpiLabel}>Total</Text>
        </View>
      </View>

      {/* Unidades sanitarias */}
      {unidades.length > 0 && (() => {
        const totalH = unidades.reduce((s: number, u: any) => s + (parseInt(u.hombres) || 0), 0)
        const totalM = unidades.reduce((s: number, u: any) => s + (parseInt(u.mujeres) || 0), 0)
        const reqH   = hsso?.personal_hombres ? Math.ceil(parseInt(hsso.personal_hombres) / 20) : 0
        const reqM   = hsso?.personal_mujeres ? Math.ceil(parseInt(hsso.personal_mujeres) / 20) : 0
        const cumpleH = totalH >= reqH
        const cumpleM = totalM >= reqM
        const cumple  = cumpleH && cumpleM
        return (
          <>
            <SubBanner title="Unidades sanitarias instaladas en el proyecto" />

            {/* Criterio de cumplimiento */}
            <View style={[s.chip, cumple ? s.chipGreen : s.chipRed, { marginBottom: 6, flexDirection: 'row', gap: 16 }]}>
              <Text style={[s.chipText, { color: cumple ? GREEN : RED, fontFamily: 'Helvetica-Bold' }]}>
                {cumple ? '✓ CUMPLE con el criterio (1 unidad / 20 personas)' : '✗ NO CUMPLE con el criterio (1 unidad / 20 personas)'}
              </Text>
              <Text style={[s.chipText, { color: cumpleH ? GREEN : RED }]}>
                Hombres: {totalH} instaladas / {reqH} requeridas
              </Text>
              <Text style={[s.chipText, { color: cumpleM ? GREEN : RED }]}>
                Mujeres: {totalM} instaladas / {reqM} requeridas
              </Text>
            </View>

            <View style={s.table}>
              <View style={s.tableHead}>
                <Text style={[s.tableHeadCell, { flex: 2 }]}>Tipo</Text>
                <Text style={s.tableHeadCell}>Hombres</Text>
                <Text style={s.tableHeadCell}>Mujeres</Text>
                <Text style={s.tableHeadCell}>Total</Text>
              </View>
              {unidades.map((u: any, i: number) => (
                <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                  <Text style={[s.tableCell, { flex: 2 }]}>{val(u.tipo)}</Text>
                  <Text style={s.tableCell}>{val(u.hombres, '0')}</Text>
                  <Text style={s.tableCell}>{val(u.mujeres, '0')}</Text>
                  <Text style={[s.tableCell, { fontFamily: 'Helvetica-Bold' }]}>{val(u.total, '0')}</Text>
                </View>
              ))}
            </View>
          </>
        )
      })()}

      {/* Manejo de aguas residuales */}
      {usos.length > 0 && (
        <>
          <SubBanner title="Manejo de aguas residuales en las actividades del proyecto" />
          <View style={s.table}>
            <View style={s.tableHead}>
              <Text style={[s.tableHeadCell, { flex: 2 }]}>Procedencia del agua</Text>
              <Text style={[s.tableHeadCell, { flex: 2 }]}>Actividad</Text>
              <Text style={[s.tableHeadCell, { flex: 1 }]}>Volumen (L)</Text>
              <Text style={[s.tableHeadCell, { flex: 2 }]}>Impacto potencial</Text>
              <Text style={[s.tableHeadCell, { flex: 2 }]}>Medida de prevención</Text>
            </View>
            {usos.map((u: any, i: number) => {
              const procedencia = u.procedencia === 'Otros' ? u.procedencia_otro : u.procedencia
              const actividad   = u.actividad_cat === 'e'
                ? u.actividad_otro_texto
                : (u.actividad_especifica === 'Otros' ? u.actividad_especifica_otro : u.actividad_especifica) || u.actividad_cat
              return (
                <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                  <Text style={[s.tableCell, { flex: 2 }]}>{val(procedencia)}</Text>
                  <Text style={[s.tableCell, { flex: 2 }]}>{val(actividad)}</Text>
                  <Text style={[s.tableCell, { flex: 1 }]}>{val(u.volumen_litros, '0')}</Text>
                  <Text style={[s.tableCell, { flex: 2 }]}>{val(u.impacto_potencial)}</Text>
                  <Text style={[s.tableCell, { flex: 2 }]}>{val(u.medida_prevencion)}</Text>
                </View>
              )
            })}
          </View>
        </>
      )}

      {/* Obras de infraestructura */}
      {obras.length > 0 && (
        <>
          <SubBanner title="Mejoramiento o construcción de instalaciones para gestión de aguas residuales" />
          <View style={s.table}>
            <View style={s.tableHead}>
              <Text style={[s.tableHeadCell, { flex: 2.5 }]}>Infraestructura</Text>
              <Text style={[s.tableHeadCell, { flex: 1.5 }]}>Intervención</Text>
              <Text style={[s.tableHeadCell, { flex: 1 }]}>Avance</Text>
              <Text style={[s.tableHeadCell, { flex: 3 }]}>Descripción</Text>
            </View>
            {obras.map((o: any, i: number) => (
              <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                <Text style={[s.tableCell, { flex: 2.5 }]}>{val(o.infraestructura)}</Text>
                <Text style={[s.tableCell, { flex: 1.5 }]}>{val(o.intervencion)}</Text>
                <Text style={[s.tableCell, { flex: 1 }]}>{o.porcentaje_avance != null ? `${o.porcentaje_avance}%` : '—'}</Text>
                <Text style={[s.tableCell, { flex: 3 }]}>{val(o.descripcion)}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Incidentes */}
      <SubBanner title="Reporte de incidentes / incumplimientos" />
      <Field label="¿Se identificaron incidentes ambientales relacionados al mal manejo de aguas residuales?" value={garo.tiene_incidentes ?? '—'} />
      {incidentes.length > 0 && (
        <View style={s.table}>
          <View style={s.tableHead}>
            <Text style={[s.tableHeadCell, { flex: 1.5 }]}>Tipo</Text>
            <Text style={[s.tableHeadCell, { flex: 1.2 }]}>Ubicación</Text>
            <Text style={[s.tableHeadCell, { flex: 1.5 }]}>Fecha y hora</Text>
            <Text style={[s.tableHeadCell, { flex: 2 }]}>Descripción</Text>
            <Text style={[s.tableHeadCell, { flex: 2 }]}>Medidas correctivas</Text>
          </View>
          {incidentes.map((item: any, i: number) => (
            <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
              <Text style={[s.tableCell, { flex: 1.5 }]}>{val(item.tipo)}</Text>
              <Text style={[s.tableCell, { flex: 1.2 }]}>{val(item.ubicacion)}</Text>
              <Text style={[s.tableCell, { flex: 1.5 }]}>{val(item.fecha_hora)}</Text>
              <Text style={[s.tableCell, { flex: 2 }]}>{val(item.descripcion)}</Text>
              <Text style={[s.tableCell, { flex: 2 }]}>{val(item.medidas_correctivas)}</Text>
            </View>
          ))}
        </View>
      )}

      <FotosGrid fotos={garo.fotos ?? []} />
    </Page>
  )
}

// ═══════════════════════════════════════════════════════════════════
// PGR
// ═══════════════════════════════════════════════════════════════════
function TablaResiduos({ titulo, lista }: { titulo: string; lista: any[] }) {
  if (!lista?.length) return null
  return (
    <>
      <SubBanner title={titulo} />
      <View style={s.table}>
        <View style={s.tableHead}>
          <Text style={[s.tableHeadCell, { flex: 1.2 }]}>Categoría</Text>
          <Text style={[s.tableHeadCell, { flex: 1.5 }]}>Tipo de residuo</Text>
          <Text style={[s.tableHeadCell, { flex: 1.5 }]}>Material</Text>
          <Text style={[s.tableHeadCell, { flex: 0.8 }]}>Cantidad</Text>
          <Text style={[s.tableHeadCell, { flex: 1.5 }]}>Manejo</Text>
        </View>
        {lista.map((r: any, ri: number) =>
          (r.materiales ?? []).length > 0
            ? (r.materiales as any[]).map((m: any, mi: number) => (
              <View key={`${ri}-${mi}`} style={(ri + mi) % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                <Text style={[s.tableCell, { flex: 1.2 }]}>{mi === 0 ? val(r.categoria) : ''}</Text>
                <Text style={[s.tableCell, { flex: 1.5 }]}>{mi === 0 ? val(r.tipo_residuo) : ''}</Text>
                <Text style={[s.tableCell, { flex: 1.5 }]}>{val(m.nombre)}</Text>
                <Text style={[s.tableCell, { flex: 0.8 }]}>{m.peso_kg > 0 ? `${m.peso_kg} ${m.unidad ?? 'kg'}` : '—'}</Text>
                <Text style={[s.tableCell, { flex: 1.5 }]}>{val(m.manejo)}</Text>
              </View>
            ))
            : [(
              <View key={ri} style={ri % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                <Text style={[s.tableCell, { flex: 1.2 }]}>{val(r.categoria)}</Text>
                <Text style={[s.tableCell, { flex: 1.5 }]}>{val(r.tipo_residuo)}</Text>
                <Text style={[s.tableCell, { flex: 1.5 }]}>—</Text>
                <Text style={[s.tableCell, { flex: 0.8 }]}>—</Text>
                <Text style={[s.tableCell, { flex: 1.5 }]}>—</Text>
              </View>
            )]
        )}
      </View>
      {lista.map((r: any, ri: number) => {
        const g = r.gestion_residuos?.trim()
        const l = r.lugar_acopio?.trim()
        const s2 = r.sitio_recepcion?.trim()
        if (!g && !l && !s2) return null
        return (
          <View key={`extra-${ri}`} style={{ marginBottom: 6, padding: 6, backgroundColor: '#f8fafc', borderRadius: 4 }}>
            <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#334155', marginBottom: 4 }}>
              {r.categoria} — {r.tipo_residuo}
            </Text>
            {g ? <Field label="Gestión de los residuos" value={g} /> : null}
            {l ? <Field label="Lugar de acopio" value={l} /> : null}
            {s2 ? <Field label="Sitio de recepción para disposición final" value={s2} /> : null}
          </View>
        )
      })}
    </>
  )
}

function TablaCapacitaciones({ lista }: { lista: any[] }) {
  if (!lista?.length) return null
  return (
    <>
      <SubBanner title="Capacitaciones realizadas" />
      <View style={s.table}>
        <View style={s.tableHead}>
          <Text style={[s.tableHeadCell, { flex: 3 }]}>Temática</Text>
          <Text style={[s.tableHeadCell, { flex: 1.5 }]}>Fecha</Text>
          <Text style={s.tableHeadCell}>Hombres</Text>
          <Text style={s.tableHeadCell}>Mujeres</Text>
          <Text style={s.tableHeadCell}>Total</Text>
        </View>
        {lista.map((c: any, i: number) => (
          <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
            <Text style={[s.tableCell, { flex: 3 }]}>{val(c.tematica)}</Text>
            <Text style={[s.tableCell, { flex: 1.5 }]}>{val(c.fecha)}</Text>
            <Text style={s.tableCell}>{val(c.hombres, '0')}</Text>
            <Text style={s.tableCell}>{val(c.mujeres, '0')}</Text>
            <Text style={[s.tableCell, { fontFamily: 'Helvetica-Bold' }]}>{val(c.total, '0')}</Text>
          </View>
        ))}
      </View>
    </>
  )
}

// ── Análisis visual PGR ─────────────────────────────────────────
const CAT_COLOR: Record<string, string> = {
  Inertes:          '#94a3b8',
  'No Peligrosos':  '#22c55e',
  Peligrosos:       '#ef4444',
}
const CATS_PGR = ['Inertes', 'No Peligrosos', 'Peligrosos'] as const

function calcStatsPGR(lista: any[]) {
  const kg: Record<string, number> = { Inertes: 0, 'No Peligrosos': 0, Peligrosos: 0 }
  let m2 = 0, totalMat = 0
  for (const r of lista) {
    for (const m of r.materiales ?? []) {
      totalMat++
      if (m.unidad === 'm²') { m2 += (m.peso_kg || 0); continue }
      if (kg[r.categoria] !== undefined) kg[r.categoria] += (m.peso_kg || 0)
    }
  }
  const totalKg = CATS_PGR.reduce((s, c) => s + (kg[c] || 0), 0)
  return { kg, m2, totalMat, totalKg }
}

function ResumenPGR({ demolicion, construccion }: { demolicion: any[]; construccion: any[] }) {
  const todas = [...demolicion, ...construccion]
  if (!todas.length) return null

  const sD   = calcStatsPGR(demolicion)
  const sC   = calcStatsPGR(construccion)
  const sAll = calcStatsPGR(todas)

  const totalPeligrosos = todas.reduce((s: number, r: any) =>
    r.categoria === 'Peligrosos' ? s + (r.materiales?.length ?? 0) : s, 0)

  return (
    <>
      <SubBanner title="Resumen y análisis" />

      {/* ── KPIs ── */}
      <View style={s.kpiRow}>
        <View style={s.kpiBox}>
          <Text style={s.kpiNum}>{sAll.totalKg.toLocaleString()}</Text>
          <Text style={s.kpiLabel}>{'kg totales\nen residuos'}</Text>
        </View>
        <View style={s.kpiBox}>
          <Text style={s.kpiNum}>{sAll.totalMat}</Text>
          <Text style={s.kpiLabel}>{'materiales\nidentificados'}</Text>
        </View>
        <View style={[s.kpiBox, totalPeligrosos > 0 ? { borderColor: RED, backgroundColor: '#fff5f5' } : {}]}>
          <Text style={[s.kpiNum, { color: totalPeligrosos > 0 ? RED : MUTED }]}>{totalPeligrosos}</Text>
          <Text style={[s.kpiLabel, { color: totalPeligrosos > 0 ? RED : MUTED }]}>{'materiales\npeligrosos'}</Text>
        </View>
        {sAll.m2 > 0 && (
          <View style={[s.kpiBox, { borderColor: AMBER, backgroundColor: '#fffbeb' }]}>
            <Text style={[s.kpiNum, { color: AMBER }]}>{sAll.m2.toLocaleString()}</Text>
            <Text style={[s.kpiLabel, { color: AMBER }]}>{'m² asbesto\nidentificados'}</Text>
          </View>
        )}
      </View>

      {/* ── Distribución por categoría ── */}
      {sAll.totalKg > 0 && (
        <View style={{ marginBottom: 10 }}>
          <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: NAVY, marginBottom: 8, letterSpacing: 0.5 }}>
            DISTRIBUCIÓN TOTAL POR CATEGORÍA
          </Text>
          {CATS_PGR.map(cat => {
            const kg = sAll.kg[cat] || 0
            if (kg === 0) return null
            const pct = Math.max(1, Math.round((kg / sAll.totalKg) * 100))
            return (
              <View key={cat} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 7 }}>
                <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: CAT_COLOR[cat], marginRight: 8 }} />
                <Text style={{ fontSize: 7.5, width: 88 }}>{cat}</Text>
                <View style={{ flex: 1, height: 12, backgroundColor: '#f1f5f9', borderRadius: 3, marginRight: 10 }}>
                  <View style={{ width: `${pct}%`, height: 12, backgroundColor: CAT_COLOR[cat], borderRadius: 3 }} />
                </View>
                <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', width: 90, textAlign: 'right', color: DARK }}>
                  {kg.toLocaleString()} kg · {pct}%
                </Text>
              </View>
            )
          })}
          {sAll.m2 > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 7 }}>
              <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: AMBER, marginRight: 8 }} />
              <Text style={{ fontSize: 7.5, width: 88 }}>Asbesto</Text>
              <View style={{ flex: 1, height: 12, backgroundColor: '#fffbeb', borderRadius: 3, marginRight: 10 }}>
                <Text style={{ fontSize: 7, color: AMBER, paddingLeft: 4, paddingTop: 2 }}>medido en m²</Text>
              </View>
              <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', width: 90, textAlign: 'right', color: AMBER }}>
                {sAll.m2.toLocaleString()} m²
              </Text>
            </View>
          )}
        </View>
      )}

      {/* ── Comparativo por etapa ── */}
      {demolicion.length > 0 && construccion.length > 0 && (
        <>
          <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: NAVY, marginBottom: 8, letterSpacing: 0.5 }}>
            COMPARATIVO POR ETAPA
          </Text>
          <View style={s.cols2}>
            {([
              { label: 'Demolición y Desmontaje', st: sD },
              { label: 'Construcción', st: sC },
            ] as { label: string; st: ReturnType<typeof calcStatsPGR> }[]).map(({ label, st }) => (
              <View key={label} style={s.card}>
                <Text style={[s.cardTitle, { marginBottom: 8 }]}>{label}</Text>
                {CATS_PGR.map(cat => {
                  const kg = st.kg[cat] || 0
                  if (kg === 0) return null
                  const pct = st.totalKg > 0 ? Math.max(2, Math.round((kg / st.totalKg) * 100)) : 0
                  return (
                    <View key={cat} style={{ marginBottom: 7 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <View style={{ width: 6, height: 6, borderRadius: 1, backgroundColor: CAT_COLOR[cat], marginRight: 4 }} />
                          <Text style={{ fontSize: 7, color: MUTED }}>{cat}</Text>
                        </View>
                        <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold' }}>{kg.toLocaleString()} kg</Text>
                      </View>
                      <View style={{ height: 7, backgroundColor: '#f1f5f9', borderRadius: 3 }}>
                        <View style={{ width: `${pct}%`, height: 7, backgroundColor: CAT_COLOR[cat], borderRadius: 3 }} />
                      </View>
                    </View>
                  )
                })}
                <View style={{ borderTopWidth: 1, borderTopColor: BORDER, marginTop: 4, paddingTop: 5 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: NAVY }}>
                      {st.totalKg.toLocaleString()} kg{st.m2 > 0 ? ` · ${st.m2} m²` : ''}
                    </Text>
                    <Text style={{ fontSize: 7, color: MUTED }}>{st.totalMat} materiales</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </>
      )}
    </>
  )
}

function SeccionPGR({ data }: { data: any }) {
  const { esc, periodo, pgr } = data
  if (!pgr) return null

  return (
    <Page size="LETTER" style={s.page}>
      <Footer escuela={esc?.nombre ?? ''} periodo={periodo} />
      <View style={s.sectionBanner}>
        <Text style={s.sectionNum}>3</Text>
        <Text style={s.sectionTitle}>Condición 3 — Plan de Gestión de Residuos (PGR)</Text>
      </View>

      {pgr.descripcion_condicion && (
        <><SubBanner title="Descripción de la condición" /><TextBlock text={pgr.descripcion_condicion} /></>
      )}

      <ResumenPGR
        demolicion={pgr.residuos_demolicion ?? []}
        construccion={pgr.residuos_construccion ?? []}
      />

      <TablaResiduos titulo="Residuos de demolición y desmontaje" lista={pgr.residuos_demolicion ?? []} />
      <TablaResiduos titulo="Residuos de construcción" lista={pgr.residuos_construccion ?? []} />
      <TablaCapacitaciones lista={pgr.capacitaciones_list ?? []} />

      {pgr.observaciones && (
        <><SubBanner title="Observaciones" /><TextBlock text={pgr.observaciones} /></>
      )}
      <FotosGrid fotos={pgr.fotos ?? []} />
    </Page>
  )
}

// ═══════════════════════════════════════════════════════════════════
// MCEAR — helpers de clasificación
// ═══════════════════════════════════════════════════════════════════
type ClasifMCEAR = { categoria: string; color: string; detalle: string }

const CLASIF_COL: Record<string, { fill: string; bg: string }> = {
  green:  { fill: '#16a34a', bg: '#dcfce7' },
  lime:   { fill: '#65a30d', bg: '#ecfccb' },
  yellow: { fill: '#b45309', bg: '#fef9c3' },
  orange: { fill: '#c2410c', bg: '#ffedd5' },
  red:    { fill: '#dc2626', bg: '#fee2e2' },
  purple: { fill: '#7e22ce', bg: '#f3e8ff' },
  brown:  { fill: '#78716c', bg: '#f5f5f4' },
}

function cPM10(v: number): ClasifMCEAR {
  if (v <= 20)  return { categoria: 'Buena',               color: 'green',  detalle: 'Sin riesgo para la salud' }
  if (v <= 40)  return { categoria: 'Aceptable',           color: 'lime',   detalle: 'Afecta ligeramente a sensibles' }
  if (v <= 75)  return { categoria: 'Regular',             color: 'yellow', detalle: 'Precaución para grupos vulnerables' }
  if (v <= 150) return { categoria: 'Mala',                color: 'orange', detalle: 'Efectos adversos leves a moderados' }
  if (v <= 250) return { categoria: 'Muy mala',            color: 'red',    detalle: 'Riesgo claro a la salud' }
  return               { categoria: 'Extremadamente mala', color: 'brown',  detalle: 'Riesgo grave para la salud' }
}
function cPM25(v: number): ClasifMCEAR {
  if (v <= 12.0)  return { categoria: 'Buena',                       color: 'green',  detalle: 'Aire limpio, sin riesgo' }
  if (v <= 35.4)  return { categoria: 'Moderada',                    color: 'yellow', detalle: 'Riesgo para grupos sensibles' }
  if (v <= 55.4)  return { categoria: 'No saludable p/sensibles',    color: 'orange', detalle: 'Riesgo para niños y ancianos' }
  if (v <= 150.4) return { categoria: 'No saludable',                color: 'red',    detalle: 'Afecta a la mayoría' }
  if (v <= 250.4) return { categoria: 'Muy no saludable',            color: 'purple', detalle: 'Riesgo serio para todos' }
  return                 { categoria: 'Peligrosa',                   color: 'brown',  detalle: 'Emergencia sanitaria' }
}
function cICA(v: number): ClasifMCEAR {
  if (v <= 50)  return { categoria: 'Buena',                    color: 'green',  detalle: 'Sin riesgo' }
  if (v <= 100) return { categoria: 'Moderada',                 color: 'yellow', detalle: 'Afecta a personas sensibles' }
  if (v <= 150) return { categoria: 'No saludable p/sensibles', color: 'orange', detalle: 'Riesgo para asmáticos y niños' }
  if (v <= 200) return { categoria: 'No saludable',             color: 'red',    detalle: 'Riesgo para la población general' }
  if (v <= 300) return { categoria: 'Muy no saludable',         color: 'purple', detalle: 'Mayor riesgo para todos' }
  return               { categoria: 'Peligrosa',                color: 'brown',  detalle: 'Emergencia sanitaria' }
}
function cCO2(v: number): ClasifMCEAR {
  if (v <= 700)   return { categoria: 'Excelente',             color: 'green',  detalle: 'Nivel cercano al aire exterior' }
  if (v <= 1000)  return { categoria: 'Aceptable',             color: 'lime',   detalle: 'Ventilación adecuada' }
  if (v <= 1500)  return { categoria: 'Moderada',              color: 'yellow', detalle: 'Posible incomodidad' }
  if (v <= 2000)  return { categoria: 'Deficiente',            color: 'orange', detalle: 'Necesario ventilar' }
  if (v <= 5000)  return { categoria: 'Pobre / Riesgosa',      color: 'red',    detalle: 'Afectación del desempeño' }
  if (v <= 10000) return { categoria: 'Máx. exposición',       color: 'purple', detalle: 'Límite laboral OSHA/NIOSH' }
  return                 { categoria: 'Nivel peligroso',       color: 'brown',  detalle: 'Efectos fisiológicos graves' }
}
function cRuido(v: number): ClasifMCEAR {
  if (v <= 40)  return { categoria: 'Muy silencioso',     color: 'green',  detalle: 'Ambiente muy tranquilo' }
  if (v <= 50)  return { categoria: 'Silencioso',         color: 'lime',   detalle: 'Ambiente tranquilo' }
  if (v <= 60)  return { categoria: 'Aceptable',          color: 'yellow', detalle: 'Dentro de rangos normales' }
  if (v <= 70)  return { categoria: 'Algo molesto',       color: 'orange', detalle: 'Puede generar incomodidad' }
  if (v <= 85)  return { categoria: 'Riesgo prolongado',  color: 'red',    detalle: 'Exposición prolongada es dañina' }
  if (v <= 100) return { categoria: 'Riesgo auditivo',    color: 'purple', detalle: 'Protección auditiva obligatoria' }
  return               { categoria: 'Daño inmediato',     color: 'brown',  detalle: 'Riesgo severo' }
}

/** Barra gauge con valor, clasificación y descripción */
function GaugeMCEAR({ label, value, unit, fn, max }: {
  label: string; value: string; unit: string
  fn: (v: number) => ClasifMCEAR; max: number
}) {
  const num = parseFloat(value)
  if (!value || isNaN(num)) return null
  const c   = fn(num)
  const col = CLASIF_COL[c.color]
  const pct = Math.min(100, Math.max(2, Math.round((num / max) * 100)))
  return (
    <View style={{ marginBottom: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
        <Text style={{ fontSize: 7.5, color: MUTED }}>{label}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: DARK }}>
            {num}{unit ? ` ${unit}` : ''}
          </Text>
          <View style={{ backgroundColor: col.bg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 7 }}>
            <Text style={{ fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: col.fill }}>{c.categoria}</Text>
          </View>
        </View>
      </View>
      <View style={{ height: 8, backgroundColor: '#f1f5f9', borderRadius: 4 }}>
        <View style={{ width: `${pct}%`, height: 8, backgroundColor: col.fill, borderRadius: 4 }} />
      </View>
      <Text style={{ fontSize: 6, color: MUTED, marginTop: 2 }}>{c.detalle}</Text>
    </View>
  )
}

/** Fila de campo con chip de clasificación inline */
function FieldClasif({ label, value, clasif }: { label: string; value: string; clasif: ClasifMCEAR }) {
  const col = CLASIF_COL[clasif.color]
  return (
    <View style={[s.fieldRow, { alignItems: 'center' }]}>
      <Text style={s.fieldLabel}>{label}:</Text>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: DARK }}>{value}</Text>
        <View style={{ backgroundColor: col.bg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 7 }}>
          <Text style={{ fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: col.fill }}>{clasif.categoria}</Text>
        </View>
        <Text style={{ fontSize: 7, color: MUTED, flex: 1 }}>{clasif.detalle}</Text>
      </View>
    </View>
  )
}

// ═══════════════════════════════════════════════════════════════════
// MCEAR — sección PDF
// ═══════════════════════════════════════════════════════════════════
function SeccionMCEAR({ data }: { data: any }) {
  const { esc, periodo, mcear } = data
  if (!mcear) return null

  const medAire: any[]     = mcear.mediciones_aire     ?? []
  const medAcustica: any[] = mcear.mediciones_acustica ?? []
  const acustica            = medAcustica[0]

  const AIRE_LABEL: Record<string, string> = {
    material_particulado: 'Material Particulado',
    emisiones:            'Emisiones de fuentes móviles y fijas',
    cov:                  'Compuestos Orgánicos Volátiles (COV)',
  }

  const medConValores = medAire.filter((m: any) => !m.no_registrado && (m.pm10 || m.pm25 || m.ica || m.co2))
  const hayAcustica   = acustica && !acustica.no_registrado && acustica.db

  return (
    <Page size="LETTER" style={s.page}>
      <Footer escuela={esc?.nombre ?? ''} periodo={periodo} />
      <View style={s.sectionBanner}>
        <Text style={s.sectionNum}>4</Text>
        <Text style={s.sectionTitle}>Condición 4 — Monitoreo de Calidad de Emisiones y Ruido (MCEAR)</Text>
      </View>

      {mcear.descripcion_condicion && (
        <><SubBanner title="Descripción de la condición" /><TextBlock text={mcear.descripcion_condicion} /></>
      )}

      {/* ══ PANEL DE INDICADORES ══ */}
      {(medConValores.length > 0 || hayAcustica) && (
        <>
          <SubBanner title="Panel de indicadores ambientales" />
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>

            {/* Columna: Calidad del Aire */}
            {medConValores.length > 0 && (
              <View style={[s.card, { flex: 1 }]}>
                <Text style={[s.cardTitle, { marginBottom: 8 }]}>Calidad del Aire</Text>
                {medConValores.map((m: any, i: number) => (
                  <View key={i} style={i > 0 ? { borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 8, marginTop: 4 } : {}}>
                    {medConValores.length > 1 && (
                      <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: NAVY2, marginBottom: 5 }}>
                        {AIRE_LABEL[m.clasificacion] ?? m.clasificacion}
                      </Text>
                    )}
                    <GaugeMCEAR label="PM10" value={m.pm10} unit="µg/m³" fn={cPM10} max={300} />
                    <GaugeMCEAR label="PM2.5" value={m.pm25} unit="µg/m³" fn={cPM25} max={300} />
                    <GaugeMCEAR label="ICA" value={m.ica} unit="" fn={cICA} max={500} />
                    <GaugeMCEAR label="CO₂" value={m.co2} unit="ppm" fn={cCO2} max={5000} />
                  </View>
                ))}
              </View>
            )}

            {/* Columna: Acústica */}
            {hayAcustica && (
              <View style={[s.card, { flex: 1 }]}>
                <Text style={[s.cardTitle, { marginBottom: 8 }]}>Contaminación Acústica</Text>
                <GaugeMCEAR label="Nivel de ruido" value={acustica.db} unit="dB" fn={cRuido} max={120} />
                {acustica.fuentes?.length > 0 && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={{ fontSize: 6.5, color: MUTED, marginBottom: 5 }}>Fuentes generadoras:</Text>
                    {(acustica.fuentes as string[]).map((f, fi) => (
                      <View key={fi} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
                        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#7e22ce', marginRight: 6 }} />
                        <Text style={{ fontSize: 7, color: DARK }}>{f}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        </>
      )}

      {/* ══ CALIDAD DEL AIRE — DETALLE ══ */}
      {medAire.length > 0 && (
        <>
          <SubBanner title="Calidad del Aire — Detalle por clasificación" />
          {medAire.map((m: any, i: number) => (
            <View key={i} style={[s.card, { marginBottom: 6 }]}>
              {/* Encabezado con chip de estado */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                <Text style={s.cardTitle}>{AIRE_LABEL[m.clasificacion] ?? m.clasificacion}</Text>
                {m.no_registrado
                  ? <View style={[s.chip, s.chipAmber]}><Text style={[s.chipText, { color: AMBER }]}>No registrado</Text></View>
                  : <View style={[s.chip, s.chipGreen]}><Text style={[s.chipText, { color: GREEN }]}>Registrado</Text></View>
                }
              </View>

              {m.no_registrado ? (
                <Field label="Motivo de no registro" value={m.motivo_no_registro} />
              ) : (
                <>
                  {/* Actividades generadoras */}
                  {m.actividades?.length > 0 && (
                    <Field
                      label="Actividades generadoras"
                      value={[
                        ...m.actividades.filter((a: string) => a !== 'Otros'),
                        ...(m.actividades.includes('Otros') && m.actividades_otro ? [`Otros: ${m.actividades_otro}`] : []),
                      ].join(' · ')}
                    />
                  )}

                  {/* Parámetros con clasificación */}
                  {m.pm10 && <FieldClasif label="PM10 (µg/m³)" value={m.pm10} clasif={cPM10(parseFloat(m.pm10))} />}
                  {m.pm25 && <FieldClasif label="PM2.5 (µg/m³)" value={m.pm25} clasif={cPM25(parseFloat(m.pm25))} />}
                  {m.ica  && <FieldClasif label="ICA" value={m.ica} clasif={cICA(parseFloat(m.ica))} />}
                  {m.co2  && <FieldClasif label="CO₂ (ppm)" value={m.co2} clasif={cCO2(parseFloat(m.co2))} />}

                  {/* Equipo y medidas */}
                  {m.equipo_tecnica      && <Field label="Equipo y técnica" value={m.equipo_tecnica} />}
                  {m.medidas_ambientales && <Field label="Medidas ambientales y de seguridad" value={m.medidas_ambientales} />}
                </>
              )}
            </View>
          ))}
        </>
      )}

      {/* ══ CONTAMINACIÓN ACÚSTICA — DETALLE ══ */}
      {acustica && (
        <>
          <SubBanner title="Contaminación Acústica — Detalle" />
          <View style={s.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
              <Text style={s.cardTitle}>Contaminación acústica</Text>
              {acustica.no_registrado
                ? <View style={[s.chip, s.chipAmber]}><Text style={[s.chipText, { color: AMBER }]}>No registrado</Text></View>
                : <View style={[s.chip, s.chipGreen]}><Text style={[s.chipText, { color: GREEN }]}>Registrado</Text></View>
              }
            </View>
            {acustica.no_registrado ? (
              <Field label="Motivo de no registro" value={acustica.motivo_no_registro} />
            ) : (
              <>
                {acustica.fuentes?.length > 0 && (
                  <Field label="Fuentes de ruido" value={(acustica.fuentes as string[]).join(' · ')} />
                )}
                {acustica.db && (
                  <FieldClasif label="Nivel de ruido (dB)" value={`${acustica.db} dB`} clasif={cRuido(parseFloat(acustica.db))} />
                )}
                {acustica.equipo_tecnica      && <Field label="Equipo y técnica" value={acustica.equipo_tecnica} />}
                {acustica.medidas_ambientales && <Field label="Medidas ambientales y de seguridad" value={acustica.medidas_ambientales} />}
              </>
            )}
          </View>
        </>
      )}

      <FotosGrid fotos={mcear.fotos ?? []} />
    </Page>
  )
}

// ═══════════════════════════════════════════════════════════════════
// PPPI — helpers
// ═══════════════════════════════════════════════════════════════════
const MESES_PDF = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
function mesLbl(mes: number, anio: number) { return `${MESES_PDF[(mes ?? 1) - 1]} ${anio}` }

function BarraGenero({ hombres, mujeres, height = 10 }: { hombres: number; mujeres: number; height?: number }) {
  const total = hombres + mujeres
  if (!total) return null
  const pH = Math.max(2, Math.round((hombres / total) * 100))
  const pM = 100 - pH
  return (
    <View style={{ flexDirection: 'row', height, borderRadius: 4, overflow: 'hidden' }}>
      <View style={{ width: `${pH}%`, height, backgroundColor: '#3b82f6' }} />
      <View style={{ width: `${pM}%`, height, backgroundColor: '#ec4899' }} />
    </View>
  )
}

function LeyendaGenero({ hombres, mujeres }: { hombres: number; mujeres: number }) {
  const total = hombres + mujeres
  const pH = total ? Math.round((hombres / total) * 100) : 0
  const pM = total ? Math.round((mujeres / total) * 100) : 0
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <View style={{ width: 8, height: 8, backgroundColor: '#3b82f6', borderRadius: 2 }} />
        <Text style={{ fontSize: 6.5, color: MUTED }}>Hombres: {hombres} ({pH}%)</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <View style={{ width: 8, height: 8, backgroundColor: '#ec4899', borderRadius: 2 }} />
        <Text style={{ fontSize: 6.5, color: MUTED }}>Mujeres: {mujeres} ({pM}%)</Text>
      </View>
    </View>
  )
}

// Barra horizontal de tendencia para gráficos
function TrendBar({ label, value, max, color, suffix = '' }: {
  label: string; value: number; max: number; color: string; suffix?: string
}) {
  const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 6 }}>
      <Text style={{ fontSize: 6.5, color: MUTED, width: 38, textAlign: 'right' }}>{label}</Text>
      <View style={{ flex: 1, height: 10, backgroundColor: '#f1f5f9', borderRadius: 3 }}>
        <View style={{ width: `${pct}%`, height: 10, backgroundColor: color, borderRadius: 3 }} />
      </View>
      <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color, width: 28, textAlign: 'right' }}>
        {value}{suffix}
      </Text>
    </View>
  )
}

// Chip de semáforo
function Semaforo({ label, ok, warn }: { label: string; ok: boolean | null; warn?: boolean }) {
  const bg = ok === null ? '#f1f5f9' : ok ? '#dcfce7' : warn ? '#fef9c3' : '#fee2e2'
  const fg = ok === null ? MUTED : ok ? '#15803d' : warn ? '#a16207' : '#b91c1c'
  const dot = ok === null ? '●' : ok ? '✓' : '✗'
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 5 }}>
      <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: fg }}>{dot}</Text>
      </View>
      <Text style={{ fontSize: 7.5, color: fg, flex: 1 }}>{label}</Text>
    </View>
  )
}

// Caja de análisis / interpretación
function AnalysisBox({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ backgroundColor: '#f8fafc', borderLeftWidth: 3, borderLeftColor: NAVY,
      paddingHorizontal: 10, paddingVertical: 7, borderRadius: 4, marginTop: 6 }}>
      {children}
    </View>
  )
}

// ═══════════════════════════════════════════════════════════════════
// PPPI
// ═══════════════════════════════════════════════════════════════════
function SeccionPPPI({ data }: { data: any }) {
  const { esc, periodo, pppi } = data
  if (!pppi) return null

  const partes: any  = pppi.partes_interesadas ?? {}
  const caps: any[]  = pppi.capacitaciones_list ?? []
  const ind: any     = pppi.indicadores_impacto ?? {}
  const infra: any   = ind.infraestructura ?? {}

  // Combina partes fijas + custom, tomando el label guardado para custom
  const PARTES_FIJAS_PDF = [
    { key: 'alumnos', label: 'Alumnos' },
    { key: 'profesores', label: 'Profesores' },
    { key: 'director', label: 'Director' },
    { key: 'cde', label: 'CDE' },
  ]
  const todasPartesKeys = [
    ...PARTES_FIJAS_PDF.map(p => ({ key: p.key, label: p.label })),
    ...Object.keys(partes)
      .filter(k => !PARTES_FIJAS_PDF.map(p => p.key).includes(k))
      .map(k => ({ key: k, label: partes[k]?.label || 'Otro' })),
  ]
  const partesActivas = todasPartesKeys.filter(p => partes[p.key]?.activa)
  const totalPartesH  = partesActivas.reduce((s, p) => s + (partes[p.key]?.hombres ?? 0), 0)
  const totalPartesM  = partesActivas.reduce((s, p) => s + (partes[p.key]?.mujeres ?? 0), 0)

  const matriculas: any[]    = ind.matricula          ?? []
  const asistencias: any[]   = ind.asistencia         ?? []
  const inasistencias: any[] = ind.inasistencias      ?? []
  const deserciones: any[]   = ind.deserciones        ?? []
  const diasEsc: any[]       = ind.dias_escolares     ?? []
  const emplDir: any[]       = ind.empleos_directos   ?? []
  const emplInd: any[]       = ind.empleos_indirectos ?? []

  // Matrícula total (año más reciente)
  const matActual = matriculas.length > 0
    ? [...matriculas].sort((a: any, b: any) => b.anio - a.anio)[0] : null
  const matriculaTotal = matActual ? (matActual.ninos + matActual.ninas) : 0

  // Hacinamiento
  const estudxAula = infra.aulas_en_uso > 0 && matriculaTotal > 0
    ? matriculaTotal / infra.aulas_en_uso : null
  const hayHacinamiento = estudxAula !== null && estudxAula > 35

  // IPE
  const ipeInds = [
    { label: 'Sin agua potable',             val: infra.agua_potable ? (infra.agua_potable === 'No' ? 1 : 0) : null },
    { label: 'Sin internet',                  val: infra.internet ? (infra.internet === 'No' ? 1 : 0) : null },
    { label: 'Hacinamiento (>35 est/aula)',   val: estudxAula !== null ? (hayHacinamiento ? 1 : 0) : null },
    { label: 'Estado estructural deficiente', val: infra.estado_estructural ? (infra.estado_estructural !== 'Bueno' ? 1 : 0) : null },
  ].filter(i => i.val !== null) as { label: string; val: number }[]

  const sumaIPE  = ipeInds.reduce((s, i) => s + i.val, 0)
  const ipe      = ipeInds.length > 0 ? sumaIPE / ipeInds.length : null
  const ipeColor = ipe === null ? MUTED : ipe === 0 ? GREEN : ipe <= 0.25 ? '#16a34a' : ipe <= 0.5 ? '#ca8a04' : ipe <= 0.75 ? '#c2410c' : '#dc2626'
  const ipeLabel = ipe === null ? '—' : ipe === 0 ? 'Sin privaciones' : ipe <= 0.25 ? 'Leve' : ipe <= 0.5 ? 'Moderada' : ipe <= 0.75 ? 'Severa' : 'Crítica'

  // Meses unificados
  const mesesSet = new Set([
    ...asistencias.map((r: any) => `${r.anio}-${String(r.mes).padStart(2,'0')}`),
    ...inasistencias.map((r: any) => `${r.anio}-${String(r.mes).padStart(2,'0')}`),
    ...deserciones.map((r: any) => `${r.anio}-${String(r.mes).padStart(2,'0')}`),
  ])
  const mesesOrdenados = Array.from(mesesSet).sort().map(k => {
    const [anioStr, mesStr] = k.split('-')
    return { mes: parseInt(mesStr), anio: parseInt(anioStr) }
  })

  // Totales empleo
  const totDirH = emplDir.reduce((s: number, e: any) => s + (e.hombres ?? 0), 0)
  const totDirM = emplDir.reduce((s: number, e: any) => s + (e.mujeres ?? 0), 0)
  const totIndH = emplInd.reduce((s: number, e: any) => s + (e.hombres ?? 0), 0)
  const totIndM = emplInd.reduce((s: number, e: any) => s + (e.mujeres ?? 0), 0)
  const emplDirSorted = [...emplDir].sort((a: any, b: any) => a.anio !== b.anio ? a.anio - b.anio : a.mes - b.mes)
  const emplIndSorted = [...emplInd].sort((a: any, b: any) => a.anio !== b.anio ? a.anio - b.anio : a.mes - b.mes)
  const ultimoDir = emplDirSorted[emplDirSorted.length - 1]
  const maxEmplDir = Math.max(...emplDirSorted.map((e: any) => (e.hombres ?? 0) + (e.mujeres ?? 0)), 1)
  const maxEmplInd = Math.max(...emplIndSorted.map((e: any) => (e.hombres ?? 0) + (e.mujeres ?? 0)), 1)

  // Max tasa deserción y asistencia para escalar barras
  const maxTasaDes = Math.max(
    ...mesesOrdenados.map(({ mes, anio }) => {
      const des = deserciones.find((r: any) => r.mes === mes && r.anio === anio)
      return matriculaTotal > 0 && des?.cantidad ? (des.cantidad / matriculaTotal) * 100 : 0
    }), 1
  )
  const maxAsist = Math.max(
    ...mesesOrdenados.map(({ mes, anio }) => {
      const a = asistencias.find((r: any) => r.mes === mes && r.anio === anio)
      return a ? (a.ninos + a.ninas) : 0
    }), 1
  )

  const tieneIndicadores = matriculas.length > 0 || mesesOrdenados.length > 0 || ipeInds.length > 0 ||
    !!(infra.agua_potable || infra.aulas_en_uso > 0 || infra.energia_electrica || diasEsc.length > 0) ||
    emplDir.length > 0 || emplInd.length > 0

  // Helper: tarjeta de semáforo individual
  function SemaforoCard({ label, valor, ok }: { label: string; valor: string; ok: boolean | null }) {
    const bg = ok === null ? '#f1f5f9' : ok ? '#dcfce7' : '#fee2e2'
    const fg = ok === null ? MUTED    : ok ? '#15803d' : '#b91c1c'
    const ic = ok === null ? '–'      : ok ? '✓'       : '✗'
    return (
      <View style={{ flex: 1, minWidth: '22%', backgroundColor: bg, borderRadius: 6, padding: 8,
        alignItems: 'center', borderTopWidth: 3, borderTopColor: ok === null ? BORDER : ok ? '#16a34a' : RED }}>
        <Text style={{ fontSize: 13, fontFamily: 'Helvetica-Bold', color: fg, marginBottom: 3 }}>{ic}</Text>
        <Text style={{ fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: fg, textAlign: 'center', marginBottom: 2 }}>{label}</Text>
        <Text style={{ fontSize: 6.5, color: fg, textAlign: 'center' }}>{valor || 'No informado'}</Text>
      </View>
    )
  }

  return (
    <>
    {/* ══ Página principal: desc → partes → soc → caps → fotos (flujo continuo) ══ */}
    <Page size="LETTER" style={s.page}>
      <Footer escuela={esc?.nombre ?? ''} periodo={periodo} />
      <View style={s.sectionBanner}>
        <Text style={s.sectionNum}>5</Text>
        <Text style={s.sectionTitle}>Condición 5 — Plan de Participación de Partes Interesadas (PPPI)</Text>
      </View>

      {/* 1. Descripción de la condición */}
      {pppi.descripcion_condicion && (
        <><SubBanner title="Descripción de la condición" /><TextBlock text={pppi.descripcion_condicion} /></>
      )}

      {/* 2. Partes interesadas — solo tabla, sin gráfico */}
      {partesActivas.length > 0 && (
        <>
          <SubBanner title="Partes interesadas" />
          <View style={s.table}>
            <View style={s.tableHead}>
              <Text style={[s.tableHeadCell, { flex: 2.5 }]}>Parte interesada</Text>
              <Text style={s.tableHeadCell}>Hombres</Text>
              <Text style={s.tableHeadCell}>Mujeres</Text>
              <Text style={s.tableHeadCell}>Total</Text>
            </View>
            {partesActivas.map((p, i) => {
              const v = partes[p.key]
              return (
                <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                  <Text style={[s.tableCell, { flex: 2.5 }]}>{p.label}</Text>
                  <Text style={s.tableCell}>{v.hombres ?? 0}</Text>
                  <Text style={s.tableCell}>{v.mujeres ?? 0}</Text>
                  <Text style={[s.tableCell, { fontFamily: 'Helvetica-Bold' }]}>{(v.hombres ?? 0) + (v.mujeres ?? 0)}</Text>
                </View>
              )
            })}
            <View style={[s.tableRow, { backgroundColor: '#dbeafe' }]}>
              <Text style={[s.tableCell, { flex: 2.5, fontFamily: 'Helvetica-Bold', color: NAVY }]}>Total general</Text>
              <Text style={[s.tableCell, { fontFamily: 'Helvetica-Bold', color: NAVY }]}>{totalPartesH}</Text>
              <Text style={[s.tableCell, { fontFamily: 'Helvetica-Bold', color: NAVY }]}>{totalPartesM}</Text>
              <Text style={[s.tableCell, { fontFamily: 'Helvetica-Bold', color: NAVY }]}>{totalPartesH + totalPartesM}</Text>
            </View>
          </View>
        </>
      )}

      {/* 3. Socializaciones con alertas visuales */}
      <SubBanner title="Socializaciones con partes interesadas" />
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
        {([1, 2, 3] as const).map(n => {
          const fecha = pppi[`socializacion${n}_fecha`] as string | undefined
          const ok = !!fecha
          return (
            <View key={n} style={{ flex: 1, backgroundColor: ok ? '#dcfce7' : '#f8fafc',
              borderRadius: 6, padding: 10,
              borderLeftWidth: 3, borderLeftColor: ok ? '#16a34a' : BORDER }}>
              <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold',
                color: ok ? '#15803d' : MUTED, marginBottom: 3 }}>
                {n === 1 ? '1.ª' : n === 2 ? '2.ª' : '3.ª'} Socialización
              </Text>
              <Text style={{ fontSize: 9, fontFamily: ok ? 'Helvetica-Bold' : 'Helvetica',
                color: ok ? DARK : MUTED }}>
                {fecha || 'No programada'}
              </Text>
              {ok && (
                <View style={{ marginTop: 4, backgroundColor: '#bbf7d0', borderRadius: 4,
                  paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start' }}>
                  <Text style={{ fontSize: 6, fontFamily: 'Helvetica-Bold', color: '#15803d' }}>✓ Realizada</Text>
                </View>
              )}
            </View>
          )
        })}
      </View>
      {pppi.comentarios_socializacion && (
        <View style={{ backgroundColor: '#fef9c3', borderRadius: 4, padding: 8,
          borderLeftWidth: 3, borderLeftColor: '#ca8a04', marginBottom: 8 }}>
          <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#854d0e', marginBottom: 2 }}>Comentarios</Text>
          <Text style={{ fontSize: 8, color: DARK }}>{pppi.comentarios_socializacion}</Text>
        </View>
      )}

      {/* 4. Capacitaciones */}
      <TablaCapacitaciones lista={caps} />

      {/* 5. Registro fotográfico */}
      <FotosGrid fotos={pppi.fotos ?? []} />

      {/* 6. Análisis de indicadores de impacto — fluye continuamente después de fotos */}
      {tieneIndicadores && (
        <>
          <View style={[s.sectionBanner, { marginTop: 20 }]}>
            <Text style={s.sectionNum}>5</Text>
            <Text style={s.sectionTitle}>Análisis de indicadores de impacto</Text>
          </View>

          {/* KPIs resumen */}
          {(matriculaTotal > 0 || mesesOrdenados.length > 0 || ipe !== null || diasEsc.length > 0) && (
            <View style={[s.kpiRow, { marginBottom: 10 }]}>
              {matriculaTotal > 0 && (
                <View style={s.kpiBox}>
                  <Text style={s.kpiNum}>{matriculaTotal}</Text>
                  <Text style={s.kpiLabel}>Matrícula total{matActual ? `\n${matActual.anio}` : ''}</Text>
                </View>
              )}
              {asistencias.length > 0 && (() => {
                const avgAsist = Math.round(asistencias.reduce((s: number, r: any) => s + r.ninos + r.ninas, 0) / asistencias.length)
                return (
                  <View style={s.kpiBox}>
                    <Text style={[s.kpiNum, { color: '#2563eb' }]}>{avgAsist}</Text>
                    <Text style={s.kpiLabel}>Asistencia prom{'\n'}mensual</Text>
                  </View>
                )
              })()}
              {deserciones.length > 0 && (() => {
                const totalDes = deserciones.reduce((s: number, r: any) => s + (r.cantidad ?? 0), 0)
                return (
                  <View style={s.kpiBox}>
                    <Text style={[s.kpiNum, { color: RED }]}>{totalDes}</Text>
                    <Text style={s.kpiLabel}>Deserciones{'\n'}acumuladas</Text>
                  </View>
                )
              })()}
              {ipe !== null && (
                <View style={[s.kpiBox, { borderColor: ipeColor }]}>
                  <Text style={[s.kpiNum, { color: ipeColor }]}>{ipe.toFixed(2)}</Text>
                  <Text style={[s.kpiLabel, { color: ipeColor }]}>IPE{'\n'}{ipeLabel}</Text>
                </View>
              )}
              {diasEsc.length > 0 && (() => {
                const d = [...diasEsc].sort((a: any, b: any) => b.anio - a.anio)[0]
                return (
                  <View style={s.kpiBox}>
                    <Text style={s.kpiNum}>{d.dias}</Text>
                    <Text style={s.kpiLabel}>Días escolares{'\n'}{d.anio}</Text>
                  </View>
                )
              })()}
              {emplDir.length > 0 && (
                <View style={s.kpiBox}>
                  <Text style={s.kpiNum}>{totDirH + totDirM}</Text>
                  <Text style={s.kpiLabel}>Empleos{'\n'}directos</Text>
                </View>
              )}
            </View>
          )}

          {/* Matrícula por año */}
          {matriculas.length > 0 && (
            <>
              <SubBanner title="Matrícula escolar por año" />
              <View style={s.cols2}>
                <View style={s.col}>
                  <View style={s.table}>
                    <View style={s.tableHead}>
                      <Text style={[s.tableHeadCell, { flex: 0.8 }]}>Año</Text>
                      <Text style={s.tableHeadCell}>Niños</Text>
                      <Text style={s.tableHeadCell}>Niñas</Text>
                      <Text style={s.tableHeadCell}>Total</Text>
                    </View>
                    {[...matriculas].sort((a: any, b: any) => a.anio - b.anio).map((m: any, i: number) => (
                      <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                        <Text style={[s.tableCell, { flex: 0.8, fontFamily: 'Helvetica-Bold' }]}>{m.anio}</Text>
                        <Text style={s.tableCell}>{m.ninos}</Text>
                        <Text style={s.tableCell}>{m.ninas}</Text>
                        <Text style={[s.tableCell, { fontFamily: 'Helvetica-Bold', color: NAVY }]}>{m.ninos + m.ninas}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <View style={s.col}>
                  <View style={s.card}>
                    <Text style={[s.cardTitle, { marginBottom: 6 }]}>Distribución por género</Text>
                    {[...matriculas].sort((a: any, b: any) => a.anio - b.anio).map((m: any, i: number) => (
                      <View key={i} style={{ marginBottom: 8 }}>
                        <Text style={{ fontSize: 6.5, color: MUTED, marginBottom: 2 }}>{m.anio}</Text>
                        <BarraGenero hombres={m.ninos} mujeres={m.ninas} height={10} />
                        <LeyendaGenero hombres={m.ninos} mujeres={m.ninas} />
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </>
          )}

          {/* Seguimiento mensual — tabla */}
          {mesesOrdenados.length > 0 && (
            <>
              <SubBanner title="Seguimiento mensual — Asistencia, inasistencias y deserción" />
              <View style={s.table}>
                <View style={s.tableHead}>
                  <Text style={[s.tableHeadCell, { flex: 1 }]}>Mes</Text>
                  <Text style={[s.tableHeadCell, { flex: 0.9 }]}>Asist. niños</Text>
                  <Text style={[s.tableHeadCell, { flex: 0.9 }]}>Asist. niñas</Text>
                  <Text style={[s.tableHeadCell, { flex: 0.8 }]}>Total</Text>
                  <Text style={[s.tableHeadCell, { flex: 0.8 }]}>Inasist.</Text>
                  <Text style={[s.tableHeadCell, { flex: 1.5 }]}>Motivos</Text>
                  <Text style={[s.tableHeadCell, { flex: 0.7 }]}>Deser.</Text>
                  <Text style={[s.tableHeadCell, { flex: 0.7 }]}>Tasa %</Text>
                </View>
                {mesesOrdenados.map(({ mes, anio }, idx) => {
                  const a   = asistencias.find((r: any)    => r.mes === mes && r.anio === anio)
                  const ins = inasistencias.find((r: any)  => r.mes === mes && r.anio === anio)
                  const des = deserciones.find((r: any)    => r.mes === mes && r.anio === anio)
                  const tasa = matriculaTotal > 0 && des?.cantidad
                    ? ((des.cantidad / matriculaTotal) * 100).toFixed(1) : null
                  const totAsist = a ? (a.ninos + a.ninas) : null
                  return (
                    <View key={idx} style={idx % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                      <Text style={[s.tableCell, { flex: 1, fontSize: 7 }]}>{mesLbl(mes, anio)}</Text>
                      <Text style={[s.tableCell, { flex: 0.9, fontSize: 7 }]}>{a?.ninos ?? '—'}</Text>
                      <Text style={[s.tableCell, { flex: 0.9, fontSize: 7 }]}>{a?.ninas ?? '—'}</Text>
                      <Text style={[s.tableCell, { flex: 0.8, fontSize: 7, fontFamily: 'Helvetica-Bold', color: totAsist ? NAVY : MUTED }]}>{totAsist ?? '—'}</Text>
                      <Text style={[s.tableCell, { flex: 0.8, fontSize: 7, color: (ins?.cantidad ?? 0) > 0 ? '#c2410c' : DARK }]}>{ins?.cantidad ?? '—'}</Text>
                      <Text style={[s.tableCell, { flex: 1.5, fontSize: 6.5 }]}>{ins?.motivos || '—'}</Text>
                      <Text style={[s.tableCell, { flex: 0.7, fontSize: 7, color: (des?.cantidad ?? 0) > 0 ? RED : DARK }]}>{des?.cantidad ?? '—'}</Text>
                      <Text style={[s.tableCell, { flex: 0.7, fontSize: 7, fontFamily: 'Helvetica-Bold', color: tasa ? RED : MUTED }]}>{tasa ? `${tasa}` : '—'}</Text>
                    </View>
                  )
                })}
              </View>
            </>
          )}

          {/* Análisis de tendencias */}
          {mesesOrdenados.length >= 2 && (
            <>
              <SubBanner title="Análisis de tendencias" />
              <View style={s.cols2}>
                {asistencias.length >= 2 && (
                  <View style={s.card}>
                    <Text style={[s.cardTitle, { marginBottom: 6 }]}>Tendencia de asistencia total</Text>
                    {mesesOrdenados.map(({ mes, anio }, i) => {
                      const a = asistencias.find((r: any) => r.mes === mes && r.anio === anio)
                      const tot = a ? (a.ninos + a.ninas) : 0
                      if (!tot) return null
                      return <TrendBar key={i} label={mesLbl(mes, anio)} value={tot} max={maxAsist} color='#3b82f6' />
                    })}
                  </View>
                )}
                {deserciones.length >= 1 && (
                  <View style={s.card}>
                    <Text style={[s.cardTitle, { marginBottom: 6 }]}>Tasa de deserción mensual (%)</Text>
                    {mesesOrdenados.map(({ mes, anio }, i) => {
                      const des = deserciones.find((r: any) => r.mes === mes && r.anio === anio)
                      const tasa = matriculaTotal > 0 && des?.cantidad
                        ? parseFloat(((des.cantidad / matriculaTotal) * 100).toFixed(1)) : 0
                      return <TrendBar key={i} label={mesLbl(mes, anio)} value={tasa} max={maxTasaDes} color={RED} suffix='%' />
                    })}
                    {matriculaTotal === 0 && (
                      <Text style={{ fontSize: 6.5, color: MUTED, marginTop: 4 }}>* Sin matrícula registrada; no se puede calcular tasa.</Text>
                    )}
                  </View>
                )}
              </View>
              <AnalysisBox>
                <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: NAVY, marginBottom: 4 }}>Interpretación del periodo</Text>
                {(() => {
                  const totalDes     = deserciones.reduce((s: number, r: any) => s + (r.cantidad ?? 0), 0)
                  const totalInasist = inasistencias.reduce((s: number, r: any) => s + (r.cantidad ?? 0), 0)
                  const avgAsist = asistencias.length > 0
                    ? Math.round(asistencias.reduce((s: number, r: any) => s + r.ninos + r.ninas, 0) / asistencias.length) : null
                  const lines: string[] = []
                  if (avgAsist !== null && matriculaTotal > 0) {
                    const pctAsist = Math.round((avgAsist / matriculaTotal) * 100)
                    lines.push(`• Asistencia promedio: ${avgAsist} alumnos/mes (${pctAsist}% de la matrícula de ${matriculaTotal}).`)
                  }
                  if (totalDes > 0 && matriculaTotal > 0) {
                    lines.push(`• Se registraron ${totalDes} deserciones acumuladas (${((totalDes / matriculaTotal) * 100).toFixed(1)}% de la matrícula).`)
                  } else if (totalDes === 0 && deserciones.length > 0) {
                    lines.push('• No se registraron deserciones en el periodo reportado.')
                  }
                  if (totalInasist > 0) lines.push(`• Inasistencias totales: ${totalInasist}.`)
                  if (lines.length === 0) lines.push('• Datos insuficientes para generar interpretación automática.')
                  return lines.map((l, i) => <Text key={i} style={{ fontSize: 7.5, color: DARK, lineHeight: 1.5 }}>{l}</Text>)
                })()}
                <Text style={{ fontSize: 6, color: MUTED, marginTop: 6, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 4 }}>
                  Fuente: datos registrados en el formulario de seguimiento PPPI · {periodo}
                </Text>
              </AnalysisBox>
            </>
          )}

          {/* IPE — tabla con alertas de color */}
          {ipeInds.length > 0 && ipe !== null && (
            <>
              <SubBanner title="Índice de Privaciones Escolares (IPE)" />
              <View style={s.table}>
                <View style={s.tableHead}>
                  <Text style={[s.tableHeadCell, { flex: 3 }]}>Indicador</Text>
                  <Text style={[s.tableHeadCell, { flex: 0.8 }]}>Estado</Text>
                  <Text style={[s.tableHeadCell, { flex: 2 }]}>Evaluación</Text>
                </View>
                {ipeInds.map((indItem, i) => {
                  const isPriv = indItem.val === 1
                  const bgColor = isPriv ? '#fee2e2' : '#dcfce7'
                  const fgColor = isPriv ? RED : GREEN
                  const textColor = isPriv ? '#7f1d1d' : '#166534'
                  return (
                    <View key={i} style={[i % 2 === 0 ? s.tableRow : s.tableRowAlt, { backgroundColor: bgColor }]}>
                      <Text style={[s.tableCell, { flex: 3, fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: textColor }]}>
                        {indItem.label}
                      </Text>
                      <View style={[s.tableCell, { flex: 0.8, alignItems: 'center', justifyContent: 'center', paddingVertical: 2 }]}>
                        <View style={{ width: 18, height: 18, borderRadius: 9,
                          backgroundColor: fgColor, alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#ffffff' }}>
                            {isPriv ? '✗' : '✓'}
                          </Text>
                        </View>
                      </View>
                      <Text style={[s.tableCell, { flex: 2, fontSize: 7, color: textColor }]}>
                        {isPriv ? 'Privación' : 'Sin privación'}
                      </Text>
                    </View>
                  )
                })}
              </View>

              {/* Resultado IPE */}
              <View style={{ backgroundColor: ipe <= 0.25 ? '#dcfce7' : ipe <= 0.5 ? '#fef9c3' : ipe <= 0.75 ? '#ffedd5' : '#fee2e2',
                borderRadius: 6, padding: 10, marginTop: 6, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ alignItems: 'center', minWidth: 50 }}>
                  <Text style={{ fontSize: 24, fontFamily: 'Helvetica-Bold', color: ipeColor }}>{ipe.toFixed(2)}</Text>
                  <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: ipeColor, textAlign: 'center' }}>{ipeLabel}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ height: 10, backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 5, marginBottom: 4 }}>
                    <View style={{ width: `${Math.round(ipe * 100)}%`, height: 10, backgroundColor: ipeColor, borderRadius: 5 }} />
                  </View>
                  <Text style={{ fontSize: 6.5, color: ipeColor }}>
                    {sumaIPE} / {ipeInds.length} indicadores con privación
                  </Text>
                </View>
              </View>
            </>
          )}

          {/* Infraestructura */}
          {(infra.agua_potable || infra.aulas_en_uso > 0 || infra.energia_electrica) && (
            <>
              <SubBanner title="Condiciones de infraestructura" />
              {infra.descripcion && <TextBlock text={infra.descripcion} />}
              <SubBanner title="Agua, saneamiento e higiene" />
              <View style={s.cols2}>
                <View style={s.col}>
                  <View style={s.table}>
                    <View style={s.tableHead}>
                      <Text style={[s.tableHeadCell, { flex: 2.2 }]}>Aspecto</Text>
                      <Text style={[s.tableHeadCell, { flex: 1.8 }]}>Condición</Text>
                    </View>
                    {[
                      { label: 'Agua potable', val: infra.agua_potable },
                      { label: 'Frecuencia de agua', val: infra.frecuencia_agua },
                      { label: 'Tanque/cisterna', val: infra.tanque_cisterna },
                      { label: 'N.° de sanitarios', val: infra.num_sanitarios > 0 ? infra.num_sanitarios : null },
                      { label: 'Sanitarios funcionales', val: infra.sanitarios_funcionales > 0 ? infra.sanitarios_funcionales : null },
                      { label: 'Sanitarios separados', val: infra.sanitarios_separados },
                      { label: 'Lavamanos funcionales', val: infra.lavamanos_funcionales > 0 ? infra.lavamanos_funcionales : null },
                      { label: 'Manejo de aguas residuales', val: infra.manejo_aguas_residuales },
                      { label: 'Manejo de basura', val: infra.manejo_basura },
                    ].map((item, i) => (
                      <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                        <Text style={[s.tableCell, { flex: 2.2, fontSize: 7.5 }]}>{item.label}</Text>
                        <Text style={[s.tableCell, { flex: 1.8, fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: DARK }]}>{val(item.val)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <View style={s.col}>
                  <View style={[s.card, { marginBottom: 8 }]}>
                    <Text style={[s.cardTitle, { marginBottom: 4, fontSize: 7.5 }]}>Capacidad instalada</Text>
                    <View style={{ flexDirection: 'row', marginBottom: 2.5 }}><Text style={{ fontSize: 6.5, color: MUTED, width: '55%' }}>Aulas en uso:</Text><Text style={{ fontSize: 6.5, color: DARK, fontFamily: 'Helvetica-Bold', flex: 1 }}>{val(infra.aulas_en_uso > 0 ? infra.aulas_en_uso : null)}</Text></View>
                    {estudxAula !== null && (
                      <View style={{ flexDirection: 'row', marginBottom: 2.5 }}>
                        <Text style={{ fontSize: 6.5, color: MUTED, width: '55%' }}>Est./aula:</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, flex: 1 }}>
                          <Text style={{ fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: hayHacinamiento ? RED : GREEN }}>{estudxAula.toFixed(1)}</Text>
                          <View style={{ backgroundColor: hayHacinamiento ? '#fee2e2' : '#dcfce7', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4 }}>
                            <Text style={{ fontSize: 5.5, fontFamily: 'Helvetica-Bold', color: hayHacinamiento ? RED : GREEN }}>{hayHacinamiento ? 'Hacin.' : 'OK'}</Text>
                          </View>
                        </View>
                      </View>
                    )}
                    <View style={{ flexDirection: 'row', marginBottom: 2.5 }}><Text style={{ fontSize: 6.5, color: MUTED, width: '55%' }}>Turnos:</Text><Text style={{ fontSize: 6.5, color: DARK, flex: 1 }}>{val(infra.turnos_compartidos)}</Text></View>
                    <View style={{ flexDirection: 'row', marginBottom: 2.5 }}><Text style={{ fontSize: 6.5, color: MUTED, width: '55%' }}>Déficit aulas:</Text><Text style={{ fontSize: 6.5, color: DARK, flex: 1 }}>{val(infra.deficit_aulas > 0 ? infra.deficit_aulas : null)}</Text></View>
                    <View style={{ flexDirection: 'row' }}><Text style={{ fontSize: 6.5, color: MUTED, width: '55%' }}>Estado struct.:</Text><Text style={{ fontSize: 6.5, color: DARK, flex: 1 }}>{val(infra.estado_estructural)}</Text></View>
                  </View>
                  <View style={s.card}>
                    <Text style={[s.cardTitle, { marginBottom: 4, fontSize: 7.5 }]}>Tecnología y conectividad</Text>
                    <View style={{ flexDirection: 'row', marginBottom: 2.5 }}><Text style={{ fontSize: 6.5, color: MUTED, width: '55%' }}>Energía eléc.:</Text><Text style={{ fontSize: 6.5, color: DARK, flex: 1 }}>{val(infra.energia_electrica)}</Text></View>
                    <View style={{ flexDirection: 'row', marginBottom: 2.5 }}><Text style={{ fontSize: 6.5, color: MUTED, width: '55%' }}>Est. instalación:</Text><Text style={{ fontSize: 6.5, color: DARK, flex: 1 }}>{val(infra.estado_instalacion_electrica)}</Text></View>
                    <View style={{ flexDirection: 'row', marginBottom: 2.5 }}><Text style={{ fontSize: 6.5, color: MUTED, width: '55%' }}>Internet:</Text><Text style={{ fontSize: 6.5, color: DARK, flex: 1 }}>{val(infra.internet)}</Text></View>
                    <View style={{ flexDirection: 'row', marginBottom: 2.5 }}><Text style={{ fontSize: 6.5, color: MUTED, width: '55%' }}>Velocidad:</Text><Text style={{ fontSize: 6.5, color: DARK, flex: 1 }}>{val(infra.velocidad_internet)}</Text></View>
                    <View style={{ flexDirection: 'row', marginBottom: 2.5 }}><Text style={{ fontSize: 6.5, color: MUTED, width: '55%' }}>Compu. disp.:</Text><Text style={{ fontSize: 6.5, color: DARK, flex: 1 }}>{val(infra.computadoras_disponibles > 0 ? infra.computadoras_disponibles : null)}</Text></View>
                    <View style={{ flexDirection: 'row' }}><Text style={{ fontSize: 6.5, color: MUTED, width: '55%' }}>Compu. func.:</Text><Text style={{ fontSize: 6.5, color: DARK, flex: 1 }}>{val(infra.computadoras_funcionales > 0 ? infra.computadoras_funcionales : null)}</Text></View>
                  </View>
                </View>
              </View>

              {/* Semáforo de riesgo — tarjetas */}
              <SubBanner title="Semáforo de riesgo — Condiciones de infraestructura" />
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                <SemaforoCard label="Agua potable"
                  valor={infra.agua_potable || ''}
                  ok={infra.agua_potable ? infra.agua_potable === 'Sí' : null} />
                <SemaforoCard label="Sanitarios separados"
                  valor={infra.sanitarios_separados || ''}
                  ok={infra.sanitarios_separados ? infra.sanitarios_separados === 'Sí' : null} />
                <SemaforoCard label="Energía eléctrica"
                  valor={infra.energia_electrica || ''}
                  ok={infra.energia_electrica ? infra.energia_electrica === 'Sí' : null} />
                <SemaforoCard label="Internet"
                  valor={infra.internet || ''}
                  ok={infra.internet ? infra.internet === 'Sí' : null} />
                {estudxAula !== null ? (
                  <SemaforoCard label="Densidad aulas"
                    valor={`${estudxAula.toFixed(1)} est/aula`}
                    ok={!hayHacinamiento} />
                ) : null}
                <SemaforoCard label="Estado estructural"
                  valor={infra.estado_estructural || ''}
                  ok={infra.estado_estructural ? infra.estado_estructural === 'Bueno' : null} />
              </View>

              <AnalysisBox>
                <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: NAVY, marginBottom: 4 }}>Evaluación de condiciones de infraestructura</Text>
                {(() => {
                  const riesgos: string[] = []
                  const positivos: string[] = []
                  if (infra.agua_potable === 'No')         riesgos.push('ausencia de agua potable')
                  if (infra.internet === 'No')              riesgos.push('falta de conectividad a internet')
                  if (hayHacinamiento)                      riesgos.push(`hacinamiento (${estudxAula?.toFixed(1)} est/aula)`)
                  if (infra.estado_estructural === 'Malo')  riesgos.push('estado estructural deficiente')
                  if (infra.deficit_aulas > 0)              riesgos.push(`déficit de ${infra.deficit_aulas} aulas`)
                  if (infra.agua_potable === 'Sí')          positivos.push('suministro de agua potable')
                  if (infra.sanitarios_separados === 'Sí')  positivos.push('sanitarios separados por género')
                  if (!hayHacinamiento && estudxAula)       positivos.push('densidad aceptable en aulas')
                  if (infra.energia_electrica === 'Sí')     positivos.push('energía eléctrica disponible')
                  const lines: string[] = []
                  if (riesgos.length > 0)    lines.push(`• Factores de riesgo: ${riesgos.join(', ')}.`)
                  if (positivos.length > 0)  lines.push(`• Condiciones favorables: ${positivos.join(', ')}.`)
                  if (lines.length === 0)    lines.push('• No se identificaron riesgos críticos en las condiciones evaluadas.')
                  return lines.map((l, i) => <Text key={i} style={{ fontSize: 7.5, color: DARK, lineHeight: 1.5 }}>{l}</Text>)
                })()}
                <Text style={{ fontSize: 6, color: MUTED, marginTop: 6, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 4 }}>
                  Fuente: datos registrados en el formulario de seguimiento PPPI · {periodo}
                </Text>
              </AnalysisBox>
            </>
          )}

          {/* Días escolares efectivos — tarjeta completa */}
          {diasEsc.length > 0 && (
            <>
              <SubBanner title="Días escolares efectivos" />
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                {[...diasEsc].sort((a: any, b: any) => a.anio - b.anio).map((d: any, i: number) => (
                  <View key={i} style={{ flex: 1, backgroundColor: '#f0f4ff', borderRadius: 8,
                    padding: 16, alignItems: 'center',
                    borderTopWidth: 4, borderTopColor: NAVY }}>
                    <Text style={{ fontSize: 36, fontFamily: 'Helvetica-Bold', color: NAVY, lineHeight: 1.1 }}>{d.dias}</Text>
                    <Text style={{ fontSize: 8, color: MUTED, marginTop: 4 }}>días escolares efectivos</Text>
                    <View style={{ marginTop: 6, backgroundColor: NAVY, borderRadius: 12,
                      paddingHorizontal: 10, paddingVertical: 3 }}>
                      <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#ffffff' }}>{d.anio}</Text>
                    </View>
                    {diasEsc.length > 1 && i > 0 && (() => {
                      const prev = [...diasEsc].sort((a: any, b: any) => a.anio - b.anio)[i - 1]
                      const diff = d.dias - prev.dias
                      const color = diff > 0 ? GREEN : diff < 0 ? RED : MUTED
                      return (
                        <Text style={{ fontSize: 7, color, marginTop: 5, fontFamily: 'Helvetica-Bold' }}>
                          {diff > 0 ? `▲ +${diff} vs ${prev.anio}` : diff < 0 ? `▼ ${diff} vs ${prev.anio}` : `= igual a ${prev.anio}`}
                        </Text>
                      )
                    })()}
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Empleos directos */}
          {emplDir.length > 0 && (
            <>
              <SubBanner title="Empleos directos fijos derivados del proyecto" />
              <View style={s.kpiRow}>
                <View style={s.kpiBox}>
                  <Text style={s.kpiNum}>{totDirH + totDirM}</Text>
                  <Text style={s.kpiLabel}>Total empleos{'\n'}directos</Text>
                </View>
                {ultimoDir && (
                  <View style={s.kpiBox}>
                    <Text style={[s.kpiNum, { color: NAVY }]}>{ultimoDir.hombres + ultimoDir.mujeres}</Text>
                    <Text style={s.kpiLabel}>Emp. directos{'\n'}({mesLbl(ultimoDir.mes, ultimoDir.anio)})</Text>
                  </View>
                )}
                {(() => {
                  const pctM = (totDirH + totDirM) > 0 ? Math.round((totDirM / (totDirH + totDirM)) * 100) : 0
                  return (
                    <View style={s.kpiBox}>
                      <Text style={[s.kpiNum, { color: '#ec4899', fontSize: 18 }]}>{pctM}%</Text>
                      <Text style={s.kpiLabel}>Participación{'\n'}femenina</Text>
                    </View>
                  )
                })()}
              </View>
              <View style={s.cols2}>
                <View style={s.col}>
                  <View style={s.table}>
                    <View style={s.tableHead}>
                      <Text style={[s.tableHeadCell, { flex: 1.2 }]}>Mes</Text>
                      <Text style={s.tableHeadCell}>Hombres</Text>
                      <Text style={s.tableHeadCell}>Mujeres</Text>
                      <Text style={s.tableHeadCell}>Total</Text>
                      <Text style={s.tableHeadCell}>% H</Text>
                      <Text style={s.tableHeadCell}>% M</Text>
                    </View>
                    {emplDirSorted.map((e: any, i: number) => {
                      const tot = e.hombres + e.mujeres
                      const pH = tot > 0 ? Math.round((e.hombres / tot) * 100) : 0
                      const pM = tot > 0 ? 100 - pH : 0
                      return (
                        <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                          <Text style={[s.tableCell, { flex: 1.2 }]}>{mesLbl(e.mes, e.anio)}</Text>
                          <Text style={s.tableCell}>{e.hombres}</Text>
                          <Text style={s.tableCell}>{e.mujeres}</Text>
                          <Text style={[s.tableCell, { fontFamily: 'Helvetica-Bold' }]}>{tot}</Text>
                          <Text style={[s.tableCell, { color: '#2563eb' }]}>{pH}%</Text>
                          <Text style={[s.tableCell, { color: '#db2777' }]}>{pM}%</Text>
                        </View>
                      )
                    })}
                  </View>
                </View>
                <View style={s.col}>
                  <View style={s.card}>
                    <Text style={[s.cardTitle, { marginBottom: 6 }]}>Evolución mensual</Text>
                    {emplDirSorted.map((e: any, i: number) => (
                      <TrendBar key={i} label={mesLbl(e.mes, e.anio)} value={e.hombres + e.mujeres} max={maxEmplDir} color={NAVY} />
                    ))}
                  </View>
                  {ultimoDir && (
                    <View style={[s.card, { marginTop: 8 }]}>
                      <Text style={[s.cardTitle, { marginBottom: 6 }]}>Período más reciente</Text>
                      <BarraGenero hombres={ultimoDir.hombres} mujeres={ultimoDir.mujeres} height={14} />
                      <LeyendaGenero hombres={ultimoDir.hombres} mujeres={ultimoDir.mujeres} />
                    </View>
                  )}
                </View>
              </View>
            </>
          )}

          {/* Empleos indirectos */}
          {emplInd.length > 0 && (
            <>
              <SubBanner title="Empleos indirectos derivados del proyecto" />
              <View style={s.cols2}>
                <View style={s.col}>
                  <View style={s.table}>
                    <View style={s.tableHead}>
                      <Text style={[s.tableHeadCell, { flex: 1.2 }]}>Mes</Text>
                      <Text style={s.tableHeadCell}>Hombres</Text>
                      <Text style={s.tableHeadCell}>Mujeres</Text>
                      <Text style={s.tableHeadCell}>Total</Text>
                      <Text style={[s.tableHeadCell, { flex: 1.8 }]}>Tipo de empleo</Text>
                    </View>
                    {emplIndSorted.map((e: any, i: number) => {
                      const tot = e.hombres + e.mujeres
                      return (
                        <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                          <Text style={[s.tableCell, { flex: 1.2 }]}>{mesLbl(e.mes, e.anio)}</Text>
                          <Text style={s.tableCell}>{e.hombres}</Text>
                          <Text style={s.tableCell}>{e.mujeres}</Text>
                          <Text style={[s.tableCell, { fontFamily: 'Helvetica-Bold' }]}>{tot}</Text>
                          <Text style={[s.tableCell, { flex: 1.8 }]}>{e.tipos || '—'}</Text>
                        </View>
                      )
                    })}
                  </View>
                </View>
                <View style={s.card}>
                  <Text style={[s.cardTitle, { marginBottom: 6 }]}>Evolución mensual</Text>
                  {emplIndSorted.map((e: any, i: number) => (
                    <TrendBar key={i} label={mesLbl(e.mes, e.anio)} value={e.hombres + e.mujeres} max={maxEmplInd} color='#7c3aed' />
                  ))}
                </View>
              </View>
            </>
          )}

          {/* Resumen ejecutivo */}
          <SubBanner title="Resumen ejecutivo de indicadores de impacto" />
          <View style={{ backgroundColor: '#f0f4ff', borderRadius: 8, padding: 12, marginTop: 4 }}>
            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: NAVY, marginBottom: 8 }}>Síntesis de indicadores sociales del proyecto</Text>
            <View style={s.cols2}>
              <View>
                {matriculaTotal > 0 && (
                  <View style={{ marginBottom: 6 }}>
                    <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: DARK, marginBottom: 2 }}>Indicadores escolares</Text>
                    <Text style={{ fontSize: 7, color: DARK, lineHeight: 1.5 }}>
                      {'• Matrícula: ' + matriculaTotal + ' alumnos' + (matActual ? ` (${matActual.anio})` : '') + '\n'}
                      {asistencias.length > 0 ? '• Asistencia prom.: ' + Math.round(asistencias.reduce((s: number, r: any) => s + r.ninos + r.ninas, 0) / asistencias.length) + ' alumnos/mes\n' : ''}
                      {deserciones.length > 0 ? '• Deserciones acum.: ' + deserciones.reduce((s: number, r: any) => s + r.cantidad, 0) + ' alumnos\n' : ''}
                      {ipe !== null ? `• IPE: ${ipe.toFixed(2)} — ${ipeLabel}` : ''}
                    </Text>
                  </View>
                )}
                {(infra.agua_potable || infra.estado_estructural) && (
                  <View style={{ marginBottom: 6 }}>
                    <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: DARK, marginBottom: 2 }}>Infraestructura</Text>
                    <Text style={{ fontSize: 7, color: DARK, lineHeight: 1.5 }}>
                      {infra.agua_potable ? `• Agua potable: ${infra.agua_potable}\n` : ''}
                      {infra.estado_estructural ? `• Estado estructural: ${infra.estado_estructural}\n` : ''}
                      {estudxAula !== null ? `• Densidad: ${estudxAula.toFixed(1)} est/aula ${hayHacinamiento ? '(hacinamiento)' : '(OK)'}` : ''}
                    </Text>
                  </View>
                )}
              </View>
              <View>
                {(emplDir.length > 0 || emplInd.length > 0) && (
                  <View style={{ marginBottom: 6 }}>
                    <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: DARK, marginBottom: 2 }}>Impacto en empleo</Text>
                    {emplDir.length > 0 && <Text style={{ fontSize: 7, color: DARK, lineHeight: 1.5 }}>{'• Empleos directos: ' + (totDirH + totDirM) + ` (H: ${totDirH} / M: ${totDirM})\n`}</Text>}
                    {emplInd.length > 0 && <Text style={{ fontSize: 7, color: DARK, lineHeight: 1.5 }}>{'• Empleos indirectos: ' + (totIndH + totIndM) + ` (H: ${totIndH} / M: ${totIndM})\n`}</Text>}
                    {(() => {
                      const gT = totDirH + totDirM + totIndH + totIndM
                      const gM = totDirM + totIndM
                      const pM = gT > 0 ? Math.round((gM / gT) * 100) : 0
                      return <Text style={{ fontSize: 7, color: DARK, lineHeight: 1.5 }}>{'• Participación femenina: ' + pM + '%'}</Text>
                    })()}
                  </View>
                )}
                {partesActivas.length > 0 && (
                  <View>
                    <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: DARK, marginBottom: 2 }}>Partes interesadas</Text>
                    <Text style={{ fontSize: 7, color: DARK, lineHeight: 1.5 }}>
                      {'• Grupos participantes: ' + partesActivas.length + '\n'}
                      {'• Total participantes: ' + (totalPartesH + totalPartesM) + ` (H: ${totalPartesH} / M: ${totalPartesM})`}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </>
      )}
    </Page>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════
// MAQR
// ═══════════════════════════════════════════════════════════════════
function SeccionMAQR({ data }: { data: any }) {
  const { esc, periodo, maqr } = data
  if (!maqr) return null

  const medios: any  = maqr.medios_recepcion ?? {}
  const quejas: any[] = maqr.quejas ?? []

  const mediosActivos = [
    medios.buzon?.activo    && { nombre: 'Buzón',       detalle: `${medios.buzon.direccion ?? ''} — Resp: ${medios.buzon.responsable_llave ?? ''}` },
    medios.rotulos?.activo  && { nombre: 'Rótulos',     detalle: `Estado: ${medios.rotulos.estado ?? ''}` },
    medios.correo?.activo   && { nombre: 'Correo',      detalle: `${medios.correo.correo ?? ''} — Resp: ${medios.correo.responsable ?? ''}` },
    medios.telefono?.activo && { nombre: 'Teléfono',    detalle: `${medios.telefono.numero ?? ''} — Resp: ${medios.telefono.responsable ?? ''}` },
    medios.whatsapp?.activo && { nombre: 'WhatsApp',    detalle: `${medios.whatsapp.numero ?? ''} — Resp: ${medios.whatsapp.responsable ?? ''}` },
  ].filter(Boolean) as { nombre: string; detalle: string }[]

  return (
    <Page size="LETTER" style={s.page}>
      <Footer escuela={esc?.nombre ?? ''} periodo={periodo} />
      <View style={s.sectionBanner}>
        <Text style={s.sectionNum}>6</Text>
        <Text style={s.sectionTitle}>Condición 6 — Mecanismo de Atención de Quejas y Reclamos (MAQR)</Text>
      </View>

      {maqr.descripcion_condicion && (
        <><SubBanner title="Descripción de la condición" /><TextBlock text={maqr.descripcion_condicion} /></>
      )}

      {/* Medios de recepción */}
      {mediosActivos.length > 0 && (
        <>
          <SubBanner title="Medios de recepción activos" />
          <View style={s.table}>
            <View style={s.tableHead}>
              <Text style={[s.tableHeadCell, { flex: 1 }]}>Canal</Text>
              <Text style={[s.tableHeadCell, { flex: 3 }]}>Detalle</Text>
            </View>
            {mediosActivos.map((m, i) => (
              <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                <Text style={[s.tableCell, { flex: 1, fontFamily: 'Helvetica-Bold' }]}>{m.nombre}</Text>
                <Text style={[s.tableCell, { flex: 3 }]}>{m.detalle}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Resumen quejas */}
      <SubBanner title="Registro de quejas y reclamos" />
      <View style={s.kpiRow}>
        <View style={s.kpiBox}>
          <Text style={[s.kpiNum, { color: quejas.length > 0 ? AMBER : GREEN }]}>{quejas.length}</Text>
          <Text style={s.kpiLabel}>Total quejas</Text>
        </View>
        <View style={s.kpiBox}>
          <Text style={[s.kpiNum, { color: GREEN }]}>{quejas.filter((q: any) => q.estado === 'Cerrada').length}</Text>
          <Text style={s.kpiLabel}>Cerradas</Text>
        </View>
        <View style={s.kpiBox}>
          <Text style={[s.kpiNum, { color: AMBER }]}>{quejas.filter((q: any) => q.estado !== 'Cerrada').length}</Text>
          <Text style={s.kpiLabel}>Pendientes</Text>
        </View>
        <View style={s.kpiBox}>
          <Text style={[s.kpiNum, { color: RED }]}>{quejas.filter((q: any) => q.arrastrada).length}</Text>
          <Text style={s.kpiLabel}>Arrastradas</Text>
        </View>
      </View>

      {quejas.length > 0 && (
        <View style={s.table}>
          <View style={s.tableHead}>
            <Text style={s.tableHeadCell}>N.°</Text>
            <Text style={[s.tableHeadCell, { flex: 1.5 }]}>Medio</Text>
            <Text style={[s.tableHeadCell, { flex: 1.2 }]}>Fecha recep.</Text>
            <Text style={[s.tableHeadCell, { flex: 1.5 }]}>Tipo</Text>
            <Text style={[s.tableHeadCell, { flex: 1 }]}>Gravedad</Text>
            <Text style={[s.tableHeadCell, { flex: 2.5 }]}>Descripción</Text>
            <Text style={[s.tableHeadCell, { flex: 1 }]}>Estado</Text>
          </View>
          {quejas.map((q: any, i: number) => (
            <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
              <Text style={s.tableCell}>{q.numero_queja ?? i + 1}{q.arrastrada ? '*' : ''}</Text>
              <Text style={[s.tableCell, { flex: 1.5 }]}>{val(q.medio === 'Otro' ? q.medio_otro : q.medio)}</Text>
              <Text style={[s.tableCell, { flex: 1.2 }]}>{val(q.fecha_recepcion)}</Text>
              <Text style={[s.tableCell, { flex: 1.5 }]}>{val(q.tipo_queja === 'Otro' ? q.tipo_queja_otro : q.tipo_queja)}</Text>
              <Text style={[s.tableCell, { flex: 1 }]}>{val(q.nivel_gravedad)}</Text>
              <Text style={[s.tableCell, { flex: 2.5 }]}>{val(q.descripcion)}</Text>
              <Text style={[s.tableCell, { flex: 1 }]}>{val(q.estado)}</Text>
            </View>
          ))}
        </View>
      )}

      <FotosGrid fotos={maqr.fotos ?? []} />
    </Page>
  )
}

// ═══════════════════════════════════════════════════════════════════
// PRT
// ═══════════════════════════════════════════════════════════════════
function SeccionPRT({ data }: { data: any }) {
  const { esc, periodo, prt } = data
  if (!prt) return null

  const lugares: any[] = prt.lugares ?? []
  const modalidad: string[] = prt.modalidad ?? []

  return (
    <Page size="LETTER" style={s.page}>
      <Footer escuela={esc?.nombre ?? ''} periodo={periodo} />
      <View style={s.sectionBanner}>
        <Text style={s.sectionNum}>7</Text>
        <Text style={s.sectionTitle}>Condición 7 — Plan de Reubicación Temporal (PRT)</Text>
      </View>

      {prt.descripcion_condicion && (
        <><SubBanner title="Descripción de la condición" /><TextBlock text={prt.descripcion_condicion} /></>
      )}

      {/* Modalidad */}
      {modalidad.length > 0 && (
        <Field label="Modalidad de continuidad educativa" value={modalidad.join(', ')} />
      )}

      {/* Lugares presenciales */}
      {lugares.length > 0 && (
        <>
          <SubBanner title="Lugares de reubicación" />
          {lugares.map((l: any, li: number) => {
            const estTotal  = (l.est_ninos ?? 0) + (l.est_ninas ?? 0)
            const docTotal  = (l.doc_hombres ?? 0) + (l.doc_mujeres ?? 0)
            const condicion = l.condicion_uso === 'Otros' ? l.condicion_otros : l.condicion_uso
            const rubrosActivos = (l.rubros ?? []).filter((r: any) => r.activo)
            const costoTotal = rubrosActivos.reduce((sum: number, r: any) => sum + ((r.cantidad ?? 1) * (r.costo_unitario ?? 0)), 0)
            const adecs = Object.entries(l.adecuaciones ?? {}).filter(([, v]: any) => v.activa)

            return (
              <View key={li} style={{ marginBottom: 10 }}>
                {/* Encabezado lugar */}
                <View style={{ backgroundColor: '#f1f5f9', borderRadius: 4, padding: 6, marginBottom: 4 }}>
                  <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: NAVY }}>
                    Lugar #{li + 1} — {val(l.direccion)}
                  </Text>
                </View>
                {/* KPIs */}
                <View style={s.kpiRow}>
                  <View style={s.kpiBox}>
                    <Text style={s.kpiNum}>{l.est_ninos ?? 0}</Text>
                    <Text style={s.kpiLabel}>Alumnos</Text>
                  </View>
                  <View style={s.kpiBox}>
                    <Text style={s.kpiNum}>{l.est_ninas ?? 0}</Text>
                    <Text style={s.kpiLabel}>Alumnas</Text>
                  </View>
                  <View style={[s.kpiBox, { borderColor: NAVY, borderWidth: 1 }]}>
                    <Text style={[s.kpiNum, { color: NAVY }]}>{estTotal}</Text>
                    <Text style={s.kpiLabel}>Total alumnos</Text>
                  </View>
                  <View style={s.kpiBox}>
                    <Text style={s.kpiNum}>{l.doc_hombres ?? 0}</Text>
                    <Text style={s.kpiLabel}>Doc. hombres</Text>
                  </View>
                  <View style={s.kpiBox}>
                    <Text style={s.kpiNum}>{l.doc_mujeres ?? 0}</Text>
                    <Text style={s.kpiLabel}>Doc. mujeres</Text>
                  </View>
                  <View style={[s.kpiBox, { borderColor: NAVY, borderWidth: 1 }]}>
                    <Text style={[s.kpiNum, { color: NAVY }]}>{docTotal}</Text>
                    <Text style={s.kpiLabel}>Total docentes</Text>
                  </View>
                </View>

                <Field label="Condición de uso" value={condicion} />

                {/* Rubros de costo */}
                {rubrosActivos.length > 0 && (
                  <View style={[s.table, { marginTop: 4 }]}>
                    <View style={s.tableHead}>
                      <Text style={[s.tableHeadCell, { flex: 2 }]}>Rubro</Text>
                      <Text style={[s.tableHeadCell, { flex: 1.5 }]}>Modalidad</Text>
                      <Text style={s.tableHeadCell}>Cant.</Text>
                      <Text style={s.tableHeadCell}>Costo unit.</Text>
                      <Text style={s.tableHeadCell}>Subtotal</Text>
                    </View>
                    {rubrosActivos.map((r: any, ri: number) => (
                      <View key={ri} style={ri % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                        <Text style={[s.tableCell, { flex: 2 }]}>{val(r.nombre)}</Text>
                        <Text style={[s.tableCell, { flex: 1.5 }]}>{val(r.unidad)}</Text>
                        <Text style={s.tableCell}>{r.cantidad ?? 1}</Text>
                        <Text style={s.tableCell}>${r.costo_unitario ?? 0}</Text>
                        <Text style={[s.tableCell, { fontFamily: 'Helvetica-Bold' }]}>${(r.cantidad ?? 1) * (r.costo_unitario ?? 0)}</Text>
                      </View>
                    ))}
                    <View style={[s.tableRow, { backgroundColor: '#e2e8f0' }]}>
                      <Text style={[s.tableCell, { flex: 2, fontFamily: 'Helvetica-Bold' }]}>TOTAL MENSUAL</Text>
                      <Text style={[s.tableCell, { flex: 1.5 }]}> </Text>
                      <Text style={s.tableCell}> </Text>
                      <Text style={s.tableCell}> </Text>
                      <Text style={[s.tableCell, { fontFamily: 'Helvetica-Bold', color: NAVY }]}>${costoTotal}</Text>
                    </View>
                  </View>
                )}

                {/* Adecuaciones */}
                {adecs.length > 0 && (
                  <View style={{ marginTop: 4 }}>
                    <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: MUTED, marginBottom: 2 }}>Adecuaciones realizadas:</Text>
                    {adecs.map(([key, v]: any, ai: number) => (
                      <View key={ai} style={{ flexDirection: 'row', marginBottom: 1 }}>
                        <Text style={{ fontSize: 7, color: GREEN, marginRight: 4 }}>✓</Text>
                        <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: DARK, marginRight: 4 }}>{key}:</Text>
                        <Text style={{ fontSize: 7, color: DARK, flex: 1 }}>{v.descripcion || '—'}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )
          })}
        </>
      )}

      {prt.observaciones && (
        <>
          <SubBanner title="Observaciones" />
          <TextBlock text={prt.observaciones} />
        </>
      )}
      <FotosGrid fotos={prt.fotos ?? []} />
    </Page>
  )
}

// ═══════════════════════════════════════════════════════════════════
// SECCIÓN 8 — CÓDIGO DE CONDUCTA DE TRABAJADORES
// ═══════════════════════════════════════════════════════════════════
function SeccionCCT({ data }: { data: any }) {
  try {
    const { esc, periodo, cct } = data

    if (!cct) {
      // Si no hay datos de CCT, mostrar una página vacía
      return (
        <Page size="LETTER" style={s.page}>
          <Footer escuela={esc?.nombre ?? ''} periodo={periodo} />
          <View style={s.sectionBanner}>
            <Text style={s.sectionNum}>8</Text>
            <Text style={s.sectionTitle}>Condición 8 — Código de Conducta de Trabajadores</Text>
          </View>
          <Text style={{ fontSize: 9, color: MUTED, marginTop: 20 }}>Sin datos registrados</Text>
        </Page>
      )
    }

    const secciones = cct.secciones ?? []
    const documentos = cct.documentos ?? []
    const comentariosGenerales = cct.comentarios_generales ?? ''
    const capacitaciones = cct.capacitaciones ?? []
    const fotos = cct.fotos ?? []

    // Análisis de cumplimiento
    const analisis = analizarCCT(secciones, documentos, comentariosGenerales)

  const colorNivel = {
    critico: RED,
    alto: AMBER,
    medio: '#eab308',
    bajo: GREEN,
  }

  return (
    <>
      {/* PÁGINA 1: VERIFICACIÓN */}
      <Page size="LETTER" style={s.page}>
        <Footer escuela={esc?.nombre ?? ''} periodo={periodo} />
        <View style={s.sectionBanner}>
          <Text style={s.sectionNum}>8</Text>
          <Text style={s.sectionTitle}>Condición 8 — Código de Conducta de Trabajadores</Text>
        </View>

        {cct.descripcion_condicion && (
          <>
            <SubBanner title="Descripción de la Condición" />
            <TextBlock text={cct.descripcion_condicion} />
          </>
        )}

        {/* Secciones de Verificación */}
        {secciones.length > 0 && (
          <>
            <SubBanner title="Verificación de Cumplimiento" />
            {secciones.map((seccion: any, secIdx: number) => {
              // Convertir items a array si es un objeto
              const items = Array.isArray(seccion.items) ? seccion.items : Object.values(seccion.items || {})
              return (
              <View key={secIdx} style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: NAVY, marginBottom: 4, backgroundColor: '#f1f5f9', padding: 4 }}>
                  {seccion.titulo}
                </Text>
                <View style={s.table}>
                  <View style={s.tableHead}>
                    <Text style={[s.tableHeadCell, { flex: 1.5 }]}>Ítem</Text>
                    <Text style={[s.tableHeadCell, { flex: 1, textAlign: 'center' }]}>Estado</Text>
                    <Text style={[s.tableHeadCell, { flex: 2.5 }]}>Observaciones</Text>
                  </View>
                  {items.map((item: any, itemIdx: number) => {
                    const estado = item.cumple === true ? 'Cumple' : item.cumple === false ? 'No Cumple' : '—'
                    const estadoColor = item.cumple === true ? GREEN : item.cumple === false ? RED : MUTED
                    return (
                    <View key={itemIdx} style={itemIdx % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                      <Text style={[s.tableCell, { flex: 1.5, fontSize: 6.5 }]}>{item.nombre}</Text>
                      <Text style={[s.tableCell, { flex: 1, textAlign: 'center', fontSize: 7, fontFamily: 'Helvetica-Bold', color: estadoColor }]}>
                        {estado}
                      </Text>
                      <Text style={[s.tableCell, { flex: 2.5, fontSize: 6.5 }]}>
                        {item.observacion && item.observacion.trim() ? item.observacion : '—'}
                      </Text>
                    </View>
                    )
                  })}
                </View>
              </View>
            )})}
          </>
        )}

        {/* Evidencia Documental */}
        {documentos.length > 0 && (
          <>
            <SubBanner title="6. Evidencia Documental" />
            <View style={s.table}>
              <View style={s.tableHead}>
                <Text style={[s.tableHeadCell, { flex: 1.2 }]}>Documento</Text>
                <Text style={[s.tableHeadCell, { flex: 1, textAlign: 'center' }]}>Estado</Text>
                <Text style={[s.tableHeadCell, { flex: 2 }]}>Comentarios</Text>
              </View>
              {(Array.isArray(documentos) ? documentos : Object.values(documentos || {})).map((doc: any, docIdx: number) => {
                const estado = doc.cumple === true ? 'Cumple' : doc.cumple === false ? 'No Cumple' : '—'
                const estadoColor = doc.cumple === true ? GREEN : doc.cumple === false ? RED : MUTED
                return (
                <View key={docIdx} style={docIdx % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                  <Text style={[s.tableCell, { flex: 1.2, fontSize: 7 }]}>{doc.nombre}</Text>
                  <Text style={[s.tableCell, { flex: 1, textAlign: 'center', fontSize: 7, fontFamily: 'Helvetica-Bold', color: estadoColor }]}>
                    {estado}
                  </Text>
                  <Text style={[s.tableCell, { flex: 2, fontSize: 6.5 }]}>
                    {doc.observacion || '—'}
                  </Text>
                </View>
                )
              })}
            </View>
          </>
        )}

        {/* Capacitaciones */}
        {capacitaciones && (Array.isArray(capacitaciones) ? capacitaciones.length : Object.keys(capacitaciones || {}).length) > 0 && (
          <>
            <SubBanner title="Capacitaciones Realizadas" />
            {(Array.isArray(capacitaciones) ? capacitaciones : Object.values(capacitaciones || {})).map((cap: any, capIdx: number) => (
              <View key={capIdx} style={{ marginBottom: 10, border: `1px solid ${BORDER}`, borderRadius: 4, padding: 8, backgroundColor: '#f9fafb' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: NAVY }}>#{capIdx + 1} — {cap.tematica}</Text>
                  <Text style={{ fontSize: 7, color: MUTED }}>{cap.fecha ? new Date(cap.fecha).toLocaleDateString('es-ES') : '—'}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 16, fontSize: 7 }}>
                  <Text><Text style={{ color: MUTED }}>Hombres:</Text> <Text style={{ fontFamily: 'Helvetica-Bold', color: DARK }}>{cap.hombres || 0}</Text></Text>
                  <Text><Text style={{ color: MUTED }}>Mujeres:</Text> <Text style={{ fontFamily: 'Helvetica-Bold', color: DARK }}>{cap.mujeres || 0}</Text></Text>
                  <Text><Text style={{ color: MUTED }}>Total:</Text> <Text style={{ fontFamily: 'Helvetica-Bold', color: NAVY }}>{cap.total || 0}</Text></Text>
                </View>
              </View>
            ))}
          </>
        )}

        {comentariosGenerales && (
          <>
            <SubBanner title="Comentarios Generales" />
            <TextBlock text={comentariosGenerales} />
          </>
        )}

        <FotosGrid fotos={fotos} />
      </Page>

      {/* PÁGINA 2: ANÁLISIS */}
      <Page size="LETTER" style={s.page}>
        <Footer escuela={esc?.nombre ?? ''} periodo={periodo} />
        <View style={s.sectionBanner}>
          <Text style={s.sectionNum}>8</Text>
          <Text style={s.sectionTitle}>Análisis de Cumplimiento CCT</Text>
        </View>

        {/* Nivel Global */}
        <View style={{ backgroundColor: colorNivel[analisis.nivelGlobal], padding: 12, marginBottom: 12, borderRadius: 4 }}>
          <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#ffffff', marginBottom: 4 }}>
            Nivel Global: {analisis.nivelGlobal.toUpperCase()}
          </Text>
          <Text style={{ fontSize: 7, color: '#ffffff', lineHeight: 1.4 }}>
            {analisis.resumenEjecutivo}
          </Text>
        </View>

        {/* Resumen Ejecutivo */}
        <SubBanner title="Resumen Ejecutivo" />
        <TextBlock text={analisis.resumenEjecutivo} />

        {/* Hallazgos Clasificados por Nivel */}
        {analisis.hallazgos.length > 0 && (
          <>
            <SubBanner title="Hallazgos Identificados" />
            {(['critico', 'alto', 'medio', 'bajo'] as const).map((nivel) => {
              const hallazgosPorNivel = analisis.hallazgos.filter(h => h.nivel === nivel)
              if (hallazgosPorNivel.length === 0) return null

              const emojiNivel = { critico: '🔴', alto: '🟠', medio: '🟡', bajo: '🟢' }[nivel]
              const labelNivel = { critico: 'Crítico', alto: 'Alto', medio: 'Medio', bajo: 'Bajo' }[nivel]
              const cantidad = hallazgosPorNivel.length
              const esUno = cantidad === 1
              const mensajeAccion = nivel === 'critico'
                ? 'se requiere acción inmediata'
                : nivel === 'alto'
                ? 'se requiere corrección en 48 horas'
                : 'se requiere plan de mejora'

              return (
                <View key={nivel} style={{ marginBottom: 14 }}>
                  {/* Recuadro con color del nivel */}
                  <View style={{ backgroundColor: colorNivel[nivel], padding: 10, borderRadius: 4, marginBottom: 8 }}>
                    <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#ffffff', marginBottom: 3 }}>
                      {emojiNivel} Nivel: {labelNivel.toUpperCase()}
                    </Text>
                    <Text style={{ fontSize: 7, color: '#ffffff', lineHeight: 1.3 }}>
                      {esUno
                        ? `Se identificó un hallazgo en el análisis de cumplimiento de código de conducta, ${mensajeAccion}.`
                        : `Se identificaron ${cantidad} hallazgos en el análisis de cumplimiento de código de conducta, ${mensajeAccion}.`
                      }
                    </Text>
                  </View>

                  {/* Tabla de hallazgos del nivel */}
                  <View style={s.table}>
                    <View style={s.tableHead}>
                      <Text style={[s.tableHeadCell, { flex: 1.5 }]}>Hallazgo</Text>
                      <Text style={[s.tableHeadCell, { flex: 1.2 }]}>Categoría</Text>
                      <Text style={[s.tableHeadCell, { flex: 1.3 }]}>Observaciones</Text>
                    </View>
                    {hallazgosPorNivel.map((hallazgo: any, idx: number) => (
                      <View key={idx} style={idx % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                        <Text style={[s.tableCell, { flex: 1.5, fontSize: 6.5 }]}>{hallazgo.item}</Text>
                        <Text style={[s.tableCell, { flex: 1.2, fontSize: 6.5 }]}>{hallazgo.categoria}</Text>
                        <Text style={[s.tableCell, { flex: 1.3, fontSize: 6.5 }]}>{hallazgo.riesgo || '—'}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )
            })}
          </>
        )}

        {/* Acciones Inmediatas */}
        {analisis.accionesInmediatas.length > 0 && (
          <>
            <SubBanner title="Acciones Inmediatas Prioritarias" />
            <View style={{ paddingLeft: 8 }}>
              {analisis.accionesInmediatas.map((accion: string, idx: number) => (
                <Text key={idx} style={{ fontSize: 7, marginBottom: 4, color: DARK }}>
                  {idx + 1}. {accion}
                </Text>
              ))}
            </View>
          </>
        )}
      </Page>
    </>
  )
  } catch (error: any) {
    console.error('Error en SeccionCCT:', error)
    return (
      <Page size="LETTER" style={s.page}>
        <Text style={{ fontSize: 10, color: RED, fontFamily: 'Helvetica-Bold' }}>
          Error al cargar la sección de CCT
        </Text>
        <Text style={{ fontSize: 8, color: RED, marginTop: 10 }}>
          {error?.message || String(error)}
        </Text>
      </Page>
    )
  }
}

// ═══════════════════════════════════════════════════════════════════
// DOCUMENTO COMPLETO
// ═══════════════════════════════════════════════════════════════════
function InformePDF({ data }: { data: any }) {
  return (
    <Document
      title={`Informe SCAS — ${data.esc?.nombre ?? ''} — ${data.periodo}`}
      author="Sistema SCAS · BCIE"
      subject="Informe de Supervisión de Condiciones Ambientales y Sociales"
      creator="SCAS"
    >
      <Portada data={data} />
      <ResumenEjecutivo data={data} />
      <SeccionGenerales data={data} />
      <SeccionHSSO data={data} />
      <SeccionGARO data={data} />
      <SeccionPGR data={data} />
      <SeccionMCEAR data={data} />
      <SeccionPPPI data={data} />
      <SeccionMAQR data={data} />
      <SeccionPRT data={data} />
      <SeccionCCT data={data} />
    </Document>
  )
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENTE PÚBLICO
// ═══════════════════════════════════════════════════════════════════
export default function PdfViewer({ data }: { data: any }) {
  const [preview, setPreview] = useState(false)

  const filename = [
    'Informe_SCAS',
    data.esc?.codigo ?? 'CE',
    data.periodo?.replace(' ', '_') ?? '',
  ].filter(Boolean).join('_') + '.pdf'

  return (
    <div className="space-y-4">
      {/* Tarjeta de info */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-1">Informe técnico listo</h2>
            <p className="text-slate-500 text-sm">
              El PDF incluye portada ejecutiva, resumen, generales y todas las condiciones registradas.
            </p>
          </div>
          <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${
            data.informe?.estado === 'aprobado' ? 'bg-green-100 text-green-700' :
            data.informe?.estado === 'enviado'  ? 'bg-blue-100 text-blue-700' :
                                                   'bg-amber-100 text-amber-700'
          }`}>
            {data.informe?.estado ?? '—'}
          </span>
        </div>

        {/* Secciones incluidas */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {[
            { label: 'Portada',         ok: !!data.portada },
            { label: 'Generales',       ok: !!data.c1317 },
            { label: 'HSSO',            ok: !!data.hsso },
            { label: 'GARO',            ok: !!data.garo },
            { label: 'PGR',             ok: !!data.pgr },
            { label: 'MCEAR',           ok: !!data.mcear },
            { label: 'PPPI',            ok: !!data.pppi },
            { label: 'MAQR',            ok: !!data.maqr },
            { label: 'PRT',             ok: !!data.prt },
          ].map(({ label, ok }) => (
            <div key={label} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
              ok ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-green-500' : 'bg-slate-300'}`} />
              {label}
              {!ok && <span className="ml-auto text-slate-300">pendiente</span>}
            </div>
          ))}
        </div>

        {/* Botones */}
        <div className="flex gap-3">
          <PDFDownloadLink
            document={<InformePDF data={data} />}
            fileName={filename}
            className="flex-1"
          >
            {({ loading }) => (
              <button
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-800 transition disabled:opacity-60 text-sm"
              >
                <Download size={18} />
                {loading ? 'Generando PDF...' : 'Descargar PDF'}
              </button>
            )}
          </PDFDownloadLink>

          <button
            onClick={() => setPreview(p => !p)}
            className="flex items-center gap-2 border border-slate-300 text-slate-700 px-5 py-3 rounded-xl font-medium hover:bg-slate-50 transition text-sm"
          >
            <Eye size={16} />
            {preview ? 'Ocultar' : 'Vista previa'}
          </button>
        </div>
      </div>

      {/* Vista previa inline */}
      {preview && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700">Vista previa del PDF</p>
            <button
              onClick={() => setPreview(false)}
              className="text-slate-400 hover:text-slate-600 text-xs"
            >
              Cerrar
            </button>
          </div>
          <PDFViewer width="100%" height={700} showToolbar={false}>
            <InformePDF data={data} />
          </PDFViewer>
        </div>
      )}
    </div>
  )
}
