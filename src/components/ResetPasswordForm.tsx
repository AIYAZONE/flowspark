'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff } from 'lucide-react'

interface Dict {
  common: { error: string }
  reset: {
    passwordLabel: string
    confirmLabel: string
    submit: string
    success: string
    redirecting: string
    error: string
    mismatch: string
    tooShort: string
    needUpper: string
    needLower: string
    needNumber: string
    needSymbol: string
    backToLogin: string
  }
  reset_requirements: {
    title: string
    length: string
    upper: string
    lower: string
    number: string
    symbol: string
    strength: string
    weak: string
    medium: string
    strong: string
  }
}

export function ResetPasswordForm({ dict }: { dict: Dict }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [redirecting, setRedirecting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  function mapErrorMessage(raw: string): string {
    const msg = raw.toLowerCase()
    if (msg.includes('at least') || msg.includes('6 characters') || msg.includes('length')) {
      return dict.reset.tooShort
    }
    if (msg.includes('lower case')) return dict.reset.needLower
    if (msg.includes('upper case')) return dict.reset.needUpper
    if (msg.includes('number')) return dict.reset.needNumber
    if (msg.includes('special')) return dict.reset.needSymbol
    if (msg.includes('match')) return dict.reset.mismatch
    return raw
  }

  function validate(pw: string, cf: string): string | null {
    if (pw !== cf) return dict.reset.mismatch
    if (pw.length < 8) return dict.reset.tooShort
    if (!/[a-z]/.test(pw)) return dict.reset.needLower
    if (!/[A-Z]/.test(pw)) return dict.reset.needUpper
    if (!/[0-9]/.test(pw)) return dict.reset.needNumber
    if (!/[^A-Za-z0-9]/.test(pw)) return dict.reset.needSymbol
    return null
  }
  const lenOK = password.length >= 8
  const lowerOK = /[a-z]/.test(password)
  const upperOK = /[A-Z]/.test(password)
  const numberOK = /[0-9]/.test(password)
  const symbolOK = /[^A-Za-z0-9]/.test(password)
  const strengthScore =
    (lenOK ? 1 : 0) +
    (password.length >= 12 ? 1 : 0) +
    (lowerOK ? 1 : 0) +
    (upperOK ? 1 : 0) +
    (numberOK ? 1 : 0) +
    (symbolOK ? 1 : 0)
  const strengthPercent = Math.min(100, Math.round((strengthScore / 6) * 100))
  const strengthLabel =
    strengthScore <= 2 ? dict.reset_requirements.weak :
      strengthScore <= 4 ? dict.reset_requirements.medium :
        dict.reset_requirements.strong
  const strengthColor =
    strengthScore <= 2 ? 'bg-destructive' :
      strengthScore <= 4 ? 'bg-orange-500' :
        'bg-emerald-500'

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setIsSubmitting(true)

    if (!password || !confirm) {
      setError(dict.reset.error)
      setIsSubmitting(false)
      return
    }
    const v = validate(password, confirm)
    if (v) {
      setError(v)
      setIsSubmitting(false)
      return
    }

    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(mapErrorMessage(error.message))
      setIsSubmitting(false)
      return
    }
    setMessage(dict.reset.success)
    setRedirecting(true)
    setIsSubmitting(false)
  }

  useEffect(() => {
    if (redirecting) {
      const t = setTimeout(() => router.push('/login'), 3000)
      return () => clearTimeout(t)
    }
  }, [redirecting, router])

  return (
    <form onSubmit={handleUpdate} className="grid gap-4">
      {error && (
        <div className="mb-2 text-sm text-red-500 font-medium bg-red-50 p-3 rounded-md border border-red-200">
          {dict.common.error}: {error}
        </div>
      )}
      {message && (
        <div className="mb-2 text-sm text-green-600 font-medium bg-green-50 p-3 rounded-md border border-green-200">
          {message} {dict.reset.redirecting}
        </div>
      )}
      <div className="grid gap-2">
        <Label htmlFor="password">{dict.reset.passwordLabel}</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowPassword(v => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div className="rounded-md border bg-muted/30 p-3">
        <div className="text-xs font-medium text-muted-foreground">{dict.reset_requirements.title}</div>
        <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <li className={lenOK ? 'text-emerald-600' : 'text-muted-foreground'}>{dict.reset_requirements.length}</li>
          <li className={upperOK ? 'text-emerald-600' : 'text-muted-foreground'}>{dict.reset_requirements.upper}</li>
          <li className={lowerOK ? 'text-emerald-600' : 'text-muted-foreground'}>{dict.reset_requirements.lower}</li>
          <li className={numberOK ? 'text-emerald-600' : 'text-muted-foreground'}>{dict.reset_requirements.number}</li>
          <li className={symbolOK ? 'text-emerald-600' : 'text-muted-foreground'}>{dict.reset_requirements.symbol}</li>
        </ul>
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{dict.reset_requirements.strength}</span>
            <span className="font-medium">{strengthLabel}</span>
          </div>
          <div className="mt-1 h-1 w-full rounded bg-secondary">
            <div className={`h-1 rounded ${strengthColor}`} style={{ width: `${strengthPercent}%` }} />
          </div>
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="confirm">{dict.reset.confirmLabel}</Label>
        <div className="relative">
          <Input
            id="confirm"
            type={showConfirm ? 'text' : 'password'}
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowConfirm(v => !v)}
            aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <LoadingSpinner className="mr-2 h-4 w-4" />}
          {dict.reset.submit}
        </Button>
        <div className="text-sm text-muted-foreground text-center">
          <Link href="/login" className="text-primary hover:underline">
            {dict.reset.backToLogin}
          </Link>
        </div>
      </div>
    </form>
  )
}
