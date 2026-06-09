-- Sree Swamys Tractors - Database Schema

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  role VARCHAR(50) DEFAULT 'sales',
  permissions JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  permissions JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tractors (
  id SERIAL PRIMARY KEY,
  brand VARCHAR(50),
  model VARCHAR(100),
  hp INTEGER,
  chassis_no VARCHAR(50) UNIQUE,
  engine_no VARCHAR(50),
  color VARCHAR(30),
  year INTEGER,
  purchase_price NUMERIC(12,2),
  purchase_date DATE,
  selling_price NUMERIC(12,2),
  warranty_expiry DATE,
  rto_done BOOLEAN DEFAULT FALSE,
  rc_received BOOLEAN DEFAULT FALSE,
  rc_handed BOOLEAN DEFAULT FALSE,
  acquisition_type VARCHAR(20),
  notes TEXT,
  status VARCHAR(20) DEFAULT 'in_stock',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS spares (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  part_number VARCHAR(50),
  brand VARCHAR(50),
  category VARCHAR(50),
  hsn_code VARCHAR(20),
  purchase_price NUMERIC(12,2),
  selling_price NUMERIC(12,2),
  stock_qty INTEGER DEFAULT 0,
  reorder_level INTEGER DEFAULT 5,
  supplier VARCHAR(100),
  compatible_models TEXT,
  location VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(15),
  address TEXT,
  aadhaar VARCHAR(20),
  pan VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales (
  id SERIAL PRIMARY KEY,
  invoice_no VARCHAR(50) UNIQUE,
  tractor_id INTEGER REFERENCES tractors(id),
  customer_id INTEGER REFERENCES customers(id),
  sale_date TIMESTAMP DEFAULT NOW(),
  payment_mode VARCHAR(30),
  total_amount NUMERIC(12,2),
  finance_company VARCHAR(100),
  finance_amount NUMERIC(12,2),
  cheque_no VARCHAR(30),
  cheque_bank VARCHAR(100),
  cheque_date DATE,
  cheque_status VARCHAR(20),
  exchange_tractor_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sale_items (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
  item_type VARCHAR(20),
  item_id INTEGER,
  quantity INTEGER,
  price NUMERIC(12,2)
);

CREATE TABLE IF NOT EXISTS staff (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(15),
  role VARCHAR(50),
  salary NUMERIC(12,2),
  join_date DATE,
  address TEXT,
  aadhaar VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_cards (
  id SERIAL PRIMARY KEY,
  job_no VARCHAR(50) UNIQUE,
  customer_id INTEGER REFERENCES customers(id),
  tractor_id INTEGER REFERENCES tractors(id),
  complaint TEXT,
  transport_charges NUMERIC(12,2) DEFAULT 0,
  distance_km NUMERIC(10,2) DEFAULT 0,
  visit_date TIMESTAMP,
  labour_charges NUMERIC(12,2) DEFAULT 0,
  service_charges NUMERIC(12,2) DEFAULT 0,
  discount NUMERIC(12,2) DEFAULT 0,
  total_amount NUMERIC(12,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'open',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_card_mechanics (
  id SERIAL PRIMARY KEY,
  job_card_id INTEGER REFERENCES job_cards(id) ON DELETE CASCADE,
  mechanic_id INTEGER REFERENCES staff(id)
);

CREATE TABLE IF NOT EXISTS job_card_items (
  id SERIAL PRIMARY KEY,
  job_card_id INTEGER REFERENCES job_cards(id) ON DELETE CASCADE,
  spare_id INTEGER REFERENCES spares(id),
  quantity INTEGER,
  price NUMERIC(12,2)
);

CREATE TABLE IF NOT EXISTS salary (
  id SERIAL PRIMARY KEY,
  staff_id INTEGER REFERENCES staff(id),
  month VARCHAR(7),
  basic NUMERIC(12,2),
  allowances NUMERIC(12,2) DEFAULT 0,
  deductions NUMERIC(12,2) DEFAULT 0,
  advance NUMERIC(12,2) DEFAULT 0,
  bonus NUMERIC(12,2) DEFAULT 0,
  net_salary NUMERIC(12,2),
  paid_on DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(50) PRIMARY KEY,
  value JSONB
);

-- Default admin user (password: admin123)
INSERT INTO users (username, password_hash, full_name, role, permissions)
VALUES ('admin', '$2b$10$j9rD0qtDyq45jxsyPOXbTe2llZ7OUzx42W0FIyxXNkXOI2zSTV8S6', 'Administrator', 'admin', '["*"]')
ON CONFLICT DO NOTHING;

-- Default settings
INSERT INTO settings (key, value) VALUES
  ('invoice_template', '"default"'::jsonb),
  ('dashboard_widgets', '["stock","today_sales","low_stock","pending_jobs"]'::jsonb),
  ('low_stock_threshold', '3'::jsonb)
ON CONFLICT DO NOTHING;
