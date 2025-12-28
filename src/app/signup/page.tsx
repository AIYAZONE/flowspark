import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getDictionary } from '@/i18n/get-dictionary'
import { SignupForm } from '@/components/SignupForm'

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
          <SignupForm dict={dict} error={error} message={message} />
        </CardContent>
      </Card>
    </div>
  )
}
