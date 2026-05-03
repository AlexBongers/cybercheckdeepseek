import { login } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Shield className="h-10 w-10 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Inloggen</CardTitle>
          <CardDescription>
            Log in op je Cybercheck account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div>
              <Label htmlFor="email">E-mailadres</Label>
              <Input id="email" name="email" type="email" required placeholder="naam@email.nl" />
            </div>
            <div>
              <Label htmlFor="password">Wachtwoord</Label>
              <Input id="password" name="password" type="password" required placeholder="••••••••" />
            </div>
            <Button type="submit" className="w-full" formAction={login}>
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
  )
}
