

export function BrandLogo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 font-bold text-lg tracking-tight text-primary ${className}`}>
      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36" fill="none">
        <rect x="0.5" y="0.5" width="35" height="35" rx="11.5" fill="rgba(5,148,103,0.1)" stroke="rgba(5,148,103,0.2)"
          strokeWidth="1" />
        <svg x="8" y="8" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059467" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="m14.31 8 5.74 9.94"></path>
          <path d="M9.69 8h11.48"></path>
          <path d="m7.38 12 5.74-9.94"></path>
          <path d="M9.69 16 3.95 6.06"></path>
          <path d="M14.31 16H2.83"></path>
          <path d="m16.62 12-5.74 9.94"></path>
        </svg>
      </svg>
      <span>FlowSpark</span>
    </div>
  )
}

export function BrandMark() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36" fill="none">
      <rect x="0.5" y="0.5" width="35" height="35" rx="11.5" fill="rgba(5,148,103,0.1)" stroke="rgba(5,148,103,0.2)"
        strokeWidth="1" />
      <svg x="8" y="8" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059467" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="m14.31 8 5.74 9.94"></path>
        <path d="M9.69 8h11.48"></path>
        <path d="m7.38 12 5.74-9.94"></path>
        <path d="M9.69 16 3.95 6.06"></path>
        <path d="M14.31 16H2.83"></path>
        <path d="m16.62 12-5.74 9.94"></path>
      </svg>
    </svg>
  )
}
