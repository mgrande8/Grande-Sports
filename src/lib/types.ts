export type SessionType = 'private' | 'semi-private' | 'group'

export interface User {
  id: string
  email: string
  full_name: string
  phone?: string
  position?: string
  emergency_contact?: string
  emergency_phone?: string
  is_admin: boolean
  created_at: string
  stripe_customer_id?: string
  admin_notes?: string // Only visible to admins
}

export interface Session {
  id: string
  title: string
  session_type: SessionType
  date: string
  start_time: string
  end_time: string
  price: number
  max_capacity: number
  current_capacity: number
  location: string
  notes?: string
  coach_name?: string
  is_active: boolean
  created_at: string
  // Recurring session fields
  is_recurring?: boolean
  recurrence_day?: number // 0 = Sunday, 1 = Monday, etc.
  recurrence_end_date?: string
  parent_session_id?: string // Links generated sessions to the original recurring session
}

export interface Booking {
  id: string
  user_id: string
  session_id: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  payment_status: 'pending' | 'paid' | 'refunded' | 'credited'
  payment_intent_id?: string
  amount_paid: number
  discount_code_id?: string
  discount_amount: number
  position?: string
  level?: string
  goals?: string
  referral_source?: string
  referred_by?: string
  referral_discount_applied?: boolean
  reminder_sent?: boolean
  follow_up_sent?: boolean
  trainer_observations?: string
  created_at: string
  cancelled_at?: string
  user?: User
  session?: Session
}

export interface DiscountCode {
  id: string
  code: string
  type: 'percentage' | 'fixed' | 'free_session'
  value: number
  current_uses: number
  valid_from: string
  valid_until?: string
  athlete_id?: string  // If set, only this athlete can use it
  is_active: boolean
  created_at: string
}

export interface TechnicalTest {
  id: string
  user_id: string
  test_date: string
  // Technical Passing
  drill_180?: number
  drill_open_90?: number
  drill_v?: number
  // Dribbling (Timed - in seconds)
  dribble_20_yard?: number
  dribble_v?: number
  dribble_t?: number
  // Ball Control
  juggling_both?: number
  juggling_left?: number
  juggling_right?: number
  straight_line_both?: number
  straight_line_left?: number
  straight_line_right?: number
  notes?: string
  created_at: string
}

export interface Message {
  id: string
  sender_id: string
  recipient_id?: string
  session_id?: string
  subject?: string
  content: string
  is_read: boolean
  created_at: string
}

export interface SessionCredit {
  id: string
  user_id: string
  credits: number
  reason?: string
  issued_by?: string
  created_at: string
  used_at?: string
  booking_id?: string
  is_active: boolean
}

// Pricing constants
export const PRICING = {
  private: 95,
  'semi-private': 70,
  group: 40,
  monthly_private: 680, // 8 sessions at $85 each
} as const

export const SESSION_CAPACITY = {
  private: 1,
  'semi-private': 2,
  group: 8,
} as const

// Referral discount
export const REFERRAL_DISCOUNT = 15
export const REFERRAL_PRICE = 80

// Form option constants
export const POSITION_OPTIONS = [
  'Goalkeeper',
  'Center Back',
  'Full Back',
  'Defensive Midfielder',
  'Central Midfielder',
  'Attacking Midfielder',
  'Winger',
  'Striker',
  'Not Sure / Multiple',
] as const

export const LEVEL_OPTIONS = [
  'Beginner (Just starting out)',
  'Recreational (Play for fun)',
  'Competitive (Club/Travel team)',
  'High School Varsity',
  'College / Semi-Pro',
  'Professional',
] as const

export const GOALS_OPTIONS = [
  'Improve technical skills',
  'Game preparation',
  'Position-specific training',
  'Speed & agility',
  'Tactical understanding',
  'Confidence building',
  'College recruitment prep',
  'General fitness',
] as const

export const REFERRAL_SOURCE_OPTIONS = [
  'Google Search',
  'Instagram',
  'Facebook',
  'Friend / Family',
  'Coach Recommendation',
  'Saw us at a field',
  'Other',
] as const

// Package pricing display
export const PACKAGE_OPTIONS = [
  {
    name: '12-Session Pack',
    sessions: '12',
    pricePerSession: 80,
    totalPrice: 960,
    savings: 'Best Value — Save $180',
    description: 'Twelve private training sessions. Must be used within 45 days of purchase.',
    popular: true,
  },
  {
    name: '8-Session Pack',
    sessions: '8',
    pricePerSession: 85,
    totalPrice: 680,
    savings: 'Save $80',
    description: 'Eight private training sessions. Must be used within 45 days of purchase.',
    popular: false,
  },
  {
    name: '4-Session Pack',
    sessions: '4',
    pricePerSession: 90,
    totalPrice: 360,
    savings: 'Save $20',
    description: 'Four private training sessions. Must be used within 45 days of purchase.',
    popular: false,
  },
  {
    name: 'Single Session',
    sessions: '1',
    pricePerSession: 95,
    totalPrice: 95,
    savings: null,
    description: 'One private training session. Book online instantly.',
    popular: false,
  },
] as const

// ============================================
// MATCH ANALYSIS TYPES
// ============================================

export type AnalysisStatus =
  | 'not-started'
  | 'in-progress'
  | 'analysis-complete'
  | 'meeting-scheduled'
  | 'delivered'

export type AnalysisPaymentType = 'single' | 'subscription'

export interface MatchAnalysis {
  id: string

  // Form fields (matches intake form)
  email_address: string
  contact_email: string
  player_name: string
  jersey_number: string
  jersey_color?: string
  position: string
  additional_info?: string
  video_url: string

  // User link (if they have an account)
  user_id?: string

  // Payment
  payment_type: AnalysisPaymentType
  amount: number
  stripe_payment_intent_id?: string
  stripe_checkout_session_id?: string
  payment_status: 'pending' | 'paid' | 'refunded' | 'failed'

  // Status
  status: AnalysisStatus

  // Meeting tracking
  meeting_booked_at?: string
  calendly_event_url?: string

  // Admin tracking
  fulfillment_date?: string
  admin_notes?: string
  delivery_folder_url?: string

  created_at: string
  updated_at: string
}

export interface MatchAnalysisSubscription {
  id: string
  user_id: string
  stripe_subscription_id: string
  stripe_customer_id: string
  credits_total: number
  credits_used: number
  status: 'active' | 'cancelled' | 'past_due' | 'expired'
  current_period_start: string
  current_period_end: string
  created_at: string
  updated_at: string
}

// Match Analysis pricing constants
export const MATCH_ANALYSIS_PRICING = {
  single: 140,
  subscription_monthly: 500,
  subscription_credits: 4,
} as const

// Status labels for display
export const ANALYSIS_STATUS_LABELS: Record<AnalysisStatus, string> = {
  'not-started': 'Not Started',
  'in-progress': 'In Progress',
  'analysis-complete': 'Analysis Complete',
  'meeting-scheduled': 'Meeting Scheduled',
  'delivered': 'Delivered',
} as const
