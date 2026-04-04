-- Tshwane AI System - Unified Database Schema
-- Run in Supabase SQL Editor

-- =====================
-- CORRECTIONS (Web App)
-- =====================
CREATE TABLE IF NOT EXISTS corrections (
  id BIGSERIAL PRIMARY KEY,
  clause_id TEXT NOT NULL,
  ai_status TEXT NOT NULL,
  corrected_status TEXT NOT NULL,
  plan_text TEXT,
  user_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT corrections_clause_id_key UNIQUE (clause_id)
);

-- =====================
-- EXAMINATIONS (Bots)
-- =====================
CREATE TABLE IF NOT EXISTS examinations (
  id BIGSERIAL PRIMARY KEY,
  phone TEXT,                          -- WhatsApp number
  source TEXT,                        -- whatsapp/telegram/web
  erf_number TEXT,
  coverage_pct INTEGER,
  zoning TEXT,
  status TEXT,
  plan_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================
-- COMPLAINTS (Triage Bot)
-- =====================
CREATE TABLE IF NOT EXISTS complaints (
  id BIGSERIAL PRIMARY KEY,
  reference TEXT NOT NULL,
  category TEXT NOT NULL,
  department TEXT NOT NULL,
  description TEXT,
  location TEXT,
  phone TEXT,
  status TEXT DEFAULT 'OPEN',
  assigned_to TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- =====================
-- FAQ LOGS (Zoning Bot)
-- =====================
CREATE TABLE IF NOT EXISTS faq_logs (
  id BIGSERIAL PRIMARY KEY,
  question TEXT,
  answer_given TEXT,
  user_phone TEXT,
  helpful BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================
-- STORAGE (Plans & Images)
-- =====================
INSERT INTO storage.buckets (id, name, public) VALUES
  ('plans', 'plans', true),
  ('complaints', 'complaints', true);

-- =====================
-- RLS POLICIES
-- =====================
ALTER TABLE corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE examinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_logs ENABLE ROW LEVEL SECURITY;

-- Allow all (single user mode)
CREATE POLICY "allow_all" ON corrections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON examinations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON complaints FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON faq_logs FOR ALL USING (true) WITH CHECK (true);

-- =====================
-- INDEXES
-- =====================
CREATE INDEX idx_examinations_phone ON examinations(phone);
CREATE INDEX idx_examinations_created ON examinations(created_at DESC);
CREATE INDEX idx_complaints_reference ON complaints(reference);
CREATE INDEX idx_complaints_category ON complaints(category);
CREATE INDEX idx_faq_logs_created ON faq_logs(created_at DESC);