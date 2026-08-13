-- Supabase table schema for NoirVirtuVB
-- Run this in your Supabase SQL editor or psql connected to your project.

CREATE TABLE IF NOT EXISTS products (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  sizes jsonb NOT NULL DEFAULT '[]'::jsonb,
  categories jsonb NOT NULL DEFAULT '[]'::jsonb,
  stock integer NOT NULL DEFAULT 0,
  collections jsonb NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS promotions (
  code text PRIMARY KEY,
  type text NOT NULL CHECK (type IN ('percent', 'fixed')),
  value numeric NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  description text
);

CREATE TABLE IF NOT EXISTS store_config (
  id integer PRIMARY KEY DEFAULT 1,
  name text,
  address text,
  phone text,
  currency text,
  taxRate numeric,
  shippingFee numeric,
  freeShippingThreshold numeric
);

CREATE TABLE IF NOT EXISTS orders (
  id text PRIMARY KEY,
  customer jsonb NOT NULL,
  items jsonb NOT NULL,
  subtotal numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  tax numeric NOT NULL DEFAULT 0,
  shipping numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  promoCode text,
  paymentMethod text,
  status text,
  date timestamptz
);
