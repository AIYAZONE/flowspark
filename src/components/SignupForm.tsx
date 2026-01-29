'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from 'lucide-react'
import { signup } from '@/app/(auth)/login/actions'
import { SubmitButton } from '@/components/SubmitButton'

interface Dict {
  common: { error: string }
  signup: {
    title: string
    description: string
    nameLabel: string
    namePlaceholder: string
    emailLabel: string
    emailPlaceholder: string
    passwordLabel: string
    signupButton: string
    toLoginPrefix: string
    toLogin: string
    messages?: {
      registration_success?: string
    }
    errors?: {
      missing_credentials?: string
      user_already_registered?: string
      unexpected_error?: string
    }
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
  reset: {
    tooShort: string
    needLower: string
    needUpper: string
    needNumber: string
    needSymbol: string
  }
}

export function SignupForm({ dict, error: initialError, message: initialMessage }: { dict: Dict, error?: string, message?: string }) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Helper to translate error codes
  const getErrorMessage = (err: string) => {
    if (!err) return null
    if (err === 'missing_credentials') return dict.signup.errors?.missing_credentials || err
    if (err === 'user_already_registered') return dict.signup.errors?.user_already_registered || err
    if (err === 'unexpected_error') return dict.signup.errors?.unexpected_error || err
    return err
  }

  // Helper to translate success messages
  const getSuccessMessage = (msg: string) => {
    if (!msg) return null
    if (msg === 'registration_success') return dict.signup.messages?.registration_success || msg
    return msg
  }

  const [error, setError] = useState<string | null>(getErrorMessage(initialError || '') || null)

  // Password validation logic derived from ResetPasswordForm
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

  function validate(pw: string): string | null {
    if (pw.length < 8) return dict.reset.tooShort
    if (!/[a-z]/.test(pw)) return dict.reset.needLower
    if (!/[A-Z]/.test(pw)) return dict.reset.needUpper
    if (!/[0-9]/.test(pw)) return dict.reset.needNumber
    if (!/[^A-Za-z0-9]/.test(pw)) return dict.reset.needSymbol
    return null
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const v = validate(password)
    if (v) {
      e.preventDefault()
      setError(v)
      return
    }
    // If valid, allow the form to submit to the server action
    if (typeof window !== 'undefined') {
      localStorage.setItem('last_activity_timestamp', Date.now().toString())
    }
  }

  return (
    <form action={signup} onSubmit={handleSubmit} className="grid gap-4">
      {error && (
        <div className="mb-2 text-sm text-red-500 font-medium bg-red-50 p-3 rounded-md border border-red-200">
          {dict.common.error}: {error}
        </div>
      )}
      {initialMessage && (
        <div className="mb-2 text-sm text-green-600 font-medium bg-green-50 p-3 rounded-md border border-green-200">
          {getSuccessMessage(initialMessage)}
        </div>
      )}

      <div className="grid gap-2">
        <Label htmlFor="name">{dict.signup.nameLabel}</Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder={dict.signup.namePlaceholder}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="email">{dict.signup.emailLabel}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder={dict.signup.emailPlaceholder}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="password" required>{dict.signup.passwordLabel}</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
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

      {/* Password Strength Indicator */}
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

      <div className="flex flex-col gap-2">
        <SubmitButton className="w-full">{dict.signup.signupButton}</SubmitButton>
        <div className="text-sm text-muted-foreground text-center">
          {dict.signup.toLoginPrefix}{' '}
          <Link href="/login" className="text-primary hover:underline">
            {dict.signup.toLogin}
          </Link>
        </div>
      </div>
    </form>
  )
}
