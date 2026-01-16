'use client'

import { Session } from '@/lib/types'
import { formatDate, formatTime, formatCurrency, getSessionTypeLabel, getSessionTypeColor, cn } from '@/lib/utils'
import { Users, MapPin, Clock } from 'lucide-react'

interface SessionCardProps {
  session: Session
  onSelect?: (session: Session) => void
  selected?: boolean
  showBookButton?: boolean
}

export default function SessionCard({ 
  session, 
  onSelect, 
  selected = false,
  showBookButton = true 
}: SessionCardProps) {
  const spotsLeft = session.max_capacity - session.current_capacity
  const isFull = spotsLeft === 0

  return (
    <div 
      className={cn(
        "card transition-all duration-200 cursor-pointer",
        selected && "ring-2 ring-gs-green border-gs-green",
        isFull && "opacity-60",
        !isFull && "hover:shadow-md hover:border-gs-gray-300"
      )}
      onClick={() => !isFull && onSelect?.(session)}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          {/* Session Type Badge */}
          <span className={cn(
            "inline-block px-3 py-1 text-xs font-semibold rounded-full mb-2",
            getSessionTypeColor(session.session_type)
          )}>
            {getSessionTypeLabel(session.session_type)}
          </span>

          {/* Title & Date */}
          <h3 className="text-lg font-bold text-gs-black">{session.title}</h3>
          <p className="text-gs-gray-600">{formatDate(session.date)}</p>

          {/* Details */}
          <div className="flex flex-wrap gap-4 mt-3 text-sm text-gs-gray-500">
            <div className="flex items-center gap-1">
              <Clock size={16} />
              <span>{formatTime(session.start_time)} - {formatTime(session.end_time)}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin size={16} />
              <span>{session.location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users size={16} />
              <span>
                {isFull ? (
                  <span className="text-red-600 font-medium">Full</span>
                ) : (
                  <span>{spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Price & Book */}
        <div className="flex sm:flex-col items-center sm:items-end gap-4 sm:gap-2">
          <p className="text-2xl font-bold text-gs-black">
            {formatCurrency(session.price)}
          </p>
          {showBookButton && !isFull && (
            <button 
              className="btn-primary text-sm whitespace-nowrap"
              onClick={(e) => {
                e.stopPropagation()
                onSelect?.(session)
              }}
            >
              {selected ? 'Selected' : 'Select'}
            </button>
          )}
          {isFull && (
            <span className="text-sm text-red-600 font-medium">Session Full</span>
          )}
        </div>
      </div>

      {session.notes && (
        <p className="mt-4 pt-4 border-t border-gs-gray-200 text-sm text-gs-gray-600">
          {session.notes}
        </p>
      )}
    </div>
  )
}
