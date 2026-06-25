import { redirect } from 'next/navigation'
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getDictionary } from '@/i18n/get-dictionary'
import { VerifyForm } from '@/components/VerifyForm'
import { AuthCardShell } from '@/components/AuthCardShell'

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; error?: string }>
}) {
  const { email, error } = await searchParams
  
  if (!email) {
    redirect('/login')
  }

  const dict = await getDictionary()

  return (
    <AuthCardShell>
      <CardHeader>
        <CardTitle className="text-2xl">{dict.verify.title}</CardTitle>
        <CardDescription>
          {dict.verify.description.replace('{email}', email)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <VerifyForm dict={dict} email={email} error={error} />
      </CardContent>
    </AuthCardShell>
  )
}
