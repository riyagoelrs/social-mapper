import { auth } from "./auth";
import { prisma } from "./db";

// In development, fall back to the seeded demo user if no real session exists.
export async function getUser(): Promise<{ id: string } | null> {
  const session = await auth();
  if (session?.user?.id) return { id: session.user.id };

  if (process.env.NODE_ENV !== "production") {
    const demo = await prisma.user.findUnique({ where: { email: "demo@socialmapper.local" } });
    if (demo) return { id: demo.id };
  }

  return null;
}
