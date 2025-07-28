// Front-End/src/lib/auth.ts
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { fetchApi } from "./utils"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Appel à l'API backend pour l'authentification
          const data = await fetchApi<{ user?: Record<string, unknown> }>("/api/auth/login", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password
            })
          })

          if (data && data.user) {
            return data.user
          }

          return null
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.company = user.company
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.company = token.company as string
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/login",
    signUp: "/auth/register",
  },
}

// Types pour étendre la session NextAuth
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      company?: string | null
      role: string
    }
  }

  interface User {
    role: string
    company?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    company?: string | null
  }
}