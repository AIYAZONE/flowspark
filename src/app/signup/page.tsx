import { signup } from '../login/actions'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getDictionary } from '@/i18n/get-dictionary'

export default async function SignupPage({
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
          <CardTitle className="text-2xl">{dict.signup.title}</CardTitle>
          <CardDescription>
            {dict.signup.description}
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
          <form className="grid gap-4">
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
              <Label htmlFor="password">{dict.signup.passwordLabel}</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <div className="flex flex-col gap-2">
              <Button formAction={signup} className="w-full">{dict.signup.signupButton}</Button>
              <div className="text-sm text-muted-foreground text-center">
                {dict.signup.toLoginPrefix}{' '}
                <Link href="/login" className="text-primary hover:underline">
                  {dict.signup.toLogin}
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
