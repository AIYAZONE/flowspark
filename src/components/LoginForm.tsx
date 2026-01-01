'use client'

import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { login } from '@/app/login/actions'

interface Dict {
  common: { error: string }
  login: {
    title: string
    description: string
    emailLabel: string
    emailPlaceholder: string
    passwordLabel: string
    loginButton: string
    toSignupPrefix: string
    toSignup: string
    forgot: string
    errors?: {
      missing_credentials?: string
      unexpected_error?: string
      session_expired?: string
    }
  }
}

export function LoginForm({ dict, error: initialError, message }: { dict: Dict, error?: string, message?: string }) {
  // Helper to translate error codes
  const getErrorMessage = (err: string) => {
    if (!err) return null
    if (err === 'missing_credentials') return dict.login.errors?.missing_credentials || err
    if (err === 'unexpected_error') return dict.login.errors?.unexpected_error || err
    if (err === 'session_expired') return dict.login.errors?.session_expired || err
    return err
  }

  const error = getErrorMessage(initialError || '')

  return (
    <form className="grid gap-4">
      {error && (
        <div className="mb-4 text-sm text-red-500 font-medium bg-red-50 p-3 rounded-md border border-red-200">
          {dict.common.error}: {error}
        </div>
      )}
      {message && (
        <div className="mb-4 text-sm text-green-600 font-medium bg-green-50 p-3 rounded-md border border-green-200">
          {message}
        </div>
      )}
      <div className="grid gap-2">
        <Label htmlFor="email">{dict.login.emailLabel}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder={dict.login.emailPlaceholder}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">{dict.login.passwordLabel}</Label>
        <Input id="password" name="password" type="password" required />
        <div className="flex justify-end">
          <Link href="/forgot" className="text-xs text-primary hover:underline">{dict.login.forgot}</Link>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Button 
          formAction={login} 
          className="w-full"
          onClick={() => {
            if (typeof window !== 'undefined') {
              localStorage.setItem('last_activity_timestamp', Date.now().toString())
            }
          }}
        >
          {dict.login.loginButton}
        </Button>
        <div className="text-sm text-muted-foreground text-center">
          {dict.login.toSignupPrefix}{' '}
          <Link href="/signup" className="text-primary hover:underline">
            {dict.login.toSignup}
          </Link>
        </div>
      </div>
    </form>
  )
}
