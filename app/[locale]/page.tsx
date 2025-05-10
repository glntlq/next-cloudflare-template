import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { Link } from '@/i18n/navigation'

export const runtime = 'edge'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('HomePage.meta')
  const site = await getTranslations('siteInfo')

  return {
    title: t('title', {
      brandName: site('brandName')
    }),
    description: t('description', {
      brandName: site('brandName')
    })
  }
}

export default async function Home() {
  const t = await getTranslations('HomePage')
  return (
    <div>
      <h1>{t('title')}</h1>

      <Link href="/about">{t('about')}</Link>
    </div>
  )
}
