import Link from 'next/link'
import { requestReset } from './actions'
import { SubmitButton } from '@/components/SubmitButton'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getDictionary } from '@/i18n/get-dictionary'
import { AuthInlineNotice } from '@/components/AuthInlineNotice'
import { AuthCardShell } from '@/components/AuthCardShell'

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
    <AuthCardShell>
      <CardHeader>
        <CardTitle className="text-2xl">{dict.forgot.title}</CardTitle>
        <CardDescription>
          {dict.forgot.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <AuthInlineNotice variant="error" title={dict.common.error} className="mb-4">
            {error}
          </AuthInlineNotice>
        )}
        {message && (
          <AuthInlineNotice variant="success" className="mb-4">
            {message}
          </AuthInlineNotice>
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
            <SubmitButton className="w-full">{dict.forgot.submit}</SubmitButton>
            <div className="text-sm text-muted-foreground text-center">
              <Link href="/login" className="text-primary hover:underline">
                {dict.reset.backToLogin}
              </Link>
            </div>
          </div>
        </form>
      </CardContent>
    </AuthCardShell>
  )
}
