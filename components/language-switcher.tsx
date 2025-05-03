'use client'

import { Check, Globe } from 'lucide-react'
import { useLocale } from 'next-intl'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { usePathname, useRouter } from '@/i18n/navigation'
import { locales } from '@/i18n/routing'

export function LanguageSwitcher() {
  const pathname = usePathname()
  const router = useRouter()
  const currentLocale = useLocale()
  const [isOpen, setIsOpen] = useState(false)

  // Function to switch the language
  const switchLanguage = (locale: string) => {
    // Get the path without the locale prefix
    const pathWithoutLocale = pathname.replace(`/${currentLocale}`, '')

    // Construct the new path with the selected locale
    const newPath = `/${locale}${pathWithoutLocale}`

    // Navigate to the new path
    router.push(newPath)
    router.refresh()
    setIsOpen(false)
  }

  // Get current locale display name
  const currentLocaleDisplay = locales.find((l) => l.code === currentLocale)?.name || currentLocale

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLocaleDisplay}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale.code}
            onClick={() => switchLanguage(locale.code)}
            className="flex items-center justify-between"
          >
            <span>{locale.name}</span>
            {locale.code === currentLocale && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
