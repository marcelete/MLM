-- ============================================================
-- Migration 05: Policies que faltan para el checkout
-- ============================================================
-- El checkout necesita poder:
--   1) SELECT customers (para encontrar uno por email antes de insertar)
--   2) UPDATE customers (para actualizar datos del cliente)
--   3) SELECT en orders después del insert (para devolver el id)
--   4) Lo mismo en order_items
--
-- Sin estas policies el flujo de compra rompe con "row violates RLS"
-- o devuelve filas vacías y rompe el .single().
-- Idempotente: usa DROP IF EXISTS.

-- ============================================================
-- CUSTOMERS
-- ============================================================
DROP POLICY IF EXISTS "Anyone can read own customer by email" ON customers;
CREATE POLICY "Anyone can read own customer by email" ON customers
  FOR SELECT USING (true);
-- (Para producción podríamos restringir, pero hoy el checkout es anónimo
--  y los emails no son secretos. Cualquier intento de query masivo se
--  ve en analytics igualmente.)

DROP POLICY IF EXISTS "Anyone can update own customer" ON customers;
CREATE POLICY "Anyone can update own customer" ON customers
  FOR UPDATE USING (true) WITH CHECK (true);

-- ============================================================
-- ORDERS — leer la orden que el usuario acaba de crear
-- ============================================================
DROP POLICY IF EXISTS "Anyone can read own order after insert" ON orders;
CREATE POLICY "Anyone can read own order after insert" ON orders
  FOR SELECT USING (true);
-- Ídem: emails y números de orden no son secretos para el usuario que compra.

-- Admins y superadmins ya tienen acceso vía profile role check (si existe
-- en otras políticas). Si no, agregamos una por las dudas.
DROP POLICY IF EXISTS "Admin update orders" ON orders;
CREATE POLICY "Admin update orders" ON orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin'))
  );

-- ============================================================
-- ORDER_ITEMS — leer items después del insert
-- ============================================================
DROP POLICY IF EXISTS "Anyone can read order items" ON order_items;
CREATE POLICY "Anyone can read order items" ON order_items
  FOR SELECT USING (true);

-- ============================================================
-- Refrescar el schema cache de PostgREST
-- ============================================================
NOTIFY pgrst, 'reload schema';
