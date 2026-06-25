import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getDictionary } from '@/i18n/get-dictionary'
import { LoginForm } from '@/components/LoginForm'
import { AuthCardShell } from '@/components/AuthCardShell'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const { error, message } = await searchParams
  const dict = await getDictionary()

  return (
    <AuthCardShell>
      <CardHeader>
        <CardTitle className="text-2xl">{dict.login.title}</CardTitle>
        <CardDescription>
          {dict.login.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm dict={dict} error={error} message={message} />
      </CardContent>
    </AuthCardShell>
  )
}
