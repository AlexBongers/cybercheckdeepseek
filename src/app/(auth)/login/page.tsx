import { login } from './actions'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#f4f1ed] px-4">
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center">
      <Card className="w-full border-slate-950 shadow-[8px_8px_0_#c8102e]">
        <div className="hu-band h-2" />
        <CardHeader className="text-center">
          <div className="mb-3 flex justify-center">
            <Image
              src="/hu-logo.png"
              alt="Hogeschool Utrecht"
              width={48}
              height={48}
              unoptimized
              className="size-12 object-contain"
            />
          </div>
          <CardTitle className="text-2xl font-extrabold">Inloggen bij Cybercheck</CardTitle>
          <CardDescription>
            Hogeschool Utrecht matching voor cyberveiligheidsscans
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={login} className="space-y-4">
            <div>
              <Label htmlFor="email">E-mailadres</Label>
              <Input id="email" name="email" type="email" required placeholder="naam@email.nl" />
            </div>
            <div>
              <Label htmlFor="password">Wachtwoord</Label>
              <Input id="password" name="password" type="password" required placeholder="••••••••" />
            </div>
            <Button type="submit" className="w-full">
              Inloggen
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 text-sm text-slate-500">
          <p>Nog geen account?</p>
          <div className="flex gap-2">
            <Link href="/signup/entrepreneur">
              <Button variant="outline" size="sm">Ik ben ondernemer</Button>
            </Link>
            <Link href="/signup/student">
              <Button variant="outline" size="sm">Ik ben student</Button>
            </Link>
          </div>
        </CardFooter>
      </Card>
      </div>
    </div>
  )
}
