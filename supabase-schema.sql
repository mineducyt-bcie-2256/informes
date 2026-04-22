-- ============================================================
-- ESQUEMA BASE DE DATOS - INFORME BCIE
-- Ejecutar en Supabase SQL Editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- GRUPOS (Supervisiones)
-- ============================================================
CREATE TABLE grupos (
  id SERIAL PRIMARY KEY,
  numero INTEGER NOT NULL,
  empresa_supervision TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO grupos (numero, empresa_supervision) VALUES
(1,'CONSORCIO (APPLUS-INGELOG-NOVOTEC)'),
(2,'CONSORCIO (APPLUS-INGELOG-NOVOTEC)'),
(3,'CONSORCIO (APPLUS-INGELOG-NOVOTEC)'),
(4,'CONSORCIO (APPLUS-INGELOG-NOVOTEC)'),
(5,'CONSORCIO (APPLUS-INGELOG-NOVOTEC)'),
(6,'CONSORCIO (APPLUS-INGELOG-NOVOTEC)'),
(7,'CONSORCIO (APPLUS-INGELOG-NOVOTEC)'),
(8,'CONSORCIO (APPLUS-INGELOG-NOVOTEC)'),
(9,'CONSORCIO (APPLUS-INGELOG-NOVOTEC)'),
(10,'CONSORCIO (APPLUS-INGELOG-NOVOTEC)'),
(11,'CONSORCIO (APPLUS-INGELOG-NOVOTEC)');

-- ============================================================
-- ESCUELAS
-- ============================================================
CREATE TABLE escuelas (
  id SERIAL PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  departamento TEXT,
  distrito TEXT,
  latitud DECIMAL(10,6),
  longitud DECIMAL(10,6),
  grupo_id INTEGER REFERENCES grupos(id),
  empresa_obras TEXT,
  numero_contrato TEXT,
  empresa_supervision TEXT,
  administrador_contrato TEXT,
  etapa TEXT,
  porcentaje_avance TEXT,
  pegas_elaboracion TEXT,
  pegas_ejecucion TEXT,
  accidentes_acumulados INTEGER DEFAULT 0,
  reubicacion_temporal TEXT,
  activa BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PERFILES DE USUARIO (extiende auth.users)
-- ============================================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('administrador','especialista','supervisor','ejecutor')),
  grupo_id INTEGER REFERENCES grupos(id),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para crear perfil automáticamente al registrar usuario
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, nombre, email, rol)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nombre', NEW.email), NEW.email, 'ejecutor');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- INFORMES (cabecera)
-- ============================================================
CREATE TABLE informes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  escuela_id INTEGER REFERENCES escuelas(id) NOT NULL,
  periodo_mes INTEGER NOT NULL CHECK (periodo_mes BETWEEN 1 AND 12),
  periodo_anio INTEGER NOT NULL,
  creado_por UUID REFERENCES profiles(id),
  estado TEXT DEFAULT 'borrador' CHECK (estado IN ('borrador','enviado','aprobado')),
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(escuela_id, periodo_mes, periodo_anio)
);

-- ============================================================
-- PORTADA DEL INFORME
-- ============================================================
CREATE TABLE informe_portada (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  informe_id UUID REFERENCES informes(id) ON DELETE CASCADE UNIQUE NOT NULL,
  numero_informe INTEGER,
  nombre_proyecto TEXT,
  numero_contrato_supervision TEXT,
  elaborado_por_id UUID REFERENCES profiles(id),
  elaborado_por_cargo TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MIGRACIÓN (si profiles ya existe):
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cargo TEXT;

-- ============================================================
-- HSSO - Higiene, Salud y Seguridad Ocupacional
-- ============================================================
CREATE TABLE informe_hsso (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  informe_id UUID REFERENCES informes(id) ON DELETE CASCADE UNIQUE NOT NULL,
  empresa_contratista TEXT,
  personal_hombres INTEGER DEFAULT 0,
  personal_mujeres INTEGER DEFAULT 0,
  personal_total INTEGER DEFAULT 0,
  epp_entregado TEXT,
  epp_personal_cubierto INTEGER DEFAULT 0,
  epp_sin_uso INTEGER DEFAULT 0,
  epp_recomendaciones TEXT,
  acc1_gravedad TEXT,
  acc1_causa TEXT,
  acc1_tipo_lesion TEXT,
  acc1_descripcion TEXT,
  acc2_gravedad TEXT,
  acc2_causa TEXT,
  acc2_tipo_lesion TEXT,
  acc2_descripcion TEXT,
  acc3_gravedad TEXT,
  acc3_causa TEXT,
  acc3_tipo_lesion TEXT,
  acc3_descripcion TEXT,
  cap_cantidad INTEGER DEFAULT 0,
  cap_personal INTEGER DEFAULT 0,
  cap_tema1 TEXT,
  cap_tema2 TEXT,
  cap_tema3 TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- GARO - Gestión de Aguas Residuales Ordinarias
-- ============================================================
CREATE TABLE informe_garo (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  informe_id UUID REFERENCES informes(id) ON DELETE CASCADE UNIQUE NOT NULL,
  empresa_contratista TEXT,
  personal_hombres INTEGER DEFAULT 0,
  personal_mujeres INTEGER DEFAULT 0,
  personal_total INTEGER DEFAULT 0,
  sanitario_tipo TEXT,
  sanitario_hombres INTEGER DEFAULT 0,
  sanitario_mujeres INTEGER DEFAULT 0,
  sanitario_total INTEGER DEFAULT 0,
  agua_procedencia TEXT,
  manejo_aguas_residuales TEXT,
  control_polvo TEXT,
  mejora_aguas_negras TEXT,
  mejora_agua_potable TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PGR - Plan de Gestión de Residuos
-- ============================================================
CREATE TABLE informe_pgr (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  informe_id UUID REFERENCES informes(id) ON DELETE CASCADE UNIQUE NOT NULL,
  empresa_contratista TEXT,
  dem_no_peligrosos BOOLEAN DEFAULT false,
  dem_no_pel_detalle TEXT,
  dem_peligrosos BOOLEAN DEFAULT false,
  dem_pel_detalle TEXT,
  dem_inertes BOOLEAN DEFAULT false,
  dem_inertes_detalle TEXT,
  con_no_peligrosos BOOLEAN DEFAULT false,
  con_no_pel_tratamiento TEXT,
  con_peligrosos BOOLEAN DEFAULT false,
  con_pel_tratamiento TEXT,
  con_inertes BOOLEAN DEFAULT false,
  con_inertes_tratamiento TEXT,
  cap_cantidad INTEGER DEFAULT 0,
  cap_personal INTEGER DEFAULT 0,
  cap_tema1 TEXT,
  cap_tema2 TEXT,
  cap_tema3 TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MCEAR - Monitoreo de Emisiones Atmosféricas y Ruido
-- ============================================================
CREATE TABLE informe_mcear (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  informe_id UUID REFERENCES informes(id) ON DELETE CASCADE UNIQUE NOT NULL,
  mes1_pm10 DECIMAL, mes1_pm25 DECIMAL, mes1_pm1 DECIMAL,
  mes1_humedad DECIMAL, mes1_temperatura DECIMAL, mes1_ruido DECIMAL,
  mes2_pm10 DECIMAL, mes2_pm25 DECIMAL, mes2_pm1 DECIMAL,
  mes2_humedad DECIMAL, mes2_temperatura DECIMAL, mes2_ruido DECIMAL,
  mes3_pm10 DECIMAL, mes3_pm25 DECIMAL, mes3_pm1 DECIMAL,
  mes3_humedad DECIMAL, mes3_temperatura DECIMAL, mes3_ruido DECIMAL,
  observacion_general TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PPPI - Plan de Participación de Partes Interesadas
-- ============================================================
CREATE TABLE informe_pppi (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  informe_id UUID REFERENCES informes(id) ON DELETE CASCADE UNIQUE NOT NULL,
  descripcion_condicion TEXT,
  partes_interesadas JSONB,
  socializacion1_fecha DATE,
  socializacion2_fecha DATE,
  socializacion3_fecha DATE,
  comentarios_socializacion TEXT,
  codigo_conducta TEXT,
  cc_personal_involucrado INTEGER DEFAULT 0,
  tiene_capacitaciones TEXT,
  capacitaciones_list JSONB,
  observaciones TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MIGRACIÓN: columnas nuevas en informe_pppi (ejecutar si la tabla ya existe)
-- ============================================================
-- ALTER TABLE informe_pppi ADD COLUMN IF NOT EXISTS descripcion_condicion TEXT;
-- ALTER TABLE informe_pppi ADD COLUMN IF NOT EXISTS partes_interesadas JSONB;
-- ALTER TABLE informe_pppi ADD COLUMN IF NOT EXISTS comentarios_socializacion TEXT;
-- ALTER TABLE informe_pppi ADD COLUMN IF NOT EXISTS tiene_capacitaciones TEXT;
-- ALTER TABLE informe_pppi ADD COLUMN IF NOT EXISTS capacitaciones_list JSONB;

-- ============================================================
-- MAQR - Mecanismo de Atención de Quejas y Reclamos
-- ============================================================
CREATE TABLE informe_maqr (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  informe_id UUID REFERENCES informes(id) ON DELETE CASCADE UNIQUE NOT NULL,
  descripcion_condicion TEXT,
  medios_recepcion JSONB,
  telefono_maqr TEXT,
  cantidad_quejas INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MIGRACIÓN (si la tabla ya existe):
-- ALTER TABLE informe_maqr ADD COLUMN IF NOT EXISTS descripcion_condicion TEXT;
-- ALTER TABLE informe_maqr ADD COLUMN IF NOT EXISTS medios_recepcion JSONB;

CREATE TABLE informe_maqr_quejas (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  maqr_id UUID REFERENCES informe_maqr(id) ON DELETE CASCADE,
  numero_queja INTEGER,
  medio TEXT,
  medio_otro TEXT,
  fecha_recepcion DATE,
  fecha_resolucion DATE,
  fecha_cierre DATE,
  dias_proceso INTEGER,
  tipo_queja TEXT,
  tipo_queja_otro TEXT,
  origen TEXT,
  origen_otro TEXT,
  nivel_gravedad TEXT,
  descripcion TEXT,
  medidas JSONB,
  estado TEXT,
  arrastrada BOOLEAN DEFAULT false
);

-- MIGRACIÓN (si la tabla ya existe):
-- ALTER TABLE informe_maqr_quejas ADD COLUMN IF NOT EXISTS medio TEXT;
-- ALTER TABLE informe_maqr_quejas ADD COLUMN IF NOT EXISTS medio_otro TEXT;
-- ALTER TABLE informe_maqr_quejas ADD COLUMN IF NOT EXISTS fecha_cierre DATE;
-- ALTER TABLE informe_maqr_quejas ADD COLUMN IF NOT EXISTS tipo_queja_otro TEXT;
-- ALTER TABLE informe_maqr_quejas ADD COLUMN IF NOT EXISTS origen_otro TEXT;
-- ALTER TABLE informe_maqr_quejas ADD COLUMN IF NOT EXISTS medidas JSONB;
-- ALTER TABLE informe_maqr_quejas ADD COLUMN IF NOT EXISTS arrastrada BOOLEAN DEFAULT false;

-- ============================================================
-- PRT - Plan de Reubicación Temporal
-- ============================================================
CREATE TABLE informe_prt (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  informe_id UUID REFERENCES informes(id) ON DELETE CASCADE UNIQUE NOT NULL,
  empresa_contratista TEXT,
  descripcion_condicion TEXT,
  -- Modalidad (array: ['Presencial','Virtual'])
  modalidad JSONB,
  -- Lugares de reubicación (array de {id, direccion})
  lugares JSONB,
  -- Personal
  est_ninos INTEGER DEFAULT 0,
  est_ninas INTEGER DEFAULT 0,
  num_estudiantes INTEGER DEFAULT 0,
  doc_hombres INTEGER DEFAULT 0,
  doc_mujeres INTEGER DEFAULT 0,
  num_maestros INTEGER DEFAULT 0,
  -- Condición de uso {prestamo, alquiler, alquiler_monto}
  condicion_uso JSONB,
  -- Adecuaciones detalle {key: {activa, descripcion}}
  adecuaciones_detalle JSONB,
  -- Monto total
  monto_total DECIMAL,
  -- Costos mensuales {energia, agua, internet, sanitario}
  costos_mensuales JSONB,
  -- Columnas legacy (compatibilidad)
  tipo_continuidad TEXT,
  lugar_reubicacion TEXT,
  tipo_uso TEXT,
  adecuaciones TEXT,
  monto_mensual DECIMAL,
  energia_electrica TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MIGRACIÓN (si la tabla ya existe):
-- ALTER TABLE informe_prt ADD COLUMN IF NOT EXISTS descripcion_condicion TEXT;
-- ALTER TABLE informe_prt ADD COLUMN IF NOT EXISTS modalidad JSONB;
-- ALTER TABLE informe_prt ADD COLUMN IF NOT EXISTS lugares JSONB;
-- ALTER TABLE informe_prt ADD COLUMN IF NOT EXISTS est_ninos INTEGER DEFAULT 0;
-- ALTER TABLE informe_prt ADD COLUMN IF NOT EXISTS est_ninas INTEGER DEFAULT 0;
-- ALTER TABLE informe_prt ADD COLUMN IF NOT EXISTS doc_hombres INTEGER DEFAULT 0;
-- ALTER TABLE informe_prt ADD COLUMN IF NOT EXISTS doc_mujeres INTEGER DEFAULT 0;
-- ALTER TABLE informe_prt ADD COLUMN IF NOT EXISTS condicion_uso JSONB;
-- ALTER TABLE informe_prt ADD COLUMN IF NOT EXISTS adecuaciones_detalle JSONB;
-- ALTER TABLE informe_prt ADD COLUMN IF NOT EXISTS costos_mensuales JSONB;
-- ALTER TABLE informe_prt ADD COLUMN IF NOT EXISTS virtual JSONB;

-- ============================================================
-- CONDICION 13-17 - Personal Ambiental y Social del Proyecto
-- ============================================================
CREATE TABLE informe_c1317 (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  informe_id UUID REFERENCES informes(id) ON DELETE CASCADE UNIQUE NOT NULL,
  -- Textos generales (cargados del informe anterior)
  introduccion TEXT,
  objetivo TEXT,
  alcance TEXT,
  -- Especialistas por empresa (JSONB: [{id, cargo, nombre, correo, tel}])
  especialistas_contratista JSONB,
  especialistas_supervision JSONB,
  -- Permiso Ambiental MARN
  marn_numero_permiso TEXT,
  marn_fecha_emision DATE,
  marn_fecha_vencimiento DATE,
  marn_observaciones TEXT,
  -- Permiso DOT
  dot_numero_permiso TEXT,
  dot_tipo_permiso TEXT,
  dot_fecha_emision DATE,
  dot_fecha_vencimiento DATE,
  dot_observaciones TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MIGRACIÓN (si la tabla ya existe):
-- ALTER TABLE informe_c1317 ADD COLUMN IF NOT EXISTS introduccion TEXT;
-- ALTER TABLE informe_c1317 ADD COLUMN IF NOT EXISTS objetivo TEXT;
-- ALTER TABLE informe_c1317 ADD COLUMN IF NOT EXISTS alcance TEXT;
-- ALTER TABLE informe_c1317 ADD COLUMN IF NOT EXISTS especialistas_contratista JSONB;
-- ALTER TABLE informe_c1317 ADD COLUMN IF NOT EXISTS especialistas_supervision JSONB;
-- ALTER TABLE escuelas ADD COLUMN IF NOT EXISTS resolucion_ambiental TEXT;
-- ALTER TABLE informe_c1317 ADD COLUMN IF NOT EXISTS marn_numero_permiso TEXT;
-- ALTER TABLE informe_c1317 ADD COLUMN IF NOT EXISTS marn_fecha_emision DATE;
-- ALTER TABLE informe_c1317 ADD COLUMN IF NOT EXISTS marn_fecha_vencimiento DATE;
-- ALTER TABLE informe_c1317 ADD COLUMN IF NOT EXISTS marn_observaciones TEXT;
-- ALTER TABLE informe_c1317 ADD COLUMN IF NOT EXISTS dot_numero_permiso TEXT;
-- ALTER TABLE informe_c1317 ADD COLUMN IF NOT EXISTS dot_tipo_permiso TEXT;
-- ALTER TABLE informe_c1317 ADD COLUMN IF NOT EXISTS dot_fecha_emision DATE;
-- ALTER TABLE informe_c1317 ADD COLUMN IF NOT EXISTS dot_fecha_vencimiento DATE;
-- ALTER TABLE informe_c1317 ADD COLUMN IF NOT EXISTS dot_observaciones TEXT;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE informe_portada ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE escuelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE informes ENABLE ROW LEVEL SECURITY;
ALTER TABLE informe_hsso ENABLE ROW LEVEL SECURITY;
ALTER TABLE informe_garo ENABLE ROW LEVEL SECURITY;
ALTER TABLE informe_pgr ENABLE ROW LEVEL SECURITY;
ALTER TABLE informe_mcear ENABLE ROW LEVEL SECURITY;
ALTER TABLE informe_pppi ENABLE ROW LEVEL SECURITY;
ALTER TABLE informe_maqr ENABLE ROW LEVEL SECURITY;
ALTER TABLE informe_maqr_quejas ENABLE ROW LEVEL SECURITY;
ALTER TABLE informe_prt ENABLE ROW LEVEL SECURITY;
ALTER TABLE informe_c1317 ENABLE ROW LEVEL SECURITY;

-- Política: usuarios autenticados pueden leer/escribir
CREATE POLICY "auth_all" ON informe_portada FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON grupos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON escuelas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON informes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON informe_hsso FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON informe_garo FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON informe_pgr FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON informe_mcear FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON informe_pppi FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON informe_maqr FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON informe_maqr_quejas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON informe_prt FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON informe_c1317 FOR ALL TO authenticated USING (true) WITH CHECK (true);
