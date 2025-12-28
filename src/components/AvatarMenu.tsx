'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { signOut } from '@/app/login/actions'
import { User, Settings, LogOut } from 'lucide-react'

export function AvatarMenu({
  avatarUrl,
  letter,
  email,
  accountLabel = 'Account',
  logoutLabel = 'Logout',
}: {
  avatarUrl: string | null
  letter: string
  email: string
  accountLabel?: string
  logoutLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!ref.current) return
      if (!ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-primary/20 bg-primary/10 overflow-hidden"
        aria-label="Open account menu"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm font-semibold text-foreground">{letter}</span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-border/40 bg-background/95 shadow-2xl backdrop-blur-xl p-2">
          <div className="absolute right-4 -top-1 h-3 w-3 bg-background border-t border-l border-border/40 rotate-45" />
          <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{email}</span>
          </div>
          <div className="my-2 h-px bg-border/40" />
          <Link
            href="/profile"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
          >
            <Settings className="h-4 w-4" />
            <span>{accountLabel}</span>
          </Link>
          <div className="my-2 h-px bg-border/40" />
          <form action={signOut}>
            <Button
              type="submit"
              variant="ghost"
              className="flex w-full items-center gap-2 justify-start px-3 py-2 text-sm"
            >
              <LogOut className="h-4 w-4" />
              <span>{logoutLabel}</span>
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}
