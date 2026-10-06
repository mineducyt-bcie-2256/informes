-- Habilitar RLS si no está habilitado
ALTER TABLE informe_cct ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes (si existen)
DROP POLICY IF EXISTS "Allow authenticated users to select" ON informe_cct;
DROP POLICY IF EXISTS "Allow authenticated users to insert" ON informe_cct;
DROP POLICY IF EXISTS "Allow authenticated users to update" ON informe_cct;
DROP POLICY IF EXISTS "Allow programador to manage" ON informe_cct;

-- Crear nueva política permisiva para SELECT
CREATE POLICY "Allow authenticated users to select"
  ON informe_cct
  FOR SELECT
  USING (auth.role() = 'authenticated_user');

-- Crear nueva política permisiva para INSERT
CREATE POLICY "Allow authenticated users to insert"
  ON informe_cct
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated_user');

-- Crear nueva política permisiva para UPDATE
CREATE POLICY "Allow authenticated users to update"
  ON informe_cct
  FOR UPDATE
  USING (auth.role() = 'authenticated_user')
  WITH CHECK (auth.role() = 'authenticated_user');

-- Crear nueva política permisiva para DELETE
CREATE POLICY "Allow authenticated users to delete"
  ON informe_cct
  FOR DELETE
  USING (auth.role() = 'authenticated_user');
