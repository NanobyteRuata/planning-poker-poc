import NextAuth from "next-auth"
import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    {
      id: "atlassian",
      name: "Atlassian",
      type: "oauth",
      authorization: {
        url: "https://auth.atlassian.com/authorize",
        params: {
          audience: "api.atlassian.com",
          prompt: "consent",
          scope: "read:jira-work write:jira-work read:jira-user offline_access",
        },
      },
      token: "https://auth.atlassian.com/oauth/token",
      userinfo: "https://api.atlassian.com/me",
      profile(profile) {
        return {
          id: profile.account_id,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        }
      },
      clientId: process.env.ATLASSIAN_CLIENT_ID,
      clientSecret: process.env.ATLASSIAN_CLIENT_SECRET,
    },
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.expiresAt = account.expires_at
      }
      if (profile) {
        token.atlassianAccountId = profile.account_id
      }
      return token
    },
    async session({ session, token }) {
      return {
        ...session,
        accessToken: token.accessToken as string,
        atlassianAccountId: token.atlassianAccountId as string,
      }
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
  },
} satisfies NextAuthConfig

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
