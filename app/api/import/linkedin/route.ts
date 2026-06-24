import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth-dev";
import { prisma } from "@/lib/db";
import { geocodeCity } from "@/lib/geocode";
import Papa from "papaparse";

// LinkedIn CSV export columns (from Settings → Data Privacy → Get a copy of your data)
type LinkedInRow = {
  "First Name": string;
  "Last Name": string;
  "Email Address": string;
  Company: string;
  Position: string;
  "Connected On": string;
  URL?: string;
};

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const text = await file.text();
  const { data } = Papa.parse<LinkedInRow>(text, { header: true, skipEmptyLines: true });

  // LinkedIn CSV sometimes has a note row at the top — skip non-data rows
  const rows = data.filter((r) => r["First Name"] && r["Last Name"]);

  let synced = 0;
  let skipped = 0;

  for (const row of rows) {
    const name = `${row["First Name"]} ${row["Last Name"]}`.trim();
    const username = row.URL
      ? row.URL.replace(/https?:\/\/(www\.)?linkedin\.com\/in\//, "").replace(/\/$/, "")
      : name.toLowerCase().replace(/\s+/g, "-");

    // LinkedIn CSV doesn't include location — we skip geocoding here.
    // Users can enrich via the manual location sync or OAuth flow later.
    await prisma.connection.upsert({
      where: {
        userId_platform_username: {
          userId: user.id,
          platform: "linkedin",
          username,
        },
      },
      update: {
        name,
        profileUrl: row.URL ?? null,
        syncedAt: new Date(),
      },
      create: {
        userId: user.id,
        platform: "linkedin",
        name,
        username,
        profileUrl: row.URL ?? null,
      },
    });
    synced++;
  }

  return NextResponse.json({ synced, skipped, total: rows.length });
}
