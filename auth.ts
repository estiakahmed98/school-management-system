import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { getUserByEmail } from '@/lib/server/auth'

const SESSION_COOKIE_NAME = 'sms_session'
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000

type SessionPayload = {
  email: string
  exp: number
}

function getSessionSecret() {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET

  if (!secret) {
    throw new Error('AUTH_SECRET or NEXTAUTH_SECRET must be configured')
  }

  return secret
}

function toBase64Url(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url')
}

function fromBase64Url(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8')
}

function signValue(value: string) {
  return createHmac('sha256', getSessionSecret()).update(value).digest('base64url')
}

function encodeSession(payload: SessionPayload) {
  const body = toBase64Url(JSON.stringify(payload))
  const signature = signValue(body)
  return `${body}.${signature}`
}

function decodeSession(token: string): SessionPayload | null {
  const [body, signature] = token.split('.')

  if (!body || !signature) {
    return null
  }

  const expectedSignature = signValue(body)
  const signatureBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expectedSignature)

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null
  }

  try {
    const payload = JSON.parse(fromBase64Url(body)) as SessionPayload

    if (!payload.email || typeof payload.exp !== 'number') {
      return null
    }

    if (payload.exp <= Date.now()) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

export async function auth() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!token) {
    return null
  }

  const payload = decodeSession(token)

  if (!payload) {
    return null
  }

  try {
    const user = await getUserByEmail(payload.email)
    return { user }
  } catch {
    return null
  }
}

export function createSessionCookie(email: string) {
  return {
    name: SESSION_COOKIE_NAME,
    value: encodeSession({
      email: email.trim().toLowerCase(),
      exp: Date.now() + SESSION_DURATION_MS,
    }),
    options: {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: Math.floor(SESSION_DURATION_MS / 1000),
    },
  }
}

export function createClearedSessionCookie() {
  return {
    name: SESSION_COOKIE_NAME,
    value: '',
    options: {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0,
    },
  }
}
