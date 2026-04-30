import { getDictionary } from '@/i18n/get-dictionary'
import { PotentialDiscoveryCard } from '@/components/PotentialDiscoveryCard'
import { createClient } from '@/lib/supabase/server'

export default async function PotentialPage() {
  const supabase = await createClient()
  const dict = await getDictionary()
  const { data: { user } } = await supabase.auth.getUser()

  const ownerId = user?.id || ''
  const [{ data: goals }, { data: sessions }] = await Promise.all([
    supabase
      .from('goals')
      .select('id, title')
      .or(`owner_id.eq.${ownerId},user_id.eq.${ownerId}`)
      .eq('status', 'active')
      .order('updated_at', { ascending: false }),
    supabase
      .from('potential_sessions')
      .select('id, profile_input, goal_input, result_json, created_actions_json, created_at')
      .or(`owner_id.eq.${ownerId},user_id.eq.${ownerId}`)
      .order('created_at', { ascending: false })
      .limit(10)
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{dict.potential.title}</h1>
      <PotentialDiscoveryCard dict={dict} goals={(goals || []) as Array<{ id: string; title: string }>} initialSessions={(sessions || []) as Array<Record<string, unknown>>} />
    </div>
  )
}
