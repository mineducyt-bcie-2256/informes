-- ============================================================
-- CUMPLIMIENTO AMBIENTAL - Riesgos Críticos (Condición 9)
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Crear tabla informe_cumplimiento_ambiental
CREATE TABLE informe_cumplimiento_ambiental (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  informe_id UUID REFERENCES informes(id) ON DELETE CASCADE UNIQUE NOT NULL,
  descripcion_condicion TEXT,
  -- Tala de Árboles
  tala_se_realizara BOOLEAN,
  tala_tiene_permiso BOOLEAN,
  tala_tipo_permiso TEXT,
  tala_tiene_plan_compensacion BOOLEAN,
  tala_alerta_critica BOOLEAN DEFAULT false,
  -- Asbesto Cemento
  asbesto_presencia_msac BOOLEAN,
  asbesto_tiene_plan BOOLEAN,
  asbesto_alerta_critica BOOLEAN DEFAULT false,
  asbesto_metros_cuadrados DECIMAL,
  -- Biodiversidad
  biodiversidad_tiene_danos BOOLEAN,
  biodiversidad_descripcion TEXT,
  -- Reubicación Involuntaria
  reubicacion_involuntaria BOOLEAN,
  reubicacion_tiene_pri BOOLEAN,
  reubicacion_alerta_critica BOOLEAN DEFAULT false,
  reubicacion_sitio_pri TEXT,
  reubicacion_condiciones TEXT,
  reubicacion_estado TEXT,
  -- Metadatos
  fotos JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE informe_cumplimiento_ambiental ENABLE ROW LEVEL SECURITY;

-- Crear política de seguridad
CREATE POLICY "auth_all" ON informe_cumplimiento_ambiental FOR ALL TO authenticated USING (true) WITH CHECK (true);
