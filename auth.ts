import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { upsertUserFromOAuth } from '@/lib/db'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  session: { strategy: 'jwt' },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false
      const id = await upsertUserFromOAuth({
        email: user.email,
        name: user.name ?? null,
        image: user.image ?? null,
      })
      user.id = String(id)
      return true
    },
    async jwt({ token, user }) {
      if (user?.id) token.userId = user.id
      return token
    },
    async session({ session, token }) {
      if (token.userId && session.user) {
        session.user.id = String(token.userId)
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
})
