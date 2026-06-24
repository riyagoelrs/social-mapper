import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth-dev";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city");
  const platform = searchParams.get("platform");

  const where: Record<string, unknown> = { userId: user.id };
  if (city) where.city = { contains: city };
  if (platform) where.platform = platform;

  const connections = await prisma.connection.findMany({
    where,
    orderBy: { name: "asc" },
  });

  return NextResponse.json(connections);
}

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { platform, connections } = body as {
    platform: string;
    connections: Array<{
      name: string;
      username?: string;
      profileUrl?: string;
      avatarUrl?: string;
      rawLocation?: string;
      city?: string;
      country?: string;
      lat?: number;
      lng?: number;
    }>;
  };

  const upserts = connections.map((c) =>
    prisma.connection.upsert({
      where: {
        userId_platform_username: {
          userId: user.id,
          platform,
          username: c.username ?? c.name,
        },
      },
      update: { ...c, syncedAt: new Date() },
      create: { ...c, userId: user.id, platform, username: c.username ?? c.name },
    })
  );

  await prisma.$transaction(upserts);
  return NextResponse.json({ synced: connections.length });
}
