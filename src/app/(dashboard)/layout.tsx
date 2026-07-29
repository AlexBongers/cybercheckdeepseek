import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { getSessionUserId } from '@/lib/session'
import { getProfileById } from '@/lib/db'
import { LayoutDashboard, LogOut, Users } from 'lucide-react'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const userId = await getSessionUserId()

  if (!userId) {
    redirect('/login')
  }

  const profile = await getProfileById(userId)

  const role = profile?.role || 'student'
  const initials = (profile?.full_name || 'U')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const navItems = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['entrepreneur', 'student', 'admin'],
    },
    {
      href: '/admin',
      label: 'Beheer',
      icon: Users,
      roles: ['admin'],
    },
  ]

  return (
    <div className="min-h-screen flex bg-[#f4f1ed]">
      {/* Sidebar */}
      <aside className="hidden md:flex w-72 flex-col border-r border-slate-950/10 bg-white">
        <div className="hu-band h-2" />
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-950/10">
          <Image
            src="/hu-logo.png"
            alt="Hogeschool Utrecht"
            width={40}
            height={40}
            unoptimized
            className="size-10 object-contain"
          />
          <span className="leading-tight">
            <span className="block text-sm font-extrabold uppercase">Hogeschool Utrecht</span>
            <span className="block text-xs font-medium text-slate-600">Cybercheck</span>
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems
            .filter((item) => item.roles.includes(role))
            .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-md border border-transparent px-3 py-2 text-sm font-bold text-slate-700 transition-colors hover:border-slate-950 hover:bg-[#fff3bf] hover:text-slate-950"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
        </nav>

        <Separator />

        <div className="p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs bg-[#c8102e] font-bold text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile?.full_name || 'Gebruiker'}</p>
              <p className="text-xs font-medium text-slate-500 capitalize">{role}</p>
            </div>
          </div>
          <a
            href="/api/logout"
            className="mt-2 inline-flex h-7 w-full items-center justify-start gap-1 rounded-md px-2.5 text-[0.8rem] font-semibold text-slate-500 transition-colors hover:bg-muted hover:text-red-600"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Uitloggen
          </a>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Mobile header */}
        <header className="md:hidden border-b border-slate-950/10 bg-white">
          <div className="hu-band h-2" />
          <div className="px-4 py-3">
          <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/hu-logo.png"
              alt="Hogeschool Utrecht"
              width={32}
              height={32}
              unoptimized
              className="size-8 object-contain"
            />
            <span className="font-extrabold text-slate-900">Cybercheck</span>
          </div>
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
          </div>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto">
            {navItems
              .filter((item) => item.roles.includes(role))
              .map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button variant="outline" size="sm" className="bg-white">
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              ))}
          </nav>
          </div>
        </header>
        <div className="mx-auto max-w-7xl p-4 md:p-8">{children}</div>
      </main>
    </div>
  )
}
