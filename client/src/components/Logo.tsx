import { ChefHat } from 'lucide-react'

interface LogoProps {
  inverted?: boolean
  className?: string
}

/** Logo inspiré de la charte : toque, "La" manuscrit, "BRIGADE" en capitales et trait tricolore */
export function Logo({ inverted = false, className = '' }: LogoProps) {
  const gradientId = inverted ? 'logo-swoosh-inverted' : 'logo-swoosh'
  const middle = inverted ? '#fbf6ec' : '#ffffff'

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="grid h-9 w-9 place-items-center rounded-full bg-brigade-red text-white shadow-sm">
        <ChefHat className="h-5 w-5" strokeWidth={2.25} />
      </span>
      <span className={`relative flex items-baseline pb-1.5 leading-none ${inverted ? 'text-cream' : 'text-charcoal'}`}>
        <span className="mr-0.5 -rotate-6 font-script text-xl">La</span>
        <span className="font-heading text-2xl tracking-wide uppercase">Brigade</span>
        <svg
          className="absolute -bottom-0.5 left-1 h-2 w-[calc(100%-0.25rem)]"
          viewBox="0 0 120 8"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#1f3f8f" />
              <stop offset="0.34" stopColor="#1f3f8f" />
              <stop offset="0.34" stopColor={middle} />
              <stop offset="0.66" stopColor={middle} />
              <stop offset="0.66" stopColor="#d2232a" />
              <stop offset="1" stopColor="#d2232a" />
            </linearGradient>
          </defs>
          <path d="M0 7.5 Q 60 1.5 120 0 L 120 2.8 Q 60 4.5 4 8 Z" fill={`url(#${gradientId})`} />
        </svg>
      </span>
    </span>
  )
}
