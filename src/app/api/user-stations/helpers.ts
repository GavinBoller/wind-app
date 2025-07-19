import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getUserFromSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Not authenticated");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) throw new Error("User not found in database");
  return user;
}
