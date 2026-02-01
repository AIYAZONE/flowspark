import { getDictionary } from '@/i18n/get-dictionary'
import { NewGoalRouteModal } from '@/components/NewGoalRouteModal'

export default async function NewGoalModalPage() {
  const dict = await getDictionary()
  return <NewGoalRouteModal dict={dict} />
}
