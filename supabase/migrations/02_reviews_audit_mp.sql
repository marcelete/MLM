-- ============================================================
-- Migration 02: Reviews, Audit Logs y eventos de Mercado Pago
-- ============================================================
-- Aplicar después de schema.sql.
-- Idempotente: usa IF NOT EXISTS y DROP IF EXISTS donde corresponde.

-- ============================================================
-- REVIEWS (rating + comentario de clientes con compra verificada)
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name text,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  verified boolean DEFAULT false,
  admin_reply text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (order_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reviews públicas para lectura" ON reviews;
CREATE POLICY "Reviews públicas para lectura" ON reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Usuario autenticado crea su review" ON reviews;
CREATE POLICY "Usuario autenticado crea su review" ON reviews FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

DROP POLICY IF EXISTS "Usuario edita su review" ON reviews;
CREATE POLICY "Usuario edita su review" ON reviews FOR UPDATE USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin'))
);

DROP POLICY IF EXISTS "Admin borra reviews" ON reviews;
CREATE POLICY "Admin borra reviews" ON reviews FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin'))
);

-- Vista agregada para rating promedio por producto
CREATE OR REPLACE VIEW product_rating_summary AS
SELECT
  product_id,
  COUNT(*)::int AS review_count,
  ROUND(AVG(rating)::numeric, 1) AS avg_rating
FROM reviews
GROUP BY product_id;

-- ============================================================
-- AUDIT LOGS (quién modificó qué - solo lectura por superadmin)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  changes jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Superadmin ve audit" ON audit_logs;
CREATE POLICY "Superadmin ve audit" ON audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin')
);

DROP POLICY IF EXISTS "Cualquier admin escribe audit" ON audit_logs;
CREATE POLICY "Cualquier admin escribe audit" ON audit_logs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin'))
);

-- ============================================================
-- MERCADO PAGO: eventos de webhook (para debug / auditoría)
-- ============================================================
CREATE TABLE IF NOT EXISTS mercadopago_eventos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  orden_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  evento_tipo text,
  datos_evento jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mp_eventos_orden ON mercadopago_eventos(orden_id);

ALTER TABLE mercadopago_eventos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin ve eventos MP" ON mercadopago_eventos;
CREATE POLICY "Admin ve eventos MP" ON mercadopago_eventos FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin'))
);
