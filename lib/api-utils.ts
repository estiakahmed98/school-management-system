export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
}

export function success<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
  }
}

export function error(message: string): ApiResponse {
  return {
    success: false,
    message,
  }
}

export function notFound(resource: string): ApiResponse {
  return error(`${resource} not found`)
}

export function badRequest(message: string): ApiResponse {
  return error(`Bad request: ${message}`)
}
