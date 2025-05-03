import { getTranslations } from 'next-intl/server'

import { Link } from '@/i18n/navigation'

export const runtime = 'edge'

export default async function Home() {
  const t = await getTranslations('HomePage')
  return (
    <main className="container mx-auto px-4 py-8 md:px-6">
      <h1>{t('title')}</h1>

      <Link href="/about">{t('about')}</Link>
    </main>
  )
}
