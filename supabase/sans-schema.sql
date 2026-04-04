-- SANS Plan Examiner - Database Schema
-- Run in Supabase SQL Editor
-- Project: pmhvteytflmbvolteota (joes-examiner)

-- =====================
-- MAIN TABLES
-- =====================

-- Applications (main building plan submissions)
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT UNIQUE NOT NULL,
  erf_number TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  owner_email TEXT NOT NULL,
  owner_phone TEXT,
  address TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED', 'IN_REVIEW', 'ANALYZED', 'APPROVED', 'REJECTED')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Application Documents (PDF files)
CREATE TABLE IF NOT EXISTS application_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT,
  storage_path TEXT NOT NULL,
  file_size INTEGER,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Application Analysis (AI analysis results)
CREATE TABLE IF NOT EXISTS application_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  clause_id TEXT NOT NULL,
  clause_title TEXT,
  status TEXT NOT NULL CHECK (status IN ('PASS', 'FAIL', 'WARNING', 'NEED_INFO')),
  violation_text TEXT,
  reasoning TEXT,
  confidence DECIMAL(3,2),
  analyzed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Application Comments (pin comments with coordinates)
CREATE TABLE IF NOT EXISTS application_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  x_position DECIMAL(5,4),
  y_position DECIMAL(5,4),
  page_number INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comment Replies (applicant responses)
CREATE TABLE IF NOT EXISTS comment_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES application_comments(id) ON DELETE CASCADE,
  reply_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Application Revisions (resubmitted documents)
CREATE TABLE IF NOT EXISTS application_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  revision_number INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Feedback (learning from examiner corrections)
CREATE TABLE IF NOT EXISTS ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  clause_id TEXT NOT NULL,
  original_prediction JSONB,
  examiner_correction TEXT,
  new_rule TEXT,
  confidence_adjustment DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Applicants (client accounts for portal)
CREATE TABLE IF NOT EXISTS applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Log (track admin actions)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  admin_email TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- STORAGE BUCKET
-- =====================

INSERT INTO storage.buckets (id, name, public) VALUES
  ('applications', 'applications', true)
ON CONFLICT (id) DO NOTHING;

-- =====================
-- RLS POLICIES
-- =====================

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;

-- Allow all access for single-user mode
CREATE POLICY "allow_all_applications" ON applications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_documents" ON application_documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_analysis" ON application_analysis FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_comments" ON application_comments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_replies" ON comment_replies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_revisions" ON application_revisions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_feedback" ON ai_feedback FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_applicants" ON applicants FOR ALL USING (true) WITH CHECK (true);

-- =====================
-- INDEXES
-- =====================

CREATE INDEX idx_applications_reference ON applications(reference);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_email ON applications(owner_email);
CREATE INDEX idx_documents_app ON application_documents(application_id);
CREATE INDEX idx_analysis_app ON application_analysis(application_id);
CREATE INDEX idx_comments_app ON application_comments(application_id);
CREATE INDEX idx_replies_comment ON comment_replies(comment_id);
CREATE INDEX idx_revisions_app ON application_revisions(application_id);
CREATE INDEX idx_feedback_clause ON ai_feedback(clause_id);
CREATE INDEX idx_applicants_email ON applicants(email);