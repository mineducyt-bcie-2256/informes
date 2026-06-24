-- ============================================
-- FIX: RLS para informe_casos_especiales
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- 1. Habilitar RLS (si no está habilitado)
ALTER TABLE informe_casos_especiales ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas viejas (si existen)
DROP POLICY IF EXISTS "Allow users to read their informes casos especiales" ON informe_casos_especiales;
DROP POLICY IF EXISTS "Allow users to insert casos especiales" ON informe_casos_especiales;
DROP POLICY IF EXISTS "Allow users to update their casos especiales" ON informe_casos_especiales;
DROP POLICY IF EXISTS "Allow users to delete their casos especiales" ON informe_casos_especiales;

-- 3. Crear política SELECT (leer)
CREATE POLICY "Allow users to read their informes casos especiales"
ON informe_casos_especiales FOR SELECT
USING (
  informe_id IN (
    SELECT id FROM informes
    WHERE creado_por = auth.uid()
  )
);

-- 4. Crear política INSERT (insertar/crear)
CREATE POLICY "Allow users to insert casos especiales"
ON informe_casos_especiales FOR INSERT
WITH CHECK (
  informe_id IN (
    SELECT id FROM informes
    WHERE creado_por = auth.uid()
  )
);

-- 5. Crear política UPDATE (actualizar)
CREATE POLICY "Allow users to update their casos especiales"
ON informe_casos_especiales FOR UPDATE
USING (
  informe_id IN (
    SELECT id FROM informes
    WHERE creado_por = auth.uid()
  )
)
WITH CHECK (
  informe_id IN (
    SELECT id FROM informes
    WHERE creado_por = auth.uid()
  )
);

-- 6. Crear política DELETE (eliminar)
CREATE POLICY "Allow users to delete their casos especiales"
ON informe_casos_especiales FOR DELETE
USING (
  informe_id IN (
    SELECT id FROM informes
    WHERE creado_por = auth.uid()
  )
);
