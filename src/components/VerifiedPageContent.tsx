'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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
    <div className="auth-bg flex min-h-screen w-full items-center justify-center px-4">
      <Card className="relative z-10 w-full max-w-sm rounded-xl border border-emerald-200 bg-emerald-50/50 shadow-none">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 ring-4 ring-emerald-50">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <CardTitle className="text-2xl text-emerald-900">{dict.verified.title}</CardTitle>
          <CardDescription className="text-emerald-700">
            {dict.verified.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <div className="text-sm font-medium text-emerald-600">
            {countdown} {dict.verified.redirecting}
          </div>
          <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
            <Link href="/login">
              {dict.verified.toLogin}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
