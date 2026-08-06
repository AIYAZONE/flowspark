import { listPersona } from '@/lib/persona'
import { PersonaManager } from '@/components/PersonaManager'
import { BrandCheckPanel } from '@/components/BrandCheckPanel'
import { getDictionary } from '@/i18n/get-dictionary'

export const metadata = { title: '个人记忆' }

export default async function PersonaPage() {
  const items = await listPersona()
  const dict = await getDictionary('zh')

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            个人记忆
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            这里沉淀着你对自己的一切认知（优势、价值观、经历、想成为的人……）。它在对话里会被自动补全，你也可以手动编辑。规划新路径时，人生系统会以此为底层原料。
          </p>
        </div>
      </div>

      <PersonaManager initialItems={items} />

      <BrandCheckPanel r={dict.brandCheck} />
    </div>
  )
}
