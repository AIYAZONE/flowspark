import Image from 'next/image'

export function BrandLogo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 font-bold text-lg tracking-tight text-primary ${className}`}>
      <Image src="/logo.svg" alt="FlowSpark" width={36} height={36} className="shrink-0" />
      <span>FlowSpark</span>
    </div>
  )
}

export function BrandMark() {
  return (
    <Image src="/logo.svg" alt="FlowSpark" width={36} height={36} />
  )
}
