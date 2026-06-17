import { createClient } from '@/lib/supabase/server'
import { getDictionary } from '@/i18n/get-dictionary'
import { listUserNotifications, getUnreadNotificationCount } from '@/lib/notifications/queries'
import { NotificationsCenterClient } from '@/components/NotificationsCenterClient'
import { getUserTimezone } from '@/lib/time'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const dict = await getDictionary()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const tz = await getUserTimezone(supabase, user.id)

  const [items, unread] = await Promise.all([
    listUserNotifications({ supabase, userId: user.id, limit: 50 }),
    getUnreadNotificationCount({ supabase, userId: user.id }),
  ])

  return (
    <div className="mx-auto w-full max-w-3xl">
      <NotificationsCenterClient dict={dict} tz={tz} initialNotifications={items} initialUnread={unread} />
    </div>
  )
}
