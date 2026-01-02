import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getDictionary } from '@/i18n/get-dictionary'
import { LoginForm } from '@/components/LoginForm'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const { error, message } = await searchParams
  const dict = await getDictionary()

  return (
    <Card className="relative z-10 w-full max-w-sm rounded-xl border border-border/50 bg-secondary/20 shadow-none">
      <CardHeader>
        <CardTitle className="text-2xl">{dict.login.title}</CardTitle>
        <CardDescription>
          {dict.login.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm dict={dict} error={error} message={message} />
      </CardContent>
    </Card>
  )
}
