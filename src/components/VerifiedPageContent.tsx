'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AuthCardShell } from '@/components/AuthCardShell'
import { AuthInlineNotice } from '@/components/AuthInlineNotice'

interface Dict {
  verified: {
    title: string
    description: string
    toLogin: string
    redirecting: string
  }
}

export function VerifiedPageContent({ dict }: { dict: Dict }) {
  const router = useRouter()
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push('/login')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  return (
    <AuthCardShell>
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <CheckCircle2 className="h-7 w-7 text-emerald-500" />
        </div>
        <CardTitle className="text-2xl">{dict.verified.title}</CardTitle>
        <CardDescription>
          {dict.verified.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        <AuthInlineNotice variant="success">
          {countdown} {dict.verified.redirecting}
        </AuthInlineNotice>
        <Button asChild className="w-full">
          <Link href="/login">
            {dict.verified.toLogin}
          </Link>
        </Button>
      </CardContent>
    </AuthCardShell>
  )
}
