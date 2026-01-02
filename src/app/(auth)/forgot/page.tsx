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
  const { error: rawError, message: rawMessage } = await searchParams
  const dict = await getDictionary()

  const getErrorMessage = (err: string) => {
    if (!err) return null
    if (err === 'email_required') return dict.forgot.errors?.email_required || err
    if (err === 'rate_limit') return dict.forgot.errors?.rate_limit || err
    if (err === 'unexpected_error') return dict.forgot.errors?.unexpected_error || err
    return err
  }

  const error = getErrorMessage(rawError || '')
  const message = rawMessage === 'email_sent' ? dict.forgot.success : null

  return (
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
            {message}
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
  )
}
