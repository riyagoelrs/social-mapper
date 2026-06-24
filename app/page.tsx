"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Users, Search, Upload, X, ChevronRight, RefreshCw, Plane, Plus, Trash2, CalendarDays } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamically import the map so it only loads client-side (Mapbox requires window)
const WorldMap = dynamic(() => import("@/components/WorldMap"), { ssr: false });

// ─── Types ────────────────────────────────────────────────────────────────────

type CityPoint = { city: string; lat: number | null; lng: number | null; count: number };
type Connection = {
  id: string; name: string; username: string | null;
  platform: string; profileUrl: string | null; city: string | null;
};
type Trip = {
  id: string; city: string; country: string | null;
  lat: number | null; lng: number | null;
  startDate: string | null; endDate: string | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const PLATFORM_COLORS: Record<string, string> = {
  linkedin: "#0A66C2", instagram: "#E1306C", tiktok: "#2D2D2D",
};
const PLATFORM_LABELS: Record<string, string> = {
  linkedin: "in", instagram: "ig", tiktok: "tt",
};

// ─── Tiny components ──────────────────────────────────────────────────────────

function PlatformBadge({ platform, size = "sm" }: { platform: string; size?: "sm" | "xs" }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded font-bold text-white leading-none ${size === "xs" ? "w-4 h-4 text-[8px]" : "w-5 h-5 text-[9px]"}`}
      style={{ backgroundColor: PLATFORM_COLORS[platform] ?? "#555" }}
    >
      {PLATFORM_LABELS[platform] ?? platform.slice(0, 2)}
    </span>
  );
}

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Import modal ─────────────────────────────────────────────────────────────

function ImportModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const [tab, setTab] = useState<"linkedin" | "instagram" | "tiktok">("linkedin");
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [result, setResult] = useState<{ synced: number; total?: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const INFO = {
    linkedin: {
      title: "Export from LinkedIn",
      steps: ["Go to Settings & Privacy → Data Privacy", 'Click "Get a copy of your data" → Connections', "Download the archive, unzip it", "Upload Connections.csv here"],
      accept: ".csv", endpoint: "/api/import/linkedin",
    },
    instagram: {
      title: "Export from Instagram",
      steps: ["Settings → Your activity → Download your information", "Choose Followers and following in JSON format", "Download and unzip the archive", "Upload followers_1.json here"],
      accept: ".json", endpoint: "/api/import/instagram",
    },
    tiktok: {
      title: "Export from TikTok",
      steps: ["Profile → ☰ → Settings → Privacy", "Personalization and data → Download your data", "Request JSON format, download and unzip", "Upload user_data.json here"],
      accept: ".json", endpoint: "/api/import/tiktok",
    },
  };

  const info = INFO[tab];

  const upload = async (file: File) => {
    setStatus("uploading");
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch(info.endpoint, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setResult(data);
      setStatus("done");
    } catch { setStatus("error"); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="font-semibold text-white">Import connections</h2>
          <button onClick={onClose}><X size={18} className="text-gray-500 hover:text-white" /></button>
        </div>
        <div className="flex border-b border-gray-800">
          {(["linkedin", "instagram", "tiktok"] as const).map((p) => (
            <button key={p} onClick={() => { setTab(p); setStatus("idle"); setResult(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${tab === p ? "border-b-2 text-white" : "text-gray-500 hover:text-gray-300"}`}
              style={tab === p ? { borderColor: PLATFORM_COLORS[p] } : {}}>
              <PlatformBadge platform={p} size="xs" />
              <span className="capitalize">{p}</span>
            </button>
          ))}
        </div>
        <div className="p-5 space-y-4">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">{info.title}</p>
            <ol className="space-y-1">
              {info.steps.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-400">
                  <span className="text-gray-600 flex-shrink-0">{i + 1}.</span>{s}
                </li>
              ))}
            </ol>
          </div>
          {status === "idle" && (
            <div onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) upload(f); }}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragging ? "border-indigo-500 bg-indigo-500/10" : "border-gray-700 hover:border-gray-500"}`}>
              <Upload size={22} className="mx-auto mb-2 text-gray-500" />
              <p className="text-sm text-gray-400">Drop file here or <span className="text-indigo-400">browse</span></p>
              <p className="text-xs text-gray-600 mt-1">{info.accept.replace(".", "").toUpperCase()} file</p>
              <input ref={fileRef} type="file" accept={info.accept} className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />
            </div>
          )}
          {status === "uploading" && (
            <div className="flex items-center justify-center gap-3 py-8 text-gray-400">
              <RefreshCw size={16} className="animate-spin" /><span className="text-sm">Importing...</span>
            </div>
          )}
          {status === "done" && result && (
            <div className="rounded-xl bg-green-500/10 border border-green-500/30 p-4 text-center">
              <p className="text-green-400 font-medium">{result.synced} connections imported</p>
              {result.total && result.total !== result.synced && <p className="text-xs text-gray-500 mt-1">{result.total} rows processed</p>}
              <div className="flex gap-2 mt-4">
                <button onClick={() => { setStatus("idle"); setResult(null); }}
                  className="flex-1 py-2 text-sm text-gray-400 border border-gray-700 rounded-lg hover:text-white">Import more</button>
                <button onClick={() => { onImported(); onClose(); }}
                  className="flex-1 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg">View map</button>
              </div>
            </div>
          )}
          {status === "error" && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-center">
              <p className="text-red-400 text-sm">Upload failed — check the file format.</p>
              <button onClick={() => setStatus("idle")} className="mt-3 text-xs text-gray-400 underline hover:text-white">Try again</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Add Trip modal ───────────────────────────────────────────────────────────

function AddTripModal({ onClose, onAdded }: { onClose: () => void; onAdded: (trip: Trip) => void }) {
  const [city, setCity] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city, startDate: startDate || undefined, endDate: endDate || undefined }),
      });
      if (!res.ok) throw new Error("Failed to add trip");
      const trip = await res.json();
      onAdded(trip);
      onClose();
    } catch { setError("Couldn't add trip — try again."); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="font-semibold text-white">Add a trip</h2>
          <button onClick={onClose}><X size={18} className="text-gray-500 hover:text-white" /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1.5">City</label>
            <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="New York, Tokyo, Berlin..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1.5">From</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1.5">To</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
            </div>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button type="submit" disabled={!city.trim() || loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Plane size={14} />}
            Add trip
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Home() {
  const [tab, setTab] = useState<"map" | "trips">("map");
  const [cities, setCities] = useState<CityPoint[]>([]);
  const [selectedCity, setSelectedCity] = useState<CityPoint | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripConnections, setTripConnections] = useState<Record<string, Connection[]>>({});
  const [searchCity, setSearchCity] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [showImport, setShowImport] = useState(false);
  const [showAddTrip, setShowAddTrip] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchCities = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/connections/cities");
      if (res.ok) setCities(await res.json());
    } finally { setLoading(false); }
  }, []);

  const fetchTrips = useCallback(async () => {
    const res = await fetch("/api/trips");
    if (res.ok) {
      const data: Trip[] = await res.json();
      setTrips(data);
      // Fetch connections for each trip city
      const byCity: Record<string, Connection[]> = {};
      await Promise.all(data.map(async (t) => {
        const r = await fetch(`/api/connections?city=${encodeURIComponent(t.city)}`);
        if (r.ok) byCity[t.id] = await r.json();
      }));
      setTripConnections(byCity);
    }
  }, []);

  useEffect(() => { fetchCities(); fetchTrips(); }, [fetchCities, fetchTrips]);

  const handleCityClick = async (city: CityPoint) => {
    setSelectedCity(city);
    const params = new URLSearchParams({ city: city.city });
    if (platformFilter !== "all") params.set("platform", platformFilter);
    const res = await fetch(`/api/connections?${params}`);
    if (res.ok) setConnections(await res.json());
  };

  const deleteTrip = async (id: string) => {
    await fetch("/api/trips", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setTrips((t) => t.filter((x) => x.id !== id));
  };

  const filteredCities = cities
    .filter((c) => !searchCity || c.city!.toLowerCase().includes(searchCity.toLowerCase()))
    .sort((a, b) => b.count - a.count);

  const totalConnections = cities.reduce((s, c) => s + c.count, 0);

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      {showImport && <ImportModal onClose={() => setShowImport(false)} onImported={fetchCities} />}
      {showAddTrip && <AddTripModal onClose={() => setShowAddTrip(false)} onAdded={(t) => { setTrips((prev) => [...prev, t]); fetchTrips(); }} />}

      {/* ── Sidebar ── */}
      <aside className="w-72 bg-gray-900 flex flex-col border-r border-gray-800 flex-shrink-0">
        {/* Header */}
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <MapPin size={16} className="text-indigo-400" />
            <h1 className="text-sm font-semibold text-white">Social Mapper</h1>
          </div>
          <p className="text-xs text-gray-500">
            {totalConnections > 0 ? `${totalConnections} connections · ${cities.length} cities` : "Import your connections to get started"}
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-gray-800">
          {([["map", "Map"], ["trips", "Trips"]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors ${tab === key ? "text-white border-b-2 border-indigo-500" : "text-gray-500 hover:text-gray-300"}`}>
              {label}
            </button>
          ))}
        </div>

        {/* ── Map tab content ── */}
        {tab === "map" && (
          <>
            {/* Platform filter */}
            <div className="p-4 border-b border-gray-800">
              <div className="flex gap-1.5 flex-wrap">
                <button onClick={() => setPlatformFilter("all")}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${platformFilter === "all" ? "bg-gray-700 text-white" : "text-gray-500 hover:text-gray-300"}`}>
                  All
                </button>
                {(["linkedin", "instagram", "tiktok"] as const).map((p) => (
                  <button key={p} onClick={() => setPlatformFilter(platformFilter === p ? "all" : p)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all border"
                    style={platformFilter === p
                      ? { backgroundColor: PLATFORM_COLORS[p], borderColor: PLATFORM_COLORS[p], color: "white" }
                      : { borderColor: "#374151", color: "#6b7280" }}>
                    <PlatformBadge platform={p} size="xs" />
                    <span className="capitalize">{p}</span>
                  </button>
                ))}
              </div>
            </div>
            {/* Search */}
            <div className="px-4 py-3 border-b border-gray-800">
              <div className="relative">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                <input type="text" placeholder="Search city..." value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-2 text-xs placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 text-white" />
              </div>
            </div>
            {/* City list */}
            <div className="flex-1 overflow-y-auto p-3">
              {loading ? (
                <div className="flex items-center justify-center py-12 text-gray-600 text-xs gap-2">
                  <RefreshCw size={12} className="animate-spin" /> Loading...
                </div>
              ) : filteredCities.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-xs text-gray-600">No cities yet.</p>
                  <button onClick={() => setShowImport(true)} className="mt-2 text-xs text-indigo-400 hover:text-indigo-300">Import connections →</button>
                </div>
              ) : (
                <>
                  <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2 px-1">{filteredCities.length} cities</p>
                  <div className="space-y-0.5">
                    {filteredCities.map((c) => (
                      <button key={c.city} onClick={() => handleCityClick(c)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors text-left group ${selectedCity?.city === c.city ? "bg-indigo-600 text-white" : "hover:bg-gray-800 text-gray-300"}`}>
                        <span>{c.city}</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs ${selectedCity?.city === c.city ? "text-indigo-200" : "text-gray-600"}`}>{c.count}</span>
                          <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* ── Trips tab content ── */}
        {tab === "trips" && (
          <div className="flex-1 overflow-y-auto p-3">
            {trips.length === 0 ? (
              <div className="text-center py-12">
                <Plane size={28} className="mx-auto text-indigo-500 opacity-40 mb-3" />
                <p className="text-xs text-gray-500 font-medium">No trips planned</p>
                <p className="text-xs text-gray-600 mt-1 mb-4">Add a trip to see who's in that city</p>
                <button onClick={() => setShowAddTrip(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg transition-colors">
                  Add your first trip
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {trips.map((trip) => {
                  const conns = tripConnections[trip.id] ?? [];
                  return (
                    <div key={trip.id} className="bg-gray-800 rounded-xl p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-white">{trip.city}</p>
                          {(trip.startDate || trip.endDate) && (
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <CalendarDays size={10} />
                              {formatDate(trip.startDate)}
                              {trip.endDate && ` → ${formatDate(trip.endDate)}`}
                            </p>
                          )}
                        </div>
                        <button onClick={() => deleteTrip(trip.id)} className="text-gray-600 hover:text-red-400 transition-colors p-1">
                          <Trash2 size={13} />
                        </button>
                      </div>
                      {conns.length > 0 ? (
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">People to see · {conns.length}</p>
                          <div className="space-y-1.5">
                            {conns.slice(0, 5).map((c) => (
                              <div key={c.id} className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                                  style={{ backgroundColor: PLATFORM_COLORS[c.platform] ?? "#555" }}>
                                  {c.name.charAt(0)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs text-white font-medium truncate">{c.name}</p>
                                </div>
                                <PlatformBadge platform={c.platform} size="xs" />
                                {c.profileUrl && (
                                  <a href={c.profileUrl} target="_blank" rel="noopener noreferrer">
                                    <ChevronRight size={12} className="text-gray-600 hover:text-white" />
                                  </a>
                                )}
                              </div>
                            ))}
                            {conns.length > 5 && (
                              <p className="text-xs text-gray-600 pl-8">+{conns.length - 5} more</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-600">No connections in {trip.city} yet.</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Bottom actions */}
        <div className="p-4 border-t border-gray-800 space-y-2">
          {tab === "map" ? (
            <button onClick={() => setShowImport(true)}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
              <Upload size={14} /> Import connections
            </button>
          ) : (
            <button onClick={() => setShowAddTrip(true)}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
              <Plus size={14} /> Add a trip
            </button>
          )}
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-gray-600">LinkedIn · Instagram · TikTok</p>
            <a href="/login" className="text-[10px] text-gray-600 hover:text-indigo-400 transition-colors">Sign in →</a>
          </div>
        </div>
      </aside>

      {/* ── Map area ── */}
      <main className="flex-1 relative bg-gray-950 overflow-hidden">
        <WorldMap
          cities={cities}
          trips={trips}
          selectedCity={selectedCity}
          onCityClick={handleCityClick}
        />

        {/* Connection panel */}
        {selectedCity && (
          <div className="absolute bottom-6 right-6 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-72 overflow-hidden z-20">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <div>
                <h3 className="font-semibold text-white text-sm">{selectedCity.city}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{selectedCity.count} connections</p>
              </div>
              <button onClick={() => setSelectedCity(null)}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-800 text-gray-500 hover:text-white transition-colors">
                <X size={14} />
              </button>
            </div>
            <div className="p-3 max-h-72 overflow-y-auto">
              {connections.length === 0 ? (
                <p className="text-xs text-gray-600 text-center py-4">No connections found</p>
              ) : (
                <div className="space-y-1">
                  {connections.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-800 transition-colors group">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: PLATFORM_COLORS[c.platform] ?? "#555" }}>
                        {c.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-white font-medium truncate">{c.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <PlatformBadge platform={c.platform} size="xs" />
                          {c.username && <p className="text-xs text-gray-500 truncate">@{c.username}</p>}
                        </div>
                      </div>
                      {c.profileUrl && (
                        <a href={c.profileUrl} target="_blank" rel="noopener noreferrer"
                          className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronRight size={14} className="text-gray-500" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {selectedCity.count > connections.length && (
                <div className="px-2 pt-2 border-t border-gray-800 mt-2">
                  <p className="text-xs text-gray-600">+{selectedCity.count - connections.length} more · filter by platform to narrow</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty state overlay */}
        {!loading && cities.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="text-center pointer-events-auto">
              <MapPin size={32} className="text-indigo-500 opacity-40 mx-auto mb-3" />
              <p className="text-gray-400 text-sm font-medium mb-1">Your social map is empty</p>
              <p className="text-gray-600 text-xs mb-4">Import your LinkedIn, Instagram, or TikTok connections</p>
              <button onClick={() => setShowImport(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors">
                Import connections
              </button>
            </div>
          </div>
        )}

        {!loading && cities.length > 0 && !selectedCity && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-gray-900/80 backdrop-blur border border-gray-700 rounded-full px-4 py-2 z-10">
            <p className="text-xs text-gray-400">Click a pin to see your connections in that city</p>
          </div>
        )}
      </main>
    </div>
  );
}
