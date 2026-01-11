import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    accessToken?: string
    atlassianAccountId?: string
    user: {
      id: string
    } & DefaultSession["user"]
  }

  interface Profile {
    account_id: string
    name: string
    email: string
    picture: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    refreshToken?: string
    expiresAt?: number
    atlassianAccountId?: string
  }
}
