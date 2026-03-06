-- Migration 1: Add recurring session fields
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS recurrence_day INTEGER;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS recurrence_end_date DATE;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS parent_session_id UUID REFERENCES public.sessions(id);

-- Migration 2: Add admin_notes to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Migration 3: Update discount_codes to support free_session type
ALTER TABLE public.discount_codes DROP CONSTRAINT IF EXISTS discount_codes_type_check;
ALTER TABLE public.discount_codes ADD CONSTRAINT discount_codes_type_check
  CHECK (type IN ('percentage', 'fixed', 'free_session'));

-- Migration 4: Admin policies for profiles
CREATE POLICY IF NOT EXISTS "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY IF NOT EXISTS "Admins can update profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Migration 5: Add coach_name to sessions
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS coach_name TEXT;

-- Migration 6: Update location default
ALTER TABLE public.sessions ALTER COLUMN location SET DEFAULT 'Bamford Park, Davie, FL 33314';
UPDATE public.sessions SET location = 'Bamford Park, Davie, FL 33314' WHERE location IN ('Miami Shores Park', 'Bamford Park (Davie)');

-- Migration 7: Add new booking fields
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS position TEXT,
ADD COLUMN IF NOT EXISTS level TEXT,
ADD COLUMN IF NOT EXISTS goals TEXT,
ADD COLUMN IF NOT EXISTS referral_source TEXT,
ADD COLUMN IF NOT EXISTS referred_by TEXT,
ADD COLUMN IF NOT EXISTS referral_discount_applied BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS follow_up_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS trainer_observations TEXT;
