import { createClearedSessionCookie } from '@/auth'
import { success } from '@/lib/server/api'

export async function POST() {
  const response = success(null, 'Logout successful')
  const sessionCookie = createClearedSessionCookie()

  response.cookies.set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.options
  )

  return response
}
