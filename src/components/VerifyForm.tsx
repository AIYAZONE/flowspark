'use client'

import { useState } from 'react'
import Link from 'next/link'
import { verifyEmail, resendOtp } from '@/app/(auth)/login/actions'
import { SubmitButton } from '@/components/SubmitButton'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Dict {
  common: { error: string }
  verify: {
    title: string
    description: string
    codeLabel: string
    codePlaceholder: string
    submit: string
    resend: string
    backToLogin: string
    success: string
    resendSuccess: string
    errors: {
      missing_code: string
      invalid_code: string
      unexpected_error: string
    }
  }
}

export function VerifyForm({ 
  dict, 
  email,
  error: initialError 
}: { 
  dict: Dict
  email: string
  error?: string 
}) {
  const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const getErrorMessage = (err: string) => {
    if (!err) return null
    if (err === 'missing_code') return dict.verify.errors.missing_code
    if (err === 'invalid_code') return dict.verify.errors.invalid_code
    if (err === 'unexpected_error') return dict.verify.errors.unexpected_error
    return err
  }

  const error = getErrorMessage(initialError || '')

  const handleResend = async () => {
    setResendStatus('loading')
    try {
      await resendOtp(email)
      setResendStatus('success')
    } catch (err) {
      setResendStatus('error')
    }
  }

  return (
    <form action={verifyEmail} className="grid gap-4">
      <input type="hidden" name="email" value={email} />
      
      {error && (
        <div className="mb-4 text-sm text-red-500 font-medium bg-red-50 p-3 rounded-md border border-red-200">
          {dict.common.error}: {error}
        </div>
      )}
      
      {resendStatus === 'success' && (
        <div className="mb-4 text-sm text-green-600 font-medium bg-green-50 p-3 rounded-md border border-green-200">
          {dict.verify.resendSuccess}
        </div>
      )}

      <div className="grid gap-2">
        <Label htmlFor="code">{dict.verify.codeLabel}</Label>
        <Input
          id="code"
          name="code"
          type="text"
          placeholder={dict.verify.codePlaceholder}
          required
          maxLength={6}
          className="text-center text-2xl tracking-widest"
        />
      </div>

      <div className="flex flex-col gap-2">
        <SubmitButton className="w-full">
          {dict.verify.submit}
        </SubmitButton>
        
        <Button 
          type="button" 
          variant="ghost" 
          className="w-full"
          onClick={handleResend}
          disabled={resendStatus === 'loading' || resendStatus === 'success'}
        >
          {dict.verify.resend}
        </Button>

        <div className="text-sm text-muted-foreground text-center">
          <Link href="/login" className="text-primary hover:underline">
            {dict.verify.backToLogin}
          </Link>
        </div>
      </div>
    </form>
  )
}