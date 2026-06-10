import { handleApiError, success } from '@/lib/server/api'
import { getCurrentUser } from '@/lib/server/school'

export async function GET() {
  try {
    return success(await getCurrentUser())
  } catch (error) {
    return handleApiError(error)
  }
}
