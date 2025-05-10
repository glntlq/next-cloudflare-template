import { Menu } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { LocaleSwitcher } from '@/components/locale-switcher'
import LoginModal from '@/components/login/login-modal'
import Logo from '@/components/logo'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

export default async function Header({ className }: { className?: string }) {
  const t = await getTranslations('headers')

  const pcLinkStyle = 'text-foreground hover:text-primary group relative font-medium transition-colors'
  const mobileLinkStyle =
    'hover:bg-secondary flex items-center rounded-md px-3 py-3 text-lg font-medium transition-colors'

  const navLinks = [
    { href: '/', label: 'home' },
    { href: '/blogs', label: 'blogs' },
    { href: '/about', label: 'about' }
  ]

  return (
    <header
      className={cn(
        'bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur',
        className
      )}
    >
      <div className="flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <Logo />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden items-center space-x-8 md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={pcLinkStyle}>
              {t(link.label as any)}
              <span className="bg-primary absolute -bottom-1 left-0 h-0.5 w-0 transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
          <LoginModal />
          <LocaleSwitcher />
        </nav>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-4 md:hidden">
          <LocaleSwitcher />
          <Sheet>
            <SheetTrigger asChild>
              <Menu className="size-6" />
            </SheetTrigger>
            <SheetContent side="right" className="flex w-[280px] flex-col sm:w-[320px]">
              <SheetHeader>
                <SheetTitle>{t('navigation')}</SheetTitle>
                <SheetDescription>{t('navigationDescription')}</SheetDescription>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto">
                <nav className="space-y-1">
                  {navLinks.map((link) => (
                    <Link key={link.href} href={link.href} className={mobileLinkStyle}>
                      {t(link.label as any)}
                    </Link>
                  ))}
                </nav>
              </div>

              <div className="border-t pt-4">
                <LoginModal />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
