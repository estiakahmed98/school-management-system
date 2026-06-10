import { handleApiError, success } from '@/lib/server/api'
import { getDashboardStats } from '@/lib/server/school'

export async function GET() {
  try {
    return success(await getDashboardStats())
  } catch (error) {
    return handleApiError(error)
  }
}
