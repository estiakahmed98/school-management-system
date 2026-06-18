import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { authenticateUser } from '@/lib/server/auth'

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: 'jwt',
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          return await authenticateUser(
            String(credentials.email),
            String(credentials.password)
          )
        } catch {
          return null
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.permissions = user.permissions
      }

      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.id === 'string' ? token.id : ''
        session.user.role = typeof token.role === 'string' ? token.role : 'STUDENT'
        session.user.permissions = Array.isArray(token.permissions)
          ? token.permissions.filter(
              (permission): permission is string => typeof permission === 'string'
            )
          : []
      }

      return session
    },
  },
})
