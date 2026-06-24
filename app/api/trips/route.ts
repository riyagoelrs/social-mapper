import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth-dev";
import { prisma } from "@/lib/db";
import { geocodeCity } from "@/lib/geocode";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const trips = await prisma.trip.findMany({
    where: { userId: user.id },
    orderBy: { startDate: "asc" },
  });

  return NextResponse.json(trips);
}

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { city, startDate, endDate } = await req.json() as {
    city: string;
    startDate?: string;
    endDate?: string;
  };

  if (!city?.trim()) return NextResponse.json({ error: "City required" }, { status: 400 });

  // Try to geocode so the trip shows on the map
  const geo = await geocodeCity(city);

  const trip = await prisma.trip.create({
    data: {
      userId: user.id,
      city: geo?.city ?? city,
      country: geo?.country ?? null,
      lat: geo?.lat ?? null,
      lng: geo?.lng ?? null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    },
  });

  return NextResponse.json(trip);
}

export async function DELETE(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json() as { id: string };

  await prisma.trip.deleteMany({ where: { id, userId: user.id } });
  return NextResponse.json({ deleted: true });
}
