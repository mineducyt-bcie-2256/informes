'use client'
import {
  PDFDownloadLink, Document, Page, Text, View, StyleSheet,
  PDFViewer, Image,
} from '@react-pdf/renderer'
import { Download, Eye } from 'lucide-react'
import { useState } from 'react'

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
// Carta: 612pt - 45*2 margen = 522pt contenido. 2 fotos + 10 separación = 256pt c/u
const FW = 256
const FH = 170

function FotosGrid({ fotos }: { fotos: any[] }) {
  if (!fotos?.length) return null

  const pares: any[][] = []
  for (let i = 0; i < fotos.length; i += 2) pares.push(fotos.slice(i, i + 2))

  return (
    <>
      <SubBanner title="Registro Fotográfico" />
      {pares.map((par, ri) => (
        <View key={ri} style={{ flexDirection: 'row', marginBottom: 12 }}>
          {/* columna izquierda */}
          <View style={{ width: FW, marginRight: 10 }}>
            <Image src={par[0].url} style={{ width: FW, height: FH, borderRadius: 3 }} />
            {par[0].descripcion
              ? <Text style={{ fontSize: 7, color: MUTED, marginTop: 3, textAlign: 'center' }}>{par[0].descripcion}</Text>
              : null}
          </View>
          {/* columna derecha */}
          {par[1] && (
            <View style={{ width: FW }}>
              <Image src={par[1].url} style={{ width: FW, height: FH, borderRadius: 3 }} />
              {par[1].descripcion
                ? <Text style={{ fontSize: 7, color: MUTED, marginTop: 3, textAlign: 'center' }}>{par[1].descripcion}</Text>
                : null}
            </View>
          )}
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
  const { esc, periodo, garo } = data
  if (!garo) return null

  const actividades: any[] = garo.actividades ?? []

  return (
    <Page size="LETTER" style={s.page}>
      <Footer escuela={esc?.nombre ?? ''} periodo={periodo} />

      <View style={s.sectionBanner}>
        <Text style={s.sectionNum}>2</Text>
        <Text style={s.sectionTitle}>Condición 2 — Gestión de Aguas Residuales Ordinarias (GARO)</Text>
      </View>

      {garo.descripcion_condicion && (
        <>
          <SubBanner title="Descripción de la condición" />
          <TextBlock text={garo.descripcion_condicion} />
        </>
      )}

      {/* Personal */}
      <SubBanner title="Personal en obra" />
      <View style={s.cols2}>
        <View style={s.col}>
          <Field label="Hombres" value={garo.personal_hombres} />
          <Field label="Mujeres" value={garo.personal_mujeres} />
          <Field label="Total" value={garo.personal_total} />
        </View>
        <View style={s.col}>
          <Field label="Tipo de sanitario" value={garo.sanitario_tipo} />
          <Field label="Sanitarios hombres" value={garo.sanitario_hombres} />
          <Field label="Sanitarios mujeres" value={garo.sanitario_mujeres} />
        </View>
      </View>

      {/* Agua */}
      <SubBanner title="Uso y manejo del agua" />
      <Field label="Procedencia del agua" value={garo.agua_procedencia} />
      <Field label="Manejo de aguas residuales" value={garo.manejo_aguas_residuales} />
      <Field label="Sistema de tratamiento" value={garo.sistema_tratamiento} />

      {/* Actividades */}
      {actividades.length > 0 && (
        <>
          <SubBanner title="Actividades que generan aguas residuales" />
          <View style={s.table}>
            <View style={s.tableHead}>
              <Text style={[s.tableHeadCell, { flex: 2 }]}>Categoría</Text>
              <Text style={[s.tableHeadCell, { flex: 2 }]}>Actividad</Text>
            </View>
            {actividades.map((a: any, i: number) => (
              <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                <Text style={[s.tableCell, { flex: 2 }]}>{val(a.categoria)}</Text>
                <Text style={[s.tableCell, { flex: 2 }]}>{val(a.actividad)}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Observaciones */}
      {garo.observaciones && (
        <>
          <SubBanner title="Observaciones" />
          <TextBlock text={garo.observaciones} />
        </>
      )}

      {/* Incidentes */}
      <SubBanner title="Reporte de incidentes / incumplimientos" />
      <Field label="¿Se identificaron incidentes ambientales?" value={garo.tiene_incidentes ?? '—'} />
      {(garo.incidentes ?? []).length > 0 && (
        <View style={s.table}>
          <View style={s.tableHead}>
            <Text style={[s.tableHeadCell, { flex: 1.5 }]}>Tipo de incidente</Text>
            <Text style={[s.tableHeadCell, { flex: 1.2 }]}>Ubicación</Text>
            <Text style={[s.tableHeadCell, { flex: 1.5 }]}>Fecha y hora</Text>
            <Text style={[s.tableHeadCell, { flex: 2 }]}>Descripción</Text>
            <Text style={[s.tableHeadCell, { flex: 2 }]}>Medidas correctivas</Text>
          </View>
          {(garo.incidentes as any[]).map((item: any, i: number) => (
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
        <>
          <SubBanner title="Descripción de la condición" />
          <TextBlock text={pgr.descripcion_condicion} />
        </>
      )}

      {/* Residuos demolición */}
      <SubBanner title="Residuos de demolición" />
      <View style={s.cols2}>
        <View style={[s.col, s.card]}>
          <Text style={s.cardTitle}>No peligrosos</Text>
          <SiNo v={pgr.dem_no_peligrosos} />
          {pgr.dem_no_pel_detalle && (
            <Text style={[s.textBlock, { marginTop: 4 }]}>{pgr.dem_no_pel_detalle}</Text>
          )}
        </View>
        <View style={[s.col, s.card]}>
          <Text style={s.cardTitle}>Peligrosos</Text>
          <SiNo v={pgr.dem_peligrosos} />
          {pgr.dem_pel_detalle && (
            <Text style={[s.textBlock, { marginTop: 4 }]}>{pgr.dem_pel_detalle}</Text>
          )}
        </View>
      </View>

      {/* Residuos construcción */}
      <SubBanner title="Residuos de construcción" />
      <View style={s.cols2}>
        <View style={[s.col, s.card]}>
          <Text style={s.cardTitle}>No peligrosos</Text>
          <SiNo v={pgr.con_no_peligrosos} />
          {pgr.con_no_pel_tratamiento && (
            <Field label="Tratamiento" value={pgr.con_no_pel_tratamiento} />
          )}
        </View>
        <View style={[s.col, s.card]}>
          <Text style={s.cardTitle}>Peligrosos</Text>
          <SiNo v={pgr.con_peligrosos} />
          {pgr.con_pel_detalle && (
            <Text style={[s.textBlock, { marginTop: 4 }]}>{pgr.con_pel_detalle}</Text>
          )}
        </View>
      </View>

      {pgr.observaciones && (
        <>
          <SubBanner title="Observaciones" />
          <TextBlock text={pgr.observaciones} />
        </>
      )}
      <FotosGrid fotos={pgr.fotos ?? []} />
    </Page>
  )
}

// ═══════════════════════════════════════════════════════════════════
// MCEAR
// ═══════════════════════════════════════════════════════════════════
function SeccionMCEAR({ data }: { data: any }) {
  const { esc, periodo, mcear } = data
  if (!mcear) return null

  const mediciones: any[] = mcear.mediciones ?? []

  return (
    <Page size="LETTER" style={s.page}>
      <Footer escuela={esc?.nombre ?? ''} periodo={periodo} />

      <View style={s.sectionBanner}>
        <Text style={s.sectionNum}>4</Text>
        <Text style={s.sectionTitle}>Condición 4 — Monitoreo de Calidad de Emisiones y Ruido (MCEAR)</Text>
      </View>

      {mcear.descripcion_condicion && (
        <>
          <SubBanner title="Descripción de la condición" />
          <TextBlock text={mcear.descripcion_condicion} />
        </>
      )}

      <SubBanner title="Datos de emisiones y ruido" />
      <View style={s.cols2}>
        <View style={s.col}>
          <Field label="Nivel de polvo" value={mcear.nivel_polvo} />
          <Field label="Control de polvo" value={mcear.control_polvo} />
        </View>
        <View style={s.col}>
          <Field label="Nivel de ruido" value={mcear.nivel_ruido} />
          <Field label="Medidas de mitigación" value={mcear.mitigacion_ruido} />
        </View>
      </View>

      {mediciones.length > 0 && (
        <>
          <SubBanner title="Mediciones registradas" />
          <View style={s.table}>
            <View style={s.tableHead}>
              <Text style={s.tableHeadCell}>Tipo</Text>
              <Text style={s.tableHeadCell}>Fecha</Text>
              <Text style={s.tableHeadCell}>Resultado</Text>
              <Text style={[s.tableHeadCell, { flex: 2 }]}>Observación</Text>
            </View>
            {mediciones.map((m: any, i: number) => (
              <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                <Text style={s.tableCell}>{val(m.tipo)}</Text>
                <Text style={s.tableCell}>{val(m.fecha)}</Text>
                <Text style={s.tableCell}>{val(m.resultado)}</Text>
                <Text style={[s.tableCell, { flex: 2 }]}>{val(m.observacion)}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {mcear.observaciones && (
        <>
          <SubBanner title="Observaciones" />
          <TextBlock text={mcear.observaciones} />
        </>
      )}
      <FotosGrid fotos={mcear.fotos ?? []} />
    </Page>
  )
}

// ═══════════════════════════════════════════════════════════════════
// PPPI
// ═══════════════════════════════════════════════════════════════════
function SeccionPPPI({ data }: { data: any }) {
  const { esc, periodo, pppi } = data
  if (!pppi) return null

  const reuniones: any[] = pppi.reuniones ?? []

  return (
    <Page size="LETTER" style={s.page}>
      <Footer escuela={esc?.nombre ?? ''} periodo={periodo} />

      <View style={s.sectionBanner}>
        <Text style={s.sectionNum}>5</Text>
        <Text style={s.sectionTitle}>Condición 5 — Plan de Participación de Partes Interesadas (PPPI)</Text>
      </View>

      {pppi.descripcion_condicion && (
        <>
          <SubBanner title="Descripción de la condición" />
          <TextBlock text={pppi.descripcion_condicion} />
        </>
      )}

      <SubBanner title="Código de conducta" />
      <View style={s.cols2}>
        <View style={s.col}>
          <View style={s.fieldRow}>
            <Text style={s.fieldLabel}>Código de conducta:</Text>
            <SiNo v={pppi.codigo_conducta} />
          </View>
          <Field label="Fecha de firma" value={pppi.codigo_conducta_fecha} />
        </View>
        <View style={s.col}>
          <Field label="Personal capacitado" value={pppi.personal_capacitado} />
          <Field label="Observaciones" value={pppi.observaciones_conducta} />
        </View>
      </View>

      {reuniones.length > 0 && (
        <>
          <SubBanner title="Reuniones con partes interesadas" />
          <View style={s.table}>
            <View style={s.tableHead}>
              <Text style={[s.tableHeadCell, { flex: 2 }]}>Tema</Text>
              <Text style={s.tableHeadCell}>Fecha</Text>
              <Text style={s.tableHeadCell}>Participantes</Text>
              <Text style={[s.tableHeadCell, { flex: 2 }]}>Resultado</Text>
            </View>
            {reuniones.map((r: any, i: number) => (
              <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                <Text style={[s.tableCell, { flex: 2 }]}>{val(r.tema)}</Text>
                <Text style={s.tableCell}>{val(r.fecha)}</Text>
                <Text style={s.tableCell}>{val(r.participantes)}</Text>
                <Text style={[s.tableCell, { flex: 2 }]}>{val(r.resultado)}</Text>
              </View>
            ))}
          </View>
        </>
      )}
      <FotosGrid fotos={pppi.fotos ?? []} />
    </Page>
  )
}

// ═══════════════════════════════════════════════════════════════════
// MAQR
// ═══════════════════════════════════════════════════════════════════
function SeccionMAQR({ data }: { data: any }) {
  const { esc, periodo, maqr } = data
  if (!maqr) return null

  const quejas: any[] = maqr.quejas_list ?? []

  return (
    <Page size="LETTER" style={s.page}>
      <Footer escuela={esc?.nombre ?? ''} periodo={periodo} />

      <View style={s.sectionBanner}>
        <Text style={s.sectionNum}>6</Text>
        <Text style={s.sectionTitle}>Condición 6 — Mecanismo de Atención de Quejas y Reclamos (MAQR)</Text>
      </View>

      {maqr.descripcion_condicion && (
        <>
          <SubBanner title="Descripción de la condición" />
          <TextBlock text={maqr.descripcion_condicion} />
        </>
      )}

      <SubBanner title="Canal de quejas" />
      <View style={s.cols2}>
        <View style={s.col}>
          <Field label="Teléfono MAQR" value={maqr.telefono_maqr} />
          <Field label="Correo MAQR" value={maqr.correo_maqr} />
        </View>
        <View style={s.col}>
          <View style={s.fieldRow}>
            <Text style={s.fieldLabel}>Libro de quejas visible:</Text>
            <SiNo v={maqr.libro_quejas_visible} />
          </View>
          <View style={[s.kpiBox, { marginTop: 4 }]}>
            <Text style={[s.kpiNum, { color: parseInt(maqr.cantidad_quejas) > 0 ? AMBER : GREEN }]}>
              {val(maqr.cantidad_quejas, '0')}
            </Text>
            <Text style={s.kpiLabel}>Quejas registradas</Text>
          </View>
        </View>
      </View>

      {quejas.length > 0 && (
        <>
          <SubBanner title="Detalle de quejas" />
          <View style={s.table}>
            <View style={s.tableHead}>
              <Text style={s.tableHeadCell}>N.°</Text>
              <Text style={[s.tableHeadCell, { flex: 2 }]}>Descripción</Text>
              <Text style={s.tableHeadCell}>Fecha</Text>
              <Text style={s.tableHeadCell}>Estado</Text>
              <Text style={[s.tableHeadCell, { flex: 2 }]}>Resolución</Text>
            </View>
            {quejas.map((q: any, i: number) => (
              <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                <Text style={s.tableCell}>{i + 1}</Text>
                <Text style={[s.tableCell, { flex: 2 }]}>{val(q.descripcion)}</Text>
                <Text style={s.tableCell}>{val(q.fecha)}</Text>
                <Text style={s.tableCell}>{val(q.estado)}</Text>
                <Text style={[s.tableCell, { flex: 2 }]}>{val(q.resolucion)}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {maqr.observaciones && (
        <>
          <SubBanner title="Observaciones" />
          <TextBlock text={maqr.observaciones} />
        </>
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

  return (
    <Page size="LETTER" style={s.page}>
      <Footer escuela={esc?.nombre ?? ''} periodo={periodo} />

      <View style={s.sectionBanner}>
        <Text style={s.sectionNum}>7</Text>
        <Text style={s.sectionTitle}>Condición 7 — Plan de Reubicación Temporal (PRT)</Text>
      </View>

      {prt.descripcion_condicion && (
        <>
          <SubBanner title="Descripción de la condición" />
          <TextBlock text={prt.descripcion_condicion} />
        </>
      )}

      <SubBanner title="Datos de reubicación" />
      <View style={s.cols2}>
        <View style={s.col}>
          <Field label="Tipo de continuidad" value={prt.tipo_continuidad} />
          <Field label="Lugar de reubicación" value={prt.lugar_reubicacion} />
          <Field label="Dirección" value={prt.direccion_reubicacion} />
        </View>
        <View style={s.col}>
          <View style={s.kpiRow}>
            <View style={s.kpiBox}>
              <Text style={s.kpiNum}>{val(prt.num_estudiantes, '0')}</Text>
              <Text style={s.kpiLabel}>Estudiantes</Text>
            </View>
            <View style={s.kpiBox}>
              <Text style={s.kpiNum}>{val(prt.num_maestros, '0')}</Text>
              <Text style={s.kpiLabel}>Maestros</Text>
            </View>
          </View>
          {prt.monto_mensual && (
            <Field label="Monto mensual" value={`$${prt.monto_mensual}`} />
          )}
        </View>
      </View>

      {lugares.length > 0 && (
        <>
          <SubBanner title="Lugares de reubicación" />
          <View style={s.table}>
            <View style={s.tableHead}>
              <Text style={[s.tableHeadCell, { flex: 2 }]}>Lugar</Text>
              <Text style={s.tableHeadCell}>Nivel</Text>
              <Text style={s.tableHeadCell}>Estudiantes</Text>
              <Text style={s.tableHeadCell}>Aulas</Text>
            </View>
            {lugares.map((l: any, i: number) => (
              <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                <Text style={[s.tableCell, { flex: 2 }]}>{val(l.nombre)}</Text>
                <Text style={s.tableCell}>{val(l.nivel)}</Text>
                <Text style={s.tableCell}>{val(l.estudiantes)}</Text>
                <Text style={s.tableCell}>{val(l.aulas)}</Text>
              </View>
            ))}
          </View>
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
