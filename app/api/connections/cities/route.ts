import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth-dev";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cities = await prisma.connection.groupBy({
    by: ["city", "lat", "lng"],
    where: { userId: user.id, city: { not: null } },
    _count: { id: true },
  });

  return NextResponse.json(
    cities
      .filter((c) => c.city)
      .map((c) => ({
        city: c.city,
        lat: c.lat,
        lng: c.lng,
        count: c._count.id,
      }))
  );
}
