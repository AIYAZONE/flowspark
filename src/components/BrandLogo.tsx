import { Aperture } from "lucide-react";

export function BrandLogo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 font-bold text-lg tracking-tight text-primary ${className}`}>
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20 shadow-sm">
        <Aperture className="h-5 w-5 text-primary" strokeWidth={2} />
      </div>
      <span>Goal System</span>
    </div>
  )
}

export function BrandMark() {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20 shadow-sm">
      <Aperture className="h-5 w-5 text-primary" strokeWidth={2} />
    </div>
  )
}
