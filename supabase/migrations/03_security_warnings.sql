-- ============================================================
-- Migration 03: Fix de warnings del Security Advisor
-- ============================================================
-- Resuelve:
--   1) function_search_path_mutable (decrement_stock, update_updated_at_column,
--      handle_new_user) → fija search_path
--   2) anon/authenticated_security_definer_function_executable (handle_new_user)
--      → revoca EXECUTE (es un trigger, no debe ser callable vía RPC)
--   3) rls_policy_always_true (analytics_events INSERT) → restringe el WITH CHECK
--   4) decrement_stock se mantiene callable (lo usa el checkout anónimo)
--      pero con search_path fijo y validación de qty.
--
-- NOTA: el warning "auth_leaked_password_protection" se activa desde el panel:
--       Authentication → Policies → "Leaked password protection" → ON.

-- ============================================================
-- 1) Fijar search_path en funciones (sin recrear las definiciones)
-- ============================================================
ALTER FUNCTION public.update_updated_at_column()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.handle_new_user()
  SET search_path = public, pg_temp;

-- ============================================================
-- 2) handle_new_user es un trigger: revocar EXECUTE público
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

-- ============================================================
-- 3) decrement_stock: recrear con search_path y validación
-- ============================================================
CREATE OR REPLACE FUNCTION public.decrement_stock(variant_id uuid, qty integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF qty IS NULL OR qty <= 0 OR qty > 1000 THEN
    RAISE EXCEPTION 'Cantidad inválida';
  END IF;
  IF variant_id IS NULL THEN
    RAISE EXCEPTION 'variant_id requerido';
  END IF;
  UPDATE product_variants
     SET stock = GREATEST(stock - qty, 0)
   WHERE id = variant_id;
END;
$$;

-- decrement_stock SÍ necesita ser callable (checkout anónimo lo invoca).
-- El warning de SECURITY DEFINER es informativo; mitigamos con validación arriba.

-- ============================================================
-- 4) RLS analytics_events: restringir el INSERT abierto
-- ============================================================
DROP POLICY IF EXISTS "Analytics - public write" ON analytics_events;

CREATE POLICY "Analytics insert válido" ON analytics_events
  FOR INSERT
  WITH CHECK (
    -- Requiere que el evento tenga al menos session_id y event_type
    session_id IS NOT NULL
    AND event_type IS NOT NULL
    AND length(event_type) <= 100
  );

-- ============================================================
-- 5) Bucket de Storage para imágenes de productos
-- ============================================================
-- Crea el bucket público si no existe (necesario para uploadProductImage del frontend).
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policies del bucket:
--   - Lectura pública (cualquiera ve las imágenes)
--   - Insert/Update/Delete sólo para admin/superadmin
DROP POLICY IF EXISTS "Lectura pública de imágenes de producto" ON storage.objects;
CREATE POLICY "Lectura pública de imágenes de producto" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Admin sube imágenes de producto" ON storage.objects;
CREATE POLICY "Admin sube imágenes de producto" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin'))
  );

DROP POLICY IF EXISTS "Admin actualiza imágenes de producto" ON storage.objects;
CREATE POLICY "Admin actualiza imágenes de producto" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'product-images'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin'))
  );

DROP POLICY IF EXISTS "Admin borra imágenes de producto" ON storage.objects;
CREATE POLICY "Admin borra imágenes de producto" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'product-images'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin'))
  );
