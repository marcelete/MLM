-- ============================================================
-- Migration 04: Arreglo de analytics
-- ============================================================
-- Soluciona los errores 400/404 que reportaba el frontend:
--   - "Could not find the table 'public.visitor_sessions' in the schema cache"
--   - "Could not find the 'event_data' column of 'analytics_events'"
--
-- Causas:
--   1) visitor_sessions tenía `id uuid` pero el frontend genera un string
--      tipo "s_1779373763036-xxx" → falla el upsert. Cambiamos a text.
--   2) Si analytics_events no se creó (o se creó incompleta), la recreamos.
--
-- Idempotente: se puede ejecutar varias veces sin problemas.

-- ============================================================
-- 1) visitor_sessions: recrear con id text
-- ============================================================
DROP TABLE IF EXISTS visitor_sessions CASCADE;

CREATE TABLE visitor_sessions (
  id text PRIMARY KEY,
  visitor_id text NOT NULL,
  started_at timestamptz DEFAULT now(),
  last_seen_at timestamptz DEFAULT now(),
  pages_visited integer DEFAULT 0,
  device_info jsonb DEFAULT '{}',
  referrer text
);

CREATE INDEX IF NOT EXISTS idx_visitor_sessions_visitor ON visitor_sessions(visitor_id);

ALTER TABLE visitor_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can track sessions" ON visitor_sessions;
CREATE POLICY "Anyone can track sessions" ON visitor_sessions FOR INSERT WITH CHECK (
  id IS NOT NULL AND visitor_id IS NOT NULL
);

DROP POLICY IF EXISTS "Anyone can update own session" ON visitor_sessions;
CREATE POLICY "Anyone can update own session" ON visitor_sessions FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Anyone can read sessions" ON visitor_sessions;
CREATE POLICY "Anyone can read sessions" ON visitor_sessions FOR SELECT USING (true);

-- ============================================================
-- 2) analytics_events: asegurar que existe con todas las columnas
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

-- Por si la tabla existía sin event_data (o sin algún otro campo)
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS event_data jsonb DEFAULT '{}';
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS session_id text;
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS visitor_id text;
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS page_url text;

CREATE INDEX IF NOT EXISTS idx_analytics_events_visitor ON analytics_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Analytics insert válido" ON analytics_events;
DROP POLICY IF EXISTS "Anyone can track analytics" ON analytics_events;
CREATE POLICY "Analytics insert válido" ON analytics_events FOR INSERT WITH CHECK (
  session_id IS NOT NULL AND event_type IS NOT NULL AND length(event_type) <= 100
);

DROP POLICY IF EXISTS "Anyone can read analytics" ON analytics_events;
CREATE POLICY "Anyone can read analytics" ON analytics_events FOR SELECT USING (true);

-- ============================================================
-- 3) Refrescar el schema cache de PostgREST
-- ============================================================
NOTIFY pgrst, 'reload schema';
