import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth-dev";
import { prisma } from "@/lib/db";
import { geocodeCity } from "@/lib/geocode";

// Enrich connections that have rawLocation but no lat/lng yet.
// Call this after an import to resolve cities in the background.
export async function POST() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const toGeocode = await prisma.connection.findMany({
    where: {
      userId: user.id,
      rawLocation: { not: null },
      lat: null,
    },
    take: 50, // batch of 50 per call to avoid long request times
  });

  let enriched = 0;

  for (const conn of toGeocode) {
    if (!conn.rawLocation) continue;
    const result = await geocodeCity(conn.rawLocation);
    if (result) {
      await prisma.connection.update({
        where: { id: conn.id },
        data: {
          lat: result.lat,
          lng: result.lng,
          city: result.city,
          country: result.country,
        },
      });
      enriched++;
    }
    // Nominatim rate limit: 1 req/sec
    await new Promise((r) => setTimeout(r, 1100));
  }

  return NextResponse.json({ enriched, remaining: toGeocode.length - enriched });
}
