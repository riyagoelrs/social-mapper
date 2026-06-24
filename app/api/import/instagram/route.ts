import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth-dev";
import { prisma } from "@/lib/db";

// Instagram lets you download your data (Settings → Your activity → Download your information)
// The followers JSON looks like: [{ "string_list_data": [{ "value": "username", "href": "...", "timestamp": 123 }] }]
type IGEntry = {
  string_list_data: Array<{ value: string; href: string; timestamp: number }>;
};

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const text = await file.text();
  let entries: IGEntry[] = [];

  try {
    const parsed = JSON.parse(text);
    // Handle both the top-level array and { relationships_followers: [...] } shape
    entries = Array.isArray(parsed)
      ? parsed
      : (parsed.relationships_followers ?? parsed.relationships_following ?? []);
  } catch {
    return NextResponse.json({ error: "Invalid JSON file" }, { status: 400 });
  }

  let synced = 0;

  for (const entry of entries) {
    const item = entry.string_list_data?.[0];
    if (!item?.value) continue;

    await prisma.connection.upsert({
      where: {
        userId_platform_username: {
          userId: user.id,
          platform: "instagram",
          username: item.value,
        },
      },
      update: { syncedAt: new Date() },
      create: {
        userId: user.id,
        platform: "instagram",
        name: item.value,
        username: item.value,
        profileUrl: item.href ?? null,
      },
    });
    synced++;
  }

  return NextResponse.json({ synced, total: entries.length });
}
