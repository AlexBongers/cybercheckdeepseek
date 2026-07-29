'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { setSessionUserId } from '@/lib/session'
import { verifyLogin } from '@/lib/db'

export async function login(formData: FormData) {
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')
  const user = await verifyLogin(email, password)

  if (!user) {
    redirect('/login?error=' + encodeURIComponent('Ongeldige login'))
  }

  await setSessionUserId(user.id)
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  void formData
  redirect('/signup/student')
}
