import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import type { User } from "next-auth"

// This is our custom user type that includes the ID from the database
export type SessionUser = User & {
  id: string
}

export async function getSession() {
  return await getServerSession(authOptions)
}

export async function getCurrentUser(): Promise<SessionUser | undefined> {
  const session = await getSession()
  return session?.user as SessionUser | undefined
}