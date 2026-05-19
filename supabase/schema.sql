-- ============================================================
-- Eureka Ropa de Trabajo - Supabase Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  base_price numeric(10, 2) NOT NULL,
  images text[] DEFAULT '{}',
  active boolean DEFAULT true,
  featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- PRODUCT VARIANTS
-- ============================================================
CREATE TABLE IF NOT EXISTS product_variants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  size text,
  color text,
  model text,
  stock integer DEFAULT 0,
  sku text UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- CUSTOMERS
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  address text,
  city text DEFAULT 'CABA',
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending','confirmed','shipped','delivered','cancelled')),
  subtotal numeric(10, 2) NOT NULL,
  payment_method text NOT NULL,
  payment_surcharge_pct numeric(5, 2) DEFAULT 0,
  total numeric(10, 2) NOT NULL,
  notes text,
  mp_payment_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  variant_id uuid REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  variant_desc text,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(10, 2) NOT NULL,
  total_price numeric(10, 2) NOT NULL
);

-- ============================================================
-- VISITOR SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS visitor_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  visitor_id text NOT NULL,
  started_at timestamptz DEFAULT now(),
  last_seen_at timestamptz DEFAULT now(),
  pages_visited integer DEFAULT 0,
  device_info jsonb DEFAULT '{}',
  referrer text
);

-- ============================================================
-- ANALYTICS EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id text,
  visitor_id text,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}',
  page_url text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_visitor ON analytics_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_visitor ON visitor_sessions(visitor_id);

-- ============================================================
-- UPDATED AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Public read access for catalog
CREATE POLICY "Public can read active categories" ON categories FOR SELECT USING (active = true);
CREATE POLICY "Public can read active products" ON products FOR SELECT USING (active = true);
CREATE POLICY "Public can read product variants" ON product_variants FOR SELECT USING (true);

-- Customers can insert themselves
CREATE POLICY "Anyone can create customer" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can create order" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can create order items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can track analytics" ON analytics_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can track sessions" ON visitor_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update own session" ON visitor_sessions FOR UPDATE USING (true);

-- Admins have full access (use service role key for admin panel)
CREATE POLICY "Admins full access categories" ON categories FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admins full access products" ON products FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admins full access variants" ON product_variants FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admins read customers" ON customers FOR SELECT USING (auth.role() = 'service_role');
CREATE POLICY "Admins read orders" ON orders FOR SELECT USING (auth.role() = 'service_role');
CREATE POLICY "Admins update orders" ON orders FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "Admins read order items" ON order_items FOR SELECT USING (auth.role() = 'service_role');
CREATE POLICY "Admins read analytics" ON analytics_events FOR SELECT USING (auth.role() = 'service_role');
CREATE POLICY "Admins read sessions" ON visitor_sessions FOR SELECT USING (auth.role() = 'service_role');

-- ============================================================
-- STOCK DECREMENT FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION decrement_stock(variant_id uuid, qty int)
RETURNS void AS $$
  UPDATE product_variants
  SET stock = GREATEST(0, stock - qty)
  WHERE id = variant_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================
-- SEED DATA - CATEGORIES
-- ============================================================
INSERT INTO categories (name, slug, description, active) VALUES
  ('Ambos', 'ambos', 'Ambos profesionales para salud y limpieza', true),
  ('Delantales', 'delantales', 'Delantales para docentes, cocina y escolares', true)
ON CONFLICT (slug) DO NOTHING;
