import { login, signup } from './actions'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getDictionary } from '@/i18n/get-dictionary'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const { error, message } = await searchParams
  const dict = await getDictionary()

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">{dict.login.title}</CardTitle>
          <CardDescription>
            {dict.login.description}
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
              <Label htmlFor="name">{dict.login.nameLabel}</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder={dict.login.namePlaceholder}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">{dict.login.passwordLabel}</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <div className="flex flex-col gap-2">
              <Button formAction={login} className="w-full">{dict.login.loginButton}</Button>
              <Button formAction={signup} variant="outline" className="w-full">{dict.login.signupButton}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
