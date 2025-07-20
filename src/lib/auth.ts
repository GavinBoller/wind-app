import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { SessionUser } from "./session";

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt" as const,
  },
  callbacks: {
    async session({ session, token }) {
      // The `session.user` object here is the default one. We add the `id` to it.
      // The return value will match our augmented `Session` type.
      if (session?.user && token.sub) {
        // Use the SessionUser type for consistency
        (session.user as SessionUser).id = token.sub;
      }
      return session;
    },
  },
};