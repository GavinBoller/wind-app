import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import type { User as PrismaUser } from "@prisma/client";
import { Resend } from 'resend';
import NewUserApprovalEmail from '@/emails/NewUserApprovalEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

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
    async jwt({ token, user, trigger }) {
      // The `user` object is only available on initial sign-in.
      // To ensure the token is always fresh, especially after the signIn event
      // or a DB update, we re-fetch the user from the database.
      const dbUser = await prisma.user.findFirst({
        where: {
          // On sign-in, `user` is available. On session checks, only `token` is.
          id: user?.id ?? token.id,
        },
      });

      if (dbUser) {
        token.id = dbUser.id;
        token.approved = dbUser.approved;
        token.role = dbUser.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.approved = token.approved;
        session.user.role = token.role;
      }
      return session;
    },
  },
  events: {
    async signIn({ user, isNewUser }) {
      // "God admin" promotion logic. This ensures the DB record is always correct.
      if (user.email === 'gavinboller@gmail.com') {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: 'ADMIN', approved: true },
        });
        return;
      }

      // Auto-approval for new users if the master switch is off
      if (isNewUser) {
        let settings = await prisma.appSettings.findFirst();
        // If no settings exist, default to requiring approval for security.
        if (!settings) {
          settings = await prisma.appSettings.create({
            data: { approvalRequired: true },
          });
        }

        if (settings.approvalRequired) {
          // Send notification to admin if approval is required
          if (process.env.ADMIN_EMAIL && process.env.NEXT_PUBLIC_APP_URL) {
            try {
              await resend.emails.send({
                from: 'onboarding@resend.dev',
                to: process.env.ADMIN_EMAIL,
                subject: 'Wind sniff: New User Awaiting Approval',
                react: NewUserApprovalEmail({
                  newUserName: user.name,
                  newUserEmail: user.email || 'Unknown',
                  adminDashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin`,
                  signupDate: new Date(),
                }),
              });
            } catch (error) {
              console.error("Failed to send new user notification email:", error);
            }
          } else {
            console.warn('[Auth Event] ADMIN_EMAIL or NEXT_PUBLIC_APP_URL environment variables are not set. Cannot send notification email.');
          }
        } else {
          await prisma.user.update({
            where: { id: user.id },
            data: { approved: true },
          });
        }
      }
    },
  },
};