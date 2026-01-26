import { format, parseISO, addMonths, isBefore, isAfter, differenceInHours } from 'date-fns'

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'EEEE, MMMM d, yyyy')
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function canCancelBooking(sessionDate: string, sessionTime: string): boolean {
  const sessionDateTime = parseISO(`${sessionDate}T${sessionTime}`)
  const now = new Date()
  const hoursUntilSession = differenceInHours(sessionDateTime, now)
  return hoursUntilSession >= 24
}

export function getMaxBookingDate(): Date {
  return addMonths(new Date(), 1)
}

export function isSessionInPast(sessionDate: string, sessionTime: string): boolean {
  const sessionDateTime = parseISO(`${sessionDate}T${sessionTime}`)
  return isBefore(sessionDateTime, new Date())
}

export function isSessionBookable(sessionDate: string): boolean {
  const date = parseISO(sessionDate)
  const now = new Date()
  const maxDate = getMaxBookingDate()
  return isAfter(date, now) && isBefore(date, maxDate)
}

export function getSessionTypeLabel(type: string): string {
  switch (type) {
    case 'private':
      return 'Private Session'
    case 'semi-private':
      return 'Semi-Private Session'
    case 'group':
      return 'Group Session'
    default:
      return type
  }
}

export function getSessionTypeColor(type: string): string {
  switch (type) {
    case 'private':
      return 'bg-purple-100 text-purple-800'
    case 'semi-private':
      return 'bg-blue-100 text-blue-800'
    case 'group':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function calculateDiscountedPrice(
  originalPrice: number,
  discountType: 'percentage' | 'fixed' | 'free_session',
  discountValue: number
): number {
  if (discountType === 'free_session') {
    return 0
  }
  if (discountType === 'percentage') {
    return originalPrice * (1 - discountValue / 100)
  }
  return Math.max(0, originalPrice - discountValue)
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
