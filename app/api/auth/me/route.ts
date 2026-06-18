import { auth } from '@/auth'
import { ApiError, handleApiError, success } from '@/lib/server/api'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      throw new ApiError(401, 'Not authenticated')
    }

    return success(session.user)
  } catch (error) {
    return handleApiError(error)
  }
}
