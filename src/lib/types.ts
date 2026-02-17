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
