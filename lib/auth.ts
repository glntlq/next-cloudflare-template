import { DrizzleAdapter } from '@auth/drizzle-adapter'

import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'

import { accounts, sessions, users, verificationTokens } from './db/schema'
import { createDb } from '@/lib/db'

export const { handlers, signIn, signOut, auth } = NextAuth(() => {
  const db = createDb()

  return {
    secret: process.env.AUTH_SECRET,
    adapter: DrizzleAdapter(db, {
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: sessions,
      verificationTokensTable: verificationTokens
    }),
    providers: [Google],
    session: {
      strategy: 'jwt'
    }
  }
})
