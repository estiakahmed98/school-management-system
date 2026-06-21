import { NextRequest } from 'next/server'
import { createSessionCookie } from '@/auth'
import { authenticateUser } from '@/lib/server/auth'
import { ApiError, handleApiError, parseJson, success } from '@/lib/server/api'

export async function POST(request: NextRequest) {
  try {
    const body = await parseJson(request)
    const email = typeof body.email === 'string' ? body.email : ''
    const password = typeof body.password === 'string' ? body.password : ''

    if (!email.trim() || !password.trim()) {
      throw new ApiError(400, 'Email and password are required')
    }

    const user = await authenticateUser(email, password)
    const response = success(user, 'Login successful')
    const sessionCookie = createSessionCookie(user.email)

    response.cookies.set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.options
    )

    return response
  } catch (error) {
    return handleApiError(error)
  }
}
