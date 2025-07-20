import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function getUserFromSession() {
  const userFromSession = await getCurrentUser();
  if (!userFromSession?.id) throw new Error("Not authenticated");

  const userId = parseInt(userFromSession.id, 10);
  if (isNaN(userId)) throw new Error("Invalid user ID format in session.");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found in database");
  return user;
}
