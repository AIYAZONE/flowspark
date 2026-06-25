import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getDictionary } from '@/i18n/get-dictionary'
import { SignupForm } from '@/components/SignupForm'
import { AuthCardShell } from '@/components/AuthCardShell'

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const { error, message } = await searchParams
  const dict = await getDictionary()

  return (
    <AuthCardShell>
      <CardHeader>
        <CardTitle className="text-2xl">{dict.signup.title}</CardTitle>
        <CardDescription>
          {dict.signup.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SignupForm dict={dict} error={error} message={message} />
      </CardContent>
    </AuthCardShell>
  )
}
