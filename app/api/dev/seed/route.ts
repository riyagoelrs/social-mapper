import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Only available in development. Seeds a demo user and connections.
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const user = await prisma.user.upsert({
    where: { email: "demo@socialmapper.local" },
    update: {},
    create: { email: "demo@socialmapper.local", name: "Demo User" },
  });

  const seed = [
    { name: "Priya Sharma", username: "priyasharma", platform: "linkedin", rawLocation: "New York, NY", city: "New York", country: "United States", lat: 40.7128, lng: -74.006 },
    { name: "Alex Chen", username: "alexchen", platform: "instagram", rawLocation: "New York, NY", city: "New York", country: "United States", lat: 40.7128, lng: -74.006 },
    { name: "Jordan Lee", username: "jordanlee", platform: "linkedin", rawLocation: "New York, NY", city: "New York", country: "United States", lat: 40.7128, lng: -74.006 },
    { name: "Sana Mirza", username: "sanamirza", platform: "tiktok", rawLocation: "New York, NY", city: "New York", country: "United States", lat: 40.7128, lng: -74.006 },
    { name: "Maya Patel", username: "mayapatel", platform: "linkedin", rawLocation: "San Francisco, CA", city: "San Francisco", country: "United States", lat: 37.7749, lng: -122.4194 },
    { name: "Chris Wong", username: "chriswong", platform: "instagram", rawLocation: "San Francisco, CA", city: "San Francisco", country: "United States", lat: 37.7749, lng: -122.4194 },
    { name: "Dev Anand", username: "devanand", platform: "tiktok", rawLocation: "San Francisco, CA", city: "San Francisco", country: "United States", lat: 37.7749, lng: -122.4194 },
    { name: "Rahul Mehta", username: "rahulmehta", platform: "linkedin", rawLocation: "Mumbai, India", city: "Mumbai", country: "India", lat: 19.076, lng: 72.8777 },
    { name: "Nisha Roy", username: "nisharoy", platform: "instagram", rawLocation: "Mumbai, India", city: "Mumbai", country: "India", lat: 19.076, lng: 72.8777 },
    { name: "Arjun Singh", username: "arjunsingh", platform: "tiktok", rawLocation: "Mumbai, India", city: "Mumbai", country: "India", lat: 19.076, lng: 72.8777 },
    { name: "Sophie Turner", username: "sophieturner", platform: "linkedin", rawLocation: "London, UK", city: "London", country: "United Kingdom", lat: 51.5074, lng: -0.1278 },
    { name: "Liam Hayes", username: "liamhayes", platform: "instagram", rawLocation: "London, UK", city: "London", country: "United Kingdom", lat: 51.5074, lng: -0.1278 },
    { name: "Yuki Tanaka", username: "yukitanaka", platform: "tiktok", rawLocation: "Tokyo, Japan", city: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503 },
    { name: "Elena Rossi", username: "elenarossi", platform: "linkedin", rawLocation: "Berlin, Germany", city: "Berlin", country: "Germany", lat: 52.52, lng: 13.405 },
    { name: "Carlos Mendez", username: "carlosmendez", platform: "instagram", rawLocation: "Sydney, Australia", city: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093 },
    { name: "Aisha Diallo", username: "aishadiallo", platform: "linkedin", rawLocation: "Toronto, Canada", city: "Toronto", country: "Canada", lat: 43.6532, lng: -79.3832 },
  ];

  for (const c of seed) {
    await prisma.connection.upsert({
      where: { userId_platform_username: { userId: user.id, platform: c.platform, username: c.username } },
      update: c,
      create: { ...c, userId: user.id },
    });
  }

  return NextResponse.json({ userId: user.id, seeded: seed.length });
}
