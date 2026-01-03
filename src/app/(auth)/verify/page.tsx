import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getDictionary } from '@/i18n/get-dictionary'
import { VerifyForm } from '@/components/VerifyForm'

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
    <Card className="relative z-10 w-full max-w-sm rounded-xl border border-border/50 bg-secondary/20 shadow-none">
      <CardHeader>
        <CardTitle className="text-2xl">{dict.verify.title}</CardTitle>
        <CardDescription>
          {dict.verify.description.replace('{email}', email)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <VerifyForm dict={dict} email={email} error={error} />
      </CardContent>
    </Card>
  )
}