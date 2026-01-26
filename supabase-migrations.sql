-- Grande Sports Database Migrations
-- Run this in your Supabase SQL Editor if you have an existing database

-- Migration 1: Add recurring session fields
ALTER TABLE public.sessions
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS recurrence_day INTEGER;

-- Migration 2: Add admin_notes to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Migration 3: Update discount_codes to support free_session type and remove max_uses
-- First, drop the old constraint
ALTER TABLE public.discount_codes
DROP CONSTRAINT IF EXISTS discount_codes_type_check;

-- Add new constraint with free_session
ALTER TABLE public.discount_codes
ADD CONSTRAINT discount_codes_type_check
CHECK (type IN ('percentage', 'fixed', 'free_session'));

-- Drop max_uses column (unlimited uses)
ALTER TABLE public.discount_codes
DROP COLUMN IF EXISTS max_uses;

-- Make value have a default of 0 (for free_session type)
ALTER TABLE public.discount_codes
ALTER COLUMN value SET DEFAULT 0;

-- Migration 4: Add policy for admins to insert profiles (for adding athletes)
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
CREATE POLICY "Admins can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Migration 5: Add policy for admins to delete profiles
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles" ON public.profiles
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Verify changes
SELECT 'Migrations completed successfully!' as status;
