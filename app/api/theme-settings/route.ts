import { NextRequest } from 'next/server'
import { handleApiError, parseJson, success } from '@/lib/server/api'
import { getThemeSettings, updateThemeSettings } from '@/lib/server/school'

export async function GET() {
  try {
    return success(await getThemeSettings())
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await parseJson(request)
    return success(await updateThemeSettings(body), 'Theme settings updated successfully')
  } catch (error) {
    return handleApiError(error)
  }
}
