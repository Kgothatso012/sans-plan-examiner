-- Joe's Examiner - Supabase Schema
-- Run this in your Supabase SQL Editor to create the corrections table

-- Create corrections table for learning data
CREATE TABLE IF NOT EXISTS corrections (
  id SERIAL PRIMARY KEY,
  clause_id TEXT NOT NULL,
  ai_status TEXT NOT NULL,
  corrected_status TEXT NOT NULL,
  plan_text TEXT,
  user_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Track unique clauses
  CONSTRAINT corrections_clause_id_key UNIQUE (clause_id)
);

-- Enable RLS
ALTER TABLE corrections ENABLE ROW LEVEL SECURITY;

-- Allow public read/write (Joe is the only user, no auth needed for now)
CREATE POLICY "Allow all" ON corrections FOR ALL USING (true) WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_corrections_clause_id ON corrections(clause_id);
CREATE INDEX IF NOT EXISTS idx_corrections_created_at ON corrections(created_at);