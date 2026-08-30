-- ==============================================================================
-- ROSxSA | Complete PostgreSQL Database Schema for Supabase
-- Outbound Collision Guard, Pipeline Manager & Sales CRM
-- ==============================================================================

-- 1. USER ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS user_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'sales', 'lead_gen')),
  avatar_color TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed Owner User
INSERT INTO user_accounts (full_name, username, password, role, avatar_color) VALUES
  ('Ruhit (Owner)', 'ruhit', 'ROS@Owner2026!', 'admin', '#00C2FF')
ON CONFLICT (username) DO NOTHING;

-- 2. TEAM MEMBERS ROSTER
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('sales', 'lead_gen', 'admin')),
  email TEXT,
  avatar_color TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Pre-seed Team Members
INSERT INTO team_members (name, role, avatar_color) VALUES
  ('Farzan', 'sales', '#00C2FF'),
  ('Abrar', 'sales', '#00E5A0'),
  ('Sagar', 'sales', '#F97316'),
  ('Anis', 'sales', '#8B5CF6'),
  ('Shipu', 'sales', '#EC4899'),
  ('Ruhit', 'lead_gen', '#3B82F6'),
  ('Nayeem', 'lead_gen', '#10B981'),
  ('Tushar', 'lead_gen', '#F59E0B'),
  ('Rafiq', 'lead_gen', '#6366F1'),
  ('Arshad', 'lead_gen', '#14B8A6'),
  ('Azraf', 'lead_gen', '#E11D48'),
  ('Shahin', 'lead_gen', '#84CC16')
ON CONFLICT (name) DO NOTHING;

-- 3. MASTER LEADS & DNC REPOSITORY
CREATE TABLE IF NOT EXISTS master_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  domain TEXT NOT NULL,
  company_name TEXT,
  contact_name TEXT,
  website TEXT,
  country TEXT,
  job_title TEXT,
  phone TEXT,
  linkedin_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('dnc', 'interested', 'in_conversation', 'meeting_scheduled', 'meeting_done', 'demo_sent', 'invoice_sent', 'paid_client', 'cold_lead')),
  dnc_reason TEXT CHECK (dnc_reason IN ('unsubscribed', 'hostile', 'wrong_person', 'bounced', 'competitor', 'other')),
  notes TEXT,
  lead_gen_rep TEXT,
  sales_rep TEXT,
  meeting_count_type TEXT CHECK (meeting_count_type IN ('yes', 'no', 'pending')),
  audit_history JSONB DEFAULT '[]'::jsonb,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_master_records_email ON master_records(email);
CREATE INDEX IF NOT EXISTS idx_master_records_domain ON master_records(domain);
CREATE INDEX IF NOT EXISTS idx_master_records_company ON master_records(company_name);
CREATE INDEX IF NOT EXISTS idx_master_records_status ON master_records(status);

-- 4. SALES DEALS & 5-STAGE PIPELINE TABLE
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT NOT NULL,
  domain TEXT NOT NULL,
  value_gbp NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  stage TEXT NOT NULL CHECK (stage IN ('discovery_pitch', 'demo_sent', 'invoice_sent', 'payment_pending', 'closed_won', 'closed_lost')),
  has_pricing_given BOOLEAN DEFAULT true,
  discovery_date DATE,
  demo_sent_date DATE,
  invoice_number TEXT,
  invoice_date DATE,
  payment_pending_date DATE,
  follow_up_days INT DEFAULT 7,
  last_follow_up_date DATE,
  follow_up_history JSONB DEFAULT '[]'::jsonb,
  paid_date DATE,
  sales_rep TEXT NOT NULL,
  lead_gen_rep TEXT,
  notes TEXT,
  meeting_completed BOOLEAN DEFAULT true,
  meeting_count_type TEXT CHECK (meeting_count_type IN ('yes', 'no', 'pending')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
CREATE INDEX IF NOT EXISTS idx_deals_sales_rep ON deals(sales_rep);
CREATE INDEX IF NOT EXISTS idx_deals_domain ON deals(domain);

-- 5. MONTHLY TARGETS & WORKING DAYS / HOLIDAYS TABLE
CREATE TABLE IF NOT EXISTS monthly_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month INT NOT NULL,
  year INT NOT NULL,
  company_target_gbp NUMERIC(12, 2) NOT NULL DEFAULT 25000.00,
  sales_targets JSONB NOT NULL DEFAULT '[]'::jsonb,
  lead_gen_targets JSONB NOT NULL DEFAULT '[]'::jsonb,
  holidays JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(month, year)
);

-- Row Level Security (RLS)
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon all" ON user_accounts FOR ALL USING (true);
CREATE POLICY "Allow anon all" ON team_members FOR ALL USING (true);
CREATE POLICY "Allow anon all" ON master_records FOR ALL USING (true);
CREATE POLICY "Allow anon all" ON deals FOR ALL USING (true);
CREATE POLICY "Allow anon all" ON monthly_quotas FOR ALL USING (true);

-- Enable Supabase Realtime for instant broadcast without browser refresh
ALTER PUBLICATION supabase_realtime ADD TABLE master_records;
ALTER PUBLICATION supabase_realtime ADD TABLE deals;
ALTER PUBLICATION supabase_realtime ADD TABLE team_members;
ALTER PUBLICATION supabase_realtime ADD TABLE monthly_quotas;
ALTER PUBLICATION supabase_realtime ADD TABLE user_accounts;

