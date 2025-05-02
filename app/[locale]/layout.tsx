import { notFound } from 'next/navigation'
import { SessionProvider } from 'next-auth/react'
import { NextIntlClientProvider, hasLocale } from 'next-intl'

import Container from '@/components/container'
import Footer from '@/components/footer'
import Header from '@/components/header'
import { Toaster } from '@/components/ui/sonner'
import { routing } from '@/i18n/routing'

import type { Metadata } from 'next'

import '../globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://bytespark.me'),
  title: {
    template: '%s | BrandName',
    default: 'BrandName'
  },
  description: 'Think, Write, Code',
  icons: {
    icon: '/logo.svg'
  },
  authors: [{ name: 'Felix', url: 'https://github.com/sdrpsps' }],
  creator: 'Felix',
  openGraph: {
    images: ['/logo.svg']
  }
}

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <NextIntlClientProvider>
          <SessionProvider>
            <Header />
            <Container>{children}</Container>
            <Footer />
          </SessionProvider>
          <Toaster richColors />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
