import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Konto erstellen | Quantfoli',
  description:
    'Registriere dich bei Quantfoli und analysiere dein Schweizer Portfolio (ZKB, Yuh, Neon) mit institutionellen Risikokennzahlen.',
  alternates: {
    canonical: 'https://quantfoli.com/register',
  },
}

// Shadow SEO route — Google indexes this URL with Swiss-market copy,
// then follows the redirect to the signup tab.
export default function RegisterPage() {
  redirect('/login?tab=signup')
}
