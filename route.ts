import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { AuthOptions } from "next-auth";

const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      // The '!' tells TypeScript that you are sure these values will be present.
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // You can add other providers here
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    // This callback is called whenever a JWT is created or updated.
    async jwt({ token, user }) {
      // On initial sign-in, the `user` object is available.
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    // This callback is called whenever a session is checked.
    async session({ session, token }) {
      // We are adding the user ID from the token to the session object.
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };