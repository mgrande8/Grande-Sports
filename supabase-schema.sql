-- Grande Sports Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users/Athletes table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  position TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  stripe_customer_id TEXT,
  admin_notes TEXT, -- Notes visible only to admins
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions table (training slots you create)
CREATE TABLE public.sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('private', 'semi-private', 'group')),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  max_capacity INTEGER NOT NULL DEFAULT 1,
  current_capacity INTEGER NOT NULL DEFAULT 0,
  location TEXT DEFAULT 'Miami Shores Park',
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_day INTEGER, -- 0 = Sunday, 1 = Monday, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings table
CREATE TABLE public.bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'credited')),
  payment_intent_id TEXT,
  amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_code_id UUID,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, session_id)
);

-- Discount codes table
CREATE TABLE public.discount_codes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed', 'free_session')),
  value DECIMAL(10,2) NOT NULL DEFAULT 0, -- 0 for free_session type
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  athlete_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key for discount_code_id in bookings
ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_discount_code_id_fkey 
FOREIGN KEY (discount_code_id) REFERENCES public.discount_codes(id) ON DELETE SET NULL;

-- Technical testing results
CREATE TABLE public.technical_tests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  test_date DATE NOT NULL,
  -- Technical Passing (scores)
  drill_180 INTEGER,
  drill_open_90 INTEGER,
  drill_v INTEGER,
  -- Dribbling (timed in seconds, stored as decimal)
  dribble_20_yard DECIMAL(5,2),
  dribble_v DECIMAL(5,2),
  dribble_t DECIMAL(5,2),
  -- Ball Control (scores/counts)
  juggling_both INTEGER,
  juggling_left INTEGER,
  juggling_right INTEGER,
  straight_line_both DECIMAL(5,2),
  straight_line_left DECIMAL(5,2),
  straight_line_right DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table (for in-app communication)
CREATE TABLE public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
  subject TEXT,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session credits (for valid cancellations)
CREATE TABLE public.session_credits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  original_booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  session_type TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  used_booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Monthly packages
CREATE TABLE public.packages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  package_type TEXT NOT NULL DEFAULT 'monthly_private',
  sessions_total INTEGER NOT NULL DEFAULT 8,
  sessions_remaining INTEGER NOT NULL DEFAULT 8,
  price_paid DECIMAL(10,2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  stripe_subscription_id TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technical_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Sessions policies (public read, admin write)
CREATE POLICY "Anyone can view active sessions" ON public.sessions
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage sessions" ON public.sessions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Bookings policies
CREATE POLICY "Users can view own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings" ON public.bookings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all bookings" ON public.bookings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Discount codes policies
CREATE POLICY "Users can view applicable discount codes" ON public.discount_codes
  FOR SELECT USING (
    is_active = true AND 
    (athlete_id IS NULL OR athlete_id = auth.uid())
  );

CREATE POLICY "Admins can manage discount codes" ON public.discount_codes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Technical tests policies
CREATE POLICY "Users can view own tests" ON public.technical_tests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all tests" ON public.technical_tests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Messages policies
CREATE POLICY "Users can view own messages" ON public.messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Admins can manage all messages" ON public.messages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Session credits policies
CREATE POLICY "Users can view own credits" ON public.session_credits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage credits" ON public.session_credits
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Packages policies
CREATE POLICY "Users can view own packages" ON public.packages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage packages" ON public.packages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Functions

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update session capacity when booking changes
CREATE OR REPLACE FUNCTION public.update_session_capacity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' THEN
    UPDATE public.sessions 
    SET current_capacity = current_capacity + 1
    WHERE id = NEW.session_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'confirmed' AND NEW.status = 'confirmed' THEN
      UPDATE public.sessions 
      SET current_capacity = current_capacity + 1
      WHERE id = NEW.session_id;
    ELSIF OLD.status = 'confirmed' AND NEW.status = 'cancelled' THEN
      UPDATE public.sessions 
      SET current_capacity = current_capacity - 1
      WHERE id = NEW.session_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'confirmed' THEN
    UPDATE public.sessions 
    SET current_capacity = current_capacity - 1
    WHERE id = OLD.session_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for session capacity
DROP TRIGGER IF EXISTS on_booking_change ON public.bookings;
CREATE TRIGGER on_booking_change
  AFTER INSERT OR UPDATE OR DELETE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_session_capacity();

-- Function to increment discount code usage
CREATE OR REPLACE FUNCTION public.increment_discount_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.discount_code_id IS NOT NULL THEN
    UPDATE public.discount_codes 
    SET current_uses = current_uses + 1
    WHERE id = NEW.discount_code_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for discount usage
DROP TRIGGER IF EXISTS on_booking_with_discount ON public.bookings;
CREATE TRIGGER on_booking_with_discount
  AFTER INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.increment_discount_usage();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sessions_date ON public.sessions(date);
CREATE INDEX IF NOT EXISTS idx_sessions_type ON public.sessions(session_type);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_session ON public.bookings(session_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_technical_tests_user ON public.technical_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON public.discount_codes(code);

-- Insert yourself as admin (replace with your actual email after you sign up)
-- Run this AFTER you create your account:
-- UPDATE public.profiles SET is_admin = true WHERE email = 'your-email@example.com';
