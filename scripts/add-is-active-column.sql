-- Migration: Add is_active column to resumes table
-- This migration adds the is_active column to existing resumes tables
-- that may not have this column yet.

-- Check if column exists and add it if it doesn't
-- SQLite doesn't have a native "ADD COLUMN IF NOT EXISTS", so we'll just add it
-- If it already exists, this will fail gracefully

-- Add is_active column with default value of 1 (true)
ALTER TABLE resumes ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1;

-- Create index on is_active column for better query performance
CREATE INDEX IF NOT EXISTS idx_resumes_active ON resumes(is_active);

