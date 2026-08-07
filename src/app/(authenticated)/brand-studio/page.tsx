import { getDictionary } from '@/i18n/get-dictionary'
import { BrandStudioWorkbench } from '@/components/BrandStudioWorkbench'

export const metadata = { title: '视频号个人IP工作台' }

export default async function BrandStudioPage() {
  const dict = await getDictionary('zh')

  return <BrandStudioWorkbench brandCheckDict={dict.brandCheck} />
}
