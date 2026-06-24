// Uses the free Nominatim API (no key needed) to resolve city names to lat/lng.
// Cache results to avoid hammering the API.
const cache = new Map<string, { lat: number; lng: number; city: string; country: string } | null>();

export async function geocodeCity(
  rawLocation: string
): Promise<{ lat: number; lng: number; city: string; country: string } | null> {
  const key = rawLocation.toLowerCase().trim();
  if (cache.has(key)) return cache.get(key)!;

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(rawLocation)}&format=json&limit=1&addressdetails=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "SocialMapper/1.0 (riyagoelrs@gmail.com)" },
    });
    const data = await res.json();
    if (!data?.length) {
      cache.set(key, null);
      return null;
    }
    const r = data[0];
    const result = {
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      city: r.address?.city || r.address?.town || r.address?.village || r.address?.county || rawLocation,
      country: r.address?.country || "",
    };
    cache.set(key, result);
    return result;
  } catch {
    cache.set(key, null);
    return null;
  }
}
