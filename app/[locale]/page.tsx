import { getTranslations } from 'next-intl/server'

import { SeverLessTestComponent } from '@/app/[locale]/server-less-test'

export const runtime = 'edge'

export default async function Home() {
  const t = await getTranslations('HomePage')
  return (
    <div>
      <h1>{t('title')}</h1>
      <SeverLessTestComponent />
      <SeverLessTestComponent />
      <SeverLessTestComponent />
      <SeverLessTestComponent />
    </div>
  )
}
