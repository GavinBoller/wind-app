import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function getUserFromSession() {
  const userFromSession = await getCurrentUser();
  if (!userFromSession?.id) throw new Error("Not authenticated");

  // The user ID from the session is already the correct string CUID
  const user = await prisma.user.findUnique({ where: { id: userFromSession.id } });
  if (!user) throw new Error("User not found in database");
  return user;
}
