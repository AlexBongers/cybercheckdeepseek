import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Building2, GraduationCap, Users, CalendarCheck, Bell } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Shield className="h-7 w-7 text-blue-600" />
            <span className="text-xl font-bold text-slate-900">Cybercheck</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Inloggen</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-7xl px-6 pt-24 pb-16 text-center">
          <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
            Cyberveiligheid <span className="text-blue-600">eenvoudig</span> inplannen
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
            Het matching platform dat HBO ICT studenten koppelt aan ondernemers voor een
            45-minuten cyberveiligheidsscan. Geen handmatig plannen meer.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup/entrepreneur">
              <Button size="lg" className="w-full sm:w-auto text-base px-8">
                <Building2 className="mr-2 h-5 w-5" />
                Ik ben ondernemer
              </Button>
            </Link>
            <Link href="/signup/student">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8">
                <GraduationCap className="mr-2 h-5 w-5" />
                Ik ben student
              </Button>
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid gap-8 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CalendarCheck className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Automatisch matchen</CardTitle>
                <CardDescription>
                  Geef je beschikbaarheid op en wordt automatisch gekoppeld aan een studentengroep of ondernemer.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Bell className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Directe bevestiging</CardTitle>
                <CardDescription>
                  Zodra er een match is, ontvangen beide partijen direct een e-mail met de afspraakgegevens.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Overzichtelijk dashboard</CardTitle>
                <CardDescription>
                  Houd al je geplande interviews bij in één duidelijk overzicht. Voor ondernemers, studenten én coördinatoren.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* How it works */}
        <section className="bg-slate-50 py-20">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Hoe werkt het?</h2>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-lg">1</div>
                <h3 className="mt-4 font-semibold text-slate-900">Beschikbaarheid opgeven</h3>
                <p className="mt-2 text-sm text-slate-600">Ondernemers en studenten geven aan wanneer ze beschikbaar zijn.</p>
              </div>
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-lg">2</div>
                <h3 className="mt-4 font-semibold text-slate-900">Automatisch matchen</h3>
                <p className="mt-2 text-sm text-slate-600">Het systeem koppelt automatisch beschikbare ondernemers aan studentengroepen.</p>
              </div>
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-lg">3</div>
                <h3 className="mt-4 font-semibold text-slate-900">Interview uitvoeren</h3>
                <p className="mt-2 text-sm text-slate-600">Voer het interview uit, maak het rapport, en rond de scan af.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} Cybercheck — HBO ICT Cyberveiligheidsscans
      </footer>
    </div>
  )
}
