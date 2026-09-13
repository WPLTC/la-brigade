export function Logo({ size = 28 }: { size?: number }) {
  return (
    <span className="inline-flex flex-col">
      <span className="flex items-center gap-1.5">
        <svg
          width={size}
          height={size}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <circle cx="14" cy="16" r="7" fill="#2A2422" />
          <circle cx="24" cy="11" r="8.5" fill="#2A2422" />
          <circle cx="34" cy="16" r="7" fill="#2A2422" />
          <rect x="10" y="16" width="28" height="14" rx="6" fill="#2A2422" />
          <rect x="12" y="32" width="24" height="9" rx="2" fill="#2A2422" />
          <rect x="12" y="32" width="24" height="3" fill="#c1272d" />
        </svg>
        <span className="flex items-baseline gap-1">
          <span className="font-heading text-[1.05em] italic tracking-wide text-charcoal">La</span>
          <span className="font-heading text-[1.35em] tracking-wide text-charcoal">BRIGADE</span>
        </span>
      </span>
      <span className="mt-0.5 flex h-[3px] w-full overflow-hidden rounded-full">
        <span className="flex-1 bg-[#274b8d]" />
        <span className="flex-1 bg-cream" />
        <span className="flex-1 bg-brigade-red" />
      </span>
    </span>
  )
}
