import Link from 'next/link'
import { requestReset } from './actions'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getDictionary } from '@/i18n/get-dictionary'

export default async function ForgotPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const { error, message } = await searchParams
  const dict = await getDictionary()

  return (
    <div className="auth-bg flex min-h-screen w-full items-center justify-center px-4">
      <Card className="relative z-10 w-full max-w-sm rounded-xl border border-border/50 bg-secondary/20 shadow-none">
        <CardHeader>
          <CardTitle className="text-2xl">{dict.forgot.title}</CardTitle>
          <CardDescription>
            {dict.forgot.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 text-sm text-red-500 font-medium bg-red-50 p-3 rounded-md border border-red-200">
              {dict.common.error}: {error}
            </div>
          )}
          {message && (
            <div className="mb-4 text-sm text-green-600 font-medium bg-green-50 p-3 rounded-md border border-green-200">
              {dict.forgot.success}
            </div>
          )}
          <form action={requestReset} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">{dict.forgot.emailLabel}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={dict.forgot.emailPlaceholder}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Button type="submit" className="w-full">{dict.forgot.submit}</Button>
              <div className="text-sm text-muted-foreground text-center">
                <Link href="/login" className="text-primary hover:underline">
                  {dict.reset.backToLogin}
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
