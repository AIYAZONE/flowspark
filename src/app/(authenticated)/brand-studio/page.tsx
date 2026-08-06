import { getBrandStudioView } from '@/lib/contentBrand'
import { BrandStudioClient } from '@/components/BrandStudioClient'
import { getDictionary } from '@/i18n/get-dictionary'

export const metadata = { title: '视频号个人IP工作台' }

export default async function BrandStudioPage() {
  const [view, dict] = await Promise.all([getBrandStudioView(), getDictionary('zh')])

  return (
    <BrandStudioClient
      dict={dict}
      initialIdeas={view.ideas}
      initialCalendar={view.calendar}
      initialFolders={view.folders}
      initialAssets={view.assets}
    />
  )
}
