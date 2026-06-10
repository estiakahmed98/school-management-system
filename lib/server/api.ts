import { NextRequest, NextResponse } from 'next/server'

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function success<T>(data: T, message?: string) {
  return NextResponse.json<ApiResponse<T>>(
    message ? { success: true, data, message } : { success: true, data }
  )
}

export function created<T>(data: T, message?: string) {
  return NextResponse.json<ApiResponse<T>>(
    message ? { success: true, data, message } : { success: true, data },
    { status: 201 }
  )
}

export function failure(message: string, status = 400) {
  return NextResponse.json<ApiResponse>({ success: false, message }, { status })
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return failure(error.message, error.status)
  }

  if (error instanceof Error) {
    return failure(error.message, 500)
  }

  return failure('Unexpected server error', 500)
}

export async function parseJson(request: NextRequest) {
  try {
    return await request.json()
  } catch {
    throw new ApiError(400, 'Invalid JSON request body')
  }
}

export function asRecord(value: unknown, resource = 'payload'): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ApiError(400, `Invalid ${resource}`)
  }

  return value as Record<string, unknown>
}
