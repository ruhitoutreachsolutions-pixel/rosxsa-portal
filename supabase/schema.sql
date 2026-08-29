-- ==============================================================================
-- ROSxSA | Complete PostgreSQL Database Schema for Supabase Free Plan
-- Ruhit Outreach Solutions x Staff Asia Outreach Guard & Sales CRM
-- ==============================================================================

-- 1. TEAM MEMBERS TABLE
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('sales', 'lead_gen', 'manager')),
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
ON CONFLICT DO NOTHING;

-- 2. MASTER LEADS & DNC REPOSITORY
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
  status TEXT NOT NULL CHECK (status IN ('dnc', 'interested', 'in_conversation', 'meeting_booked', 'invoice_sent', 'paid_client', 'cold_lead')),
  dnc_reason TEXT CHECK (dnc_reason IN ('unsubscribed', 'hostile', 'wrong_person', 'bounced', 'competitor', 'other')),
  notes TEXT,
  lead_gen_rep TEXT,
  sales_rep TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_master_records_email ON master_records(email);
CREATE INDEX IF NOT EXISTS idx_master_records_domain ON master_records(domain);
CREATE INDEX IF NOT EXISTS idx_master_records_company ON master_records(company_name);
CREATE INDEX IF NOT EXISTS idx_master_records_status ON master_records(status);

-- 3. SALES DEALS & INVOICES TABLE
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT NOT NULL,
  domain TEXT NOT NULL,
  value_gbp NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  stage TEXT NOT NULL CHECK (stage IN ('meeting_booked', 'discovery_pitch', 'invoice_sent', 'payment_pending', 'closed_won', 'closed_lost')),
  invoice_number TEXT,
  invoice_date DATE,
  follow_up_days INT DEFAULT 7,
  due_alert_date DATE,
  paid_date DATE,
  sales_rep TEXT NOT NULL,
  lead_gen_rep TEXT,
  notes TEXT,
  meeting_scheduled_date TIMESTAMPTZ,
  meeting_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
CREATE INDEX IF NOT EXISTS idx_deals_sales_rep ON deals(sales_rep);
CREATE INDEX IF NOT EXISTS idx_deals_domain ON deals(domain);

-- 4. MONTHLY TARGETS TABLE
CREATE TABLE IF NOT EXISTS monthly_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month INT NOT NULL,
  year INT NOT NULL,
  company_target_gbp NUMERIC(12, 2) NOT NULL DEFAULT 25000.00,
  sales_targets JSONB NOT NULL DEFAULT '[]'::jsonb,
  lead_gen_targets JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(month, year)
);

-- 5. ACTIVITY LOGS TABLE
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  rep_name TEXT NOT NULL,
  details TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read/write to anon" ON team_members FOR ALL USING (true);
CREATE POLICY "Allow read/write to anon" ON master_records FOR ALL USING (true);
CREATE POLICY "Allow read/write to anon" ON deals FOR ALL USING (true);
CREATE POLICY "Allow read/write to anon" ON monthly_quotas FOR ALL USING (true);
CREATE POLICY "Allow read/write to anon" ON activity_logs FOR ALL USING (true);
