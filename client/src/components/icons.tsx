interface IconProps {
  className?: string
}

export function ChefHatIcon({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="currentColor" className={className} aria-hidden="true">
      <circle cx="14" cy="16" r="7" />
      <circle cx="24" cy="11" r="8.5" />
      <circle cx="34" cy="16" r="7" />
      <rect x="10" y="16" width="28" height="14" rx="6" />
      <rect x="12" y="32" width="24" height="9" rx="2" />
    </svg>
  )
}

export function PlateIcon({ className = 'h-8 w-8' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" />
    </svg>
  )
}

export function DocumentIcon({ className = 'h-7 w-7' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v4h4M9 12h6M9 16h6" />
    </svg>
  )
}

export function SearchIcon({ className = 'h-7 w-7' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={className} aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path strokeLinecap="round" d="m20 20-4.5-4.5" />
    </svg>
  )
}

export function ChatIcon({ className = 'h-7 w-7' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={className} aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 12a7 7 0 0 1-7 7H8l-4 3 .8-4.2A7 7 0 1 1 21 12Z"
      />
    </svg>
  )
}

export function KeyIcon({ className = 'h-7 w-7' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={className} aria-hidden="true">
      <circle cx="8" cy="15" r="4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 12 20 3M17 6l2 2M14 9l2 2" />
    </svg>
  )
}

export function ClockIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" />
    </svg>
  )
}
