import { getDictionary } from '@/i18n/get-dictionary'
import { NewGoalFullPage } from '@/components/NewGoalFullPage'

export default async function NewGoalPage() {
  const dict = await getDictionary()

  return (
    <NewGoalFullPage dict={dict} />
  )
}
