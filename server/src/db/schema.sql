-- Beauté d'Or — schéma PostgreSQL
-- Idempotent : peut être relancé sans perte de données.

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  full_name     VARCHAR(120) NOT NULL,
  email         VARCHAR(160) NOT NULL UNIQUE,
  phone         VARCHAR(30),
  password_hash TEXT NOT NULL,
  role          VARCHAR(20) NOT NULL DEFAULT 'customer'
                CHECK (role IN ('customer', 'staff', 'admin')),
  address       TEXT,
  city          VARCHAR(120),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(80) NOT NULL,
  slug       VARCHAR(80) NOT NULL UNIQUE,
  image_url  TEXT,
  position   INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS brands (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(80) NOT NULL UNIQUE,
  slug        VARCHAR(80) NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(160) NOT NULL,
  slug        VARCHAR(180) NOT NULL UNIQUE,
  brand_id    INT REFERENCES brands(id) ON DELETE SET NULL,
  category_id INT REFERENCES categories(id) ON DELETE SET NULL,
  description TEXT,
  format      VARCHAR(40),
  price       INT NOT NULL CHECK (price >= 0),          -- FCFA, entier
  old_price   INT CHECK (old_price IS NULL OR old_price > 0),
  stock       INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url   TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_new      BOOLEAN NOT NULL DEFAULT false,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);

CREATE TABLE IF NOT EXISTS reviews (
  id         SERIAL PRIMARY KEY,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating     SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, user_id)
);

CREATE TABLE IF NOT EXISTS favorites (
  user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS delivery_zones (
  id        SERIAL PRIMARY KEY,
  name      VARCHAR(80) NOT NULL UNIQUE,
  fee       INT NOT NULL DEFAULT 0 CHECK (fee >= 0),
  delay     VARCHAR(80),
  position  INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS orders (
  id              SERIAL PRIMARY KEY,
  reference       VARCHAR(20) NOT NULL UNIQUE,
  user_id         INT REFERENCES users(id) ON DELETE SET NULL,
  customer_name   VARCHAR(120) NOT NULL,
  phone           VARCHAR(30) NOT NULL,
  address         TEXT NOT NULL,
  district_city   VARCHAR(120) NOT NULL,
  zone_id         INT REFERENCES delivery_zones(id) ON DELETE SET NULL,
  zone_name       VARCHAR(80) NOT NULL,
  delivery_fee    INT NOT NULL DEFAULT 0,
  payment_method  VARCHAR(20) NOT NULL CHECK (payment_method IN ('wave', 'orange_money', 'cash')),
  payment_status  VARCHAR(20) NOT NULL DEFAULT 'non_paye' CHECK (payment_status IN ('non_paye', 'paye', 'rembourse')),
  status          VARCHAR(20) NOT NULL DEFAULT 'en_attente'
                  CHECK (status IN ('en_attente', 'confirmee', 'en_preparation', 'expediee', 'livree', 'annulee')),
  channel         VARCHAR(20) NOT NULL DEFAULT 'whatsapp',
  subtotal        INT NOT NULL,
  total           INT NOT NULL,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

CREATE TABLE IF NOT EXISTS order_items (
  id           SERIAL PRIMARY KEY,
  order_id     INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id   INT REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(160) NOT NULL,
  brand        VARCHAR(80),
  format       VARCHAR(40),
  unit_price   INT NOT NULL,
  quantity     INT NOT NULL CHECK (quantity > 0),
  line_total   INT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key   VARCHAR(60) PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(120) NOT NULL,
  email      VARCHAR(160),
  phone      VARCHAR(30),
  message    TEXT NOT NULL,
  is_read    BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Recherche insensible aux accents et à la casse (sans extension, compatible hébergeurs managés)
CREATE OR REPLACE FUNCTION unaccent_lower(t text) RETURNS text AS $$
  SELECT translate(lower(t), 'àâäáãåéèêëíìîïóòôöõúùûüçñœ', 'aaaaaaeeeeiiiiooooouuuucno')
$$ LANGUAGE sql IMMUTABLE;

CREATE TABLE IF NOT EXISTS images (
  id         SERIAL PRIMARY KEY,
  mime       VARCHAR(40) NOT NULL,
  data       BYTEA NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
