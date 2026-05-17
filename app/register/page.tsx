import { permanentRedirect } from 'next/navigation'

// /register is a vanity URL — bookmarks, link shares, instinctive URL typing.
// Canonical signup surface is /login?tab=signup.
export default function RegisterRedirect() {
  permanentRedirect('/login?tab=signup')
}
