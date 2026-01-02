import { ResetPasswordForm } from '@/components/ResetPasswordForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getDictionary } from '@/i18n/get-dictionary'

export default async function ResetPage() {
  const dict = await getDictionary()

  return (
    <Card className="relative z-10 w-full max-w-sm rounded-xl border border-border/50 bg-secondary/20 shadow-none">
      <CardHeader>
        <CardTitle className="text-2xl">{dict.reset.title}</CardTitle>
        <CardDescription>
          {dict.reset.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResetPasswordForm dict={dict} />
      </CardContent>
    </Card>
  )
}
