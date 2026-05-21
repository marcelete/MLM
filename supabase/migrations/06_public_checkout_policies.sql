-- ============================================================
-- Migration 06: Policies explícitas para checkout anónimo
-- ============================================================
-- Reescribe las policies de customers/orders/order_items para que
-- NO dependan del estado de auth (ni de cómo se aplicó schema.sql).
-- Específicamente: las marca como TO public (anon + authenticated).
--
-- Esto resuelve el caso del checkout con sesión rota o expirada,
-- donde el cliente puede llegar como anon, authenticated con JWT
-- válido o inválido, y todos deben poder comprar igual.
-- Idempotente.

-- ============================================================
-- CUSTOMERS
-- ============================================================
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Limpiar todas las policies anteriores
DROP POLICY IF EXISTS "Anyone can create customer" ON customers;
DROP POLICY IF EXISTS "Anyone can read own customer by email" ON customers;
DROP POLICY IF EXISTS "Anyone can update own customer" ON customers;
DROP POLICY IF EXISTS "Customers public insert" ON customers;
DROP POLICY IF EXISTS "Customers public select" ON customers;
DROP POLICY IF EXISTS "Customers public update" ON customers;

CREATE POLICY "Customers public insert" ON customers
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Customers public select" ON customers
  FOR SELECT TO public USING (true);

CREATE POLICY "Customers public update" ON customers
  FOR UPDATE TO public USING (true) WITH CHECK (true);

-- ============================================================
-- ORDERS
-- ============================================================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can create order" ON orders;
DROP POLICY IF EXISTS "Anyone can read own order after insert" ON orders;
DROP POLICY IF EXISTS "Admin update orders" ON orders;
DROP POLICY IF EXISTS "Orders public insert" ON orders;
DROP POLICY IF EXISTS "Orders public select" ON orders;
DROP POLICY IF EXISTS "Orders admin update" ON orders;

CREATE POLICY "Orders public insert" ON orders
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Orders public select" ON orders
  FOR SELECT TO public USING (true);

CREATE POLICY "Orders admin update" ON orders
  FOR UPDATE TO public USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin'))
  );

-- ============================================================
-- ORDER_ITEMS
-- ============================================================
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can create order items" ON order_items;
DROP POLICY IF EXISTS "Anyone can read order items" ON order_items;
DROP POLICY IF EXISTS "Order items public insert" ON order_items;
DROP POLICY IF EXISTS "Order items public select" ON order_items;

CREATE POLICY "Order items public insert" ON order_items
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Order items public select" ON order_items
  FOR SELECT TO public USING (true);

-- ============================================================
-- Refrescar el schema cache
-- ============================================================
NOTIFY pgrst, 'reload schema';
