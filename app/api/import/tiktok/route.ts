import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth-dev";
import { prisma } from "@/lib/db";

// TikTok data export (Settings → Privacy → Personalization and data → Download your data)
// Following list is in JSON: { Activity: { Following: { Following: [{ Date: "...", UserName: "..." }] } } }
type TikTokFollowing = { Date: string; UserName: string };

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const text = await file.text();
  let entries: TikTokFollowing[] = [];

  try {
    const parsed = JSON.parse(text);
    entries =
      parsed?.Activity?.Following?.Following ??
      parsed?.following ??
      [];
  } catch {
    return NextResponse.json({ error: "Invalid JSON file" }, { status: 400 });
  }

  let synced = 0;

  for (const entry of entries) {
    if (!entry.UserName) continue;

    await prisma.connection.upsert({
      where: {
        userId_platform_username: {
          userId: user.id,
          platform: "tiktok",
          username: entry.UserName,
        },
      },
      update: { syncedAt: new Date() },
      create: {
        userId: user.id,
        platform: "tiktok",
        name: entry.UserName,
        username: entry.UserName,
        profileUrl: `https://www.tiktok.com/@${entry.UserName}`,
      },
    });
    synced++;
  }

  return NextResponse.json({ synced, total: entries.length });
}
