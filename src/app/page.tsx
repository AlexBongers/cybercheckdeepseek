import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ArrowRight,
  Building2,
  CalendarCheck,
  CheckCircle2,
  GraduationCap,
  Users,
} from 'lucide-react'

const features = [
  {
    title: 'Samen digitaal',
    description:
      'Beschikbaarheid, matching en status komen samen in één compacte workflow voor student, ondernemer en coördinator.',
    icon: CalendarCheck,
  },
  {
    title: 'Leren met echte opdrachtgevers',
    description:
      'Studentgroepen worden gekoppeld aan ondernemers met een concrete cyberveiligheidsvraag uit de regio.',
    icon: Users,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f4f1ed] text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-950/10 bg-white">
        <div className="hu-band h-2" />
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/hu-logo.png"
              alt="Hogeschool Utrecht"
              width={40}
              height={40}
              unoptimized
              className="size-10 object-contain"
            />
            <span className="leading-tight">
              <span className="block text-sm font-extrabold uppercase tracking-normal">Hogeschool Utrecht</span>
              <span className="block text-xs font-medium text-slate-600">Cybercheck</span>
            </span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="outline" className="px-4">Login voor beheerder</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto grid min-h-[calc(100vh-82px)] max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.04fr_0.96fr]">
          <div className="max-w-3xl">
            <h1 className="max-w-4xl text-4xl font-extrabold leading-[1.04] tracking-normal text-slate-950 sm:text-6xl">
              Cybercheck koppelt HU-studenten aan ondernemers in de regio Utrecht.
            </h1>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup/entrepreneur">
                <Button size="lg" className="h-11 w-full px-5 text-base sm:w-auto">
                  <Building2 className="size-5" />
                  Ondernemer aanmelden
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link href="/signup/student">
                <Button size="lg" variant="outline" className="h-11 w-full px-5 text-base sm:w-auto">
                  <GraduationCap className="size-5" />
                  Studentengroep aanmelden
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="border border-slate-950 bg-white p-4 shadow-[10px_10px_0_#c8102e]">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <p className="text-sm font-bold uppercase text-slate-500">Zo werkt Cybercheck</p>
                  <p className="mt-1 text-3xl font-extrabold">Van aanvraag naar afspraak</p>
                </div>
                <div className="bg-[#fff3bf] p-3 text-slate-950">
                  <CalendarCheck className="size-6" />
                </div>
              </div>

              <div className="space-y-3 py-5">
                {[
                  ['1', 'Ondernemer meldt zich aan', 'Contactgegevens en voorkeursmomenten worden veilig opgeslagen.'],
                  ['2', 'Coördinator beheert de planning', 'Alle aanmeldingen en studentengroepen blijven alleen zichtbaar in beheer.'],
                  ['3', 'Studentengroep voert de scan uit', 'Na matching volgt een concrete afspraak voor de cyberveiligheidsscan.'],
                ].map(([step, title, description]) => (
                  <div key={step} className="grid grid-cols-[auto_1fr] gap-3 border border-slate-200 bg-[#f4f1ed] p-3">
                    <div className="flex size-8 items-center justify-center bg-[#c8102e] text-sm font-extrabold text-white">
                      {step}
                    </div>
                    <div>
                      <p className="font-bold">{title}</p>
                      <p className="mt-1 text-sm text-slate-600">{description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-slate-950 p-4 text-white">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-[#ffd100]" />
                  <p className="font-bold">Matching klaar voor controle</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  De coördinator ziet welke afspraken zijn gemaakt en welke groepen nog capaciteit hebben.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-950/10 bg-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="grid gap-4 md:grid-cols-2">
              {features.map((feature) => (
                <Card key={feature.title} className="border-slate-950/15 shadow-none">
                  <CardHeader>
                    <feature.icon className="mb-2 size-7 text-[#c8102e]" />
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription className="leading-6">{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-950 py-8 text-center text-sm font-medium text-white">
        HU Cybercheck voor HBO ICT cyberveiligheidsscans
      </footer>
    </div>
  )
}
