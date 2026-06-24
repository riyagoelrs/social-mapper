"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Users, Search, Upload, X, ChevronRight, RefreshCw } from "lucide-react";

type CityPoint = { city: string; lat: number | null; lng: number | null; count: number };
type Connection = {
  id: string;
  name: string;
  username: string | null;
  platform: string;
  profileUrl: string | null;
  city: string | null;
  rawLocation: string | null;
};

const PLATFORM_COLORS: Record<string, string> = {
  linkedin: "#0A66C2",
  instagram: "#E1306C",
  tiktok: "#2D2D2D",
};

const PLATFORM_LABELS: Record<string, string> = { linkedin: "in", instagram: "ig", tiktok: "tt" };

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

type ImportModalProps = {
  onClose: () => void;
  onImported: () => void;
};

function ImportModal({ onClose, onImported }: ImportModalProps) {
  const [tab, setTab] = useState<"linkedin" | "instagram" | "tiktok">("linkedin");
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [result, setResult] = useState<{ synced: number; total?: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const INSTRUCTIONS = {
    linkedin: {
      title: "Export from LinkedIn",
      steps: [
        "Go to LinkedIn → Settings & Privacy",
        'Click "Data Privacy" → "Get a copy of your data"',
        'Select "Connections" and request the archive',
        "Download and unzip — upload the Connections.csv file here",
      ],
      accept: ".csv",
      endpoint: "/api/import/linkedin",
    },
    instagram: {
      title: "Export from Instagram",
      steps: [
        "Go to Instagram → Settings → Your activity",
        'Tap "Download your information"',
        'Choose "Followers and following" in JSON format',
        "Download and unzip — upload the followers_1.json file here",
      ],
      accept: ".json",
      endpoint: "/api/import/instagram",
    },
    tiktok: {
      title: "Export from TikTok",
      steps: [
        "Go to TikTok → Profile → ☰ → Settings and Privacy",
        'Tap "Privacy" → "Personalization and data"',
        'Request a data download in JSON format',
        "Upload the user_data.json file here",
      ],
      accept: ".json",
      endpoint: "/api/import/tiktok",
    },
  };

  const info = INSTRUCTIONS[tab];

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
    } catch {
      setStatus("error");
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="font-semibold text-white">Import your connections</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Platform tabs */}
        <div className="flex border-b border-gray-800">
          {(["linkedin", "instagram", "tiktok"] as const).map((p) => (
            <button
              key={p}
              onClick={() => { setTab(p); setStatus("idle"); setResult(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${tab === p ? "border-b-2 text-white" : "text-gray-500 hover:text-gray-300"}`}
              style={tab === p ? { borderColor: PLATFORM_COLORS[p] } : {}}
            >
              <PlatformBadge platform={p} size="xs" />
              <span className="capitalize">{p}</span>
            </button>
          ))}
        </div>

        <div className="p-5 space-y-4">
          {/* Instructions */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">{info.title}</p>
            <ol className="space-y-1">
              {info.steps.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-400">
                  <span className="text-gray-600 flex-shrink-0">{i + 1}.</span>
                  {s}
                </li>
              ))}
            </ol>
          </div>

          {/* Drop zone */}
          {status === "idle" && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragging ? "border-indigo-500 bg-indigo-500/10" : "border-gray-700 hover:border-gray-500"}`}
            >
              <Upload size={24} className="mx-auto mb-2 text-gray-500" />
              <p className="text-sm text-gray-400">Drop your file here, or <span className="text-indigo-400">browse</span></p>
              <p className="text-xs text-gray-600 mt-1">{info.accept.replace(".", "").toUpperCase()} file</p>
              <input
                ref={fileRef}
                type="file"
                accept={info.accept}
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }}
              />
            </div>
          )}

          {status === "uploading" && (
            <div className="flex items-center justify-center gap-3 py-8 text-gray-400">
              <RefreshCw size={18} className="animate-spin" />
              <span className="text-sm">Importing connections...</span>
            </div>
          )}

          {status === "done" && result && (
            <div className="rounded-xl bg-green-500/10 border border-green-500/30 p-4 text-center">
              <p className="text-green-400 font-medium">
                {result.synced} connections imported
              </p>
              {result.total && result.total !== result.synced && (
                <p className="text-xs text-gray-500 mt-1">{result.total} rows processed</p>
              )}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => { setStatus("idle"); setResult(null); }}
                  className="flex-1 py-2 text-sm text-gray-400 hover:text-white border border-gray-700 rounded-lg"
                >
                  Import more
                </button>
                <button
                  onClick={() => { onImported(); onClose(); }}
                  className="flex-1 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg"
                >
                  View map
                </button>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-center">
              <p className="text-red-400 text-sm">Upload failed. Make sure you're using the right file format.</p>
              <button
                onClick={() => setStatus("idle")}
                className="mt-3 text-xs text-gray-400 hover:text-white underline"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [cities, setCities] = useState<CityPoint[]>([]);
  const [selectedCity, setSelectedCity] = useState<CityPoint | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [searchCity, setSearchCity] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [showImport, setShowImport] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totalConnections, setTotalConnections] = useState(0);

  const fetchCities = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/connections/cities");
      if (res.ok) {
        const data = await res.json();
        setCities(data);
        setTotalConnections(data.reduce((sum: number, c: CityPoint) => sum + c.count, 0));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCities();
  }, [fetchCities]);

  const handleCityClick = async (city: CityPoint) => {
    setSelectedCity(city);
    const params = new URLSearchParams({ city: city.city });
    if (platformFilter !== "all") params.set("platform", platformFilter);
    const res = await fetch(`/api/connections?${params}`);
    if (res.ok) setConnections(await res.json());
  };

  const filteredCities = cities
    .filter((c) => !searchCity || c.city!.toLowerCase().includes(searchCity.toLowerCase()))
    .sort((a, b) => b.count - a.count);

  // Simple equirectangular projection for the placeholder map
  const toXY = (lat: number, lng: number) => ({
    x: ((lng + 180) / 360) * 100,
    y: ((90 - lat) / 180) * 100,
  });

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      {showImport && (
        <ImportModal onClose={() => setShowImport(false)} onImported={fetchCities} />
      )}

      {/* Sidebar */}
      <aside className="w-72 bg-gray-900 flex flex-col border-r border-gray-800 flex-shrink-0">
        {/* Header */}
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <MapPin size={16} className="text-indigo-400" />
            <h1 className="text-sm font-semibold tracking-tight text-white">Social Mapper</h1>
          </div>
          <p className="text-xs text-gray-500">
            {totalConnections > 0 ? `${totalConnections} connections across ${cities.length} cities` : "Import your connections to get started"}
          </p>
        </div>

        {/* Platform filter */}
        <div className="p-4 border-b border-gray-800">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2.5">Filter by platform</p>
          <div className="flex gap-1.5">
            <button
              onClick={() => setPlatformFilter("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${platformFilter === "all" ? "bg-gray-700 text-white" : "text-gray-500 hover:text-gray-300"}`}
            >
              All
            </button>
            {(["linkedin", "instagram", "tiktok"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPlatformFilter(platformFilter === p ? "all" : p)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all border"
                style={
                  platformFilter === p
                    ? { backgroundColor: PLATFORM_COLORS[p], borderColor: PLATFORM_COLORS[p], color: "white" }
                    : { borderColor: "#374151", color: "#6b7280" }
                }
              >
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
            <input
              type="text"
              placeholder="Search city..."
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-2 text-xs placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 text-white"
            />
          </div>
        </div>

        {/* City list */}
        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-600 text-xs gap-2">
              <RefreshCw size={12} className="animate-spin" />
              Loading...
            </div>
          ) : filteredCities.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xs text-gray-600">No cities yet.</p>
              <button
                onClick={() => setShowImport(true)}
                className="mt-2 text-xs text-indigo-400 hover:text-indigo-300"
              >
                Import connections →
              </button>
            </div>
          ) : (
            <>
              <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2 px-1">
                {filteredCities.length} {filteredCities.length === 1 ? "city" : "cities"}
              </p>
              <div className="space-y-0.5">
                {filteredCities.map((c) => (
                  <button
                    key={c.city}
                    onClick={() => handleCityClick(c)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors text-left group ${
                      selectedCity?.city === c.city ? "bg-indigo-600 text-white" : "hover:bg-gray-800 text-gray-300"
                    }`}
                  >
                    <span className="text-sm">{c.city}</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs ${selectedCity?.city === c.city ? "text-indigo-200" : "text-gray-600"}`}>
                        {c.count}
                      </span>
                      <ChevronRight size={12} className={`transition-opacity opacity-0 group-hover:opacity-100 ${selectedCity?.city === c.city ? "opacity-100" : ""}`} />
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Import CTA */}
        <div className="p-4 border-t border-gray-800 space-y-2">
          <button
            onClick={() => setShowImport(true)}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
          >
            <Upload size={14} />
            Import connections
          </button>
          <p className="text-[10px] text-gray-600 text-center">LinkedIn CSV · Instagram JSON · TikTok JSON</p>
        </div>
      </aside>

      {/* Map area */}
      <main className="flex-1 relative bg-gray-950 overflow-hidden">
        {/* SVG world backdrop */}
        <svg viewBox="0 0 1000 500" className="absolute inset-0 w-full h-full opacity-[0.07]" preserveAspectRatio="xMidYMid slice">
          <rect width="1000" height="500" fill="#1e293b" />
          {/* rough land masses */}
          <path d="M60 160 Q80 130 120 140 Q160 150 180 180 Q200 210 190 240 Q180 270 150 275 Q120 280 100 260 Q70 240 60 210 Z" fill="#334155" />
          <path d="M130 280 Q150 270 170 280 Q190 295 200 320 Q210 350 190 370 Q170 390 145 380 Q120 365 115 340 Q110 310 130 280 Z" fill="#334155" />
          <path d="M320 120 Q370 100 430 110 Q490 120 520 150 Q550 180 545 220 Q540 260 510 280 Q480 295 440 290 Q400 285 370 265 Q340 245 320 215 Q300 180 320 120 Z" fill="#334155" />
          <path d="M380 300 Q410 285 440 295 Q470 310 485 340 Q500 375 480 400 Q460 425 430 425 Q400 425 380 405 Q360 385 355 355 Q350 320 380 300 Z" fill="#334155" />
          <path d="M560 140 Q610 120 670 130 Q730 140 760 170 Q785 195 780 230 Q775 265 745 280 Q715 290 680 285 Q645 275 615 255 Q585 230 570 200 Q555 170 560 140 Z" fill="#334155" />
          <path d="M720 130 Q760 115 810 120 Q855 128 870 155 Q882 180 870 210 Q858 238 830 248 Q800 255 768 245 Q736 232 722 205 Q705 175 720 130 Z" fill="#334155" />
          <path d="M750 280 Q790 265 830 278 Q870 295 880 330 Q888 365 862 388 Q835 410 800 405 Q763 398 748 370 Q730 338 750 280 Z" fill="#334155" />
        </svg>

        {/* City pins */}
        {cities.map((city) => {
          if (!city.lat || !city.lng) return null;
          const { x, y } = toXY(city.lat, city.lng);
          const isSelected = selectedCity?.city === city.city;
          const size = Math.max(28, Math.min(52, 24 + city.count * 2));

          return (
            <button
              key={city.city}
              onClick={() => handleCityClick(city)}
              className="absolute -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-110 focus:outline-none"
              style={{ left: `${x}%`, top: `${y}%`, zIndex: isSelected ? 20 : 10 }}
              title={`${city.city} — ${city.count} connections`}
            >
              <div
                className="rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg transition-all"
                style={{
                  width: size,
                  height: size,
                  backgroundColor: isSelected ? "#818cf8" : "#4f46e5",
                  border: isSelected ? "2px solid white" : "2px solid rgba(255,255,255,0.12)",
                  boxShadow: isSelected ? "0 0 0 6px rgba(79,70,229,0.25)" : "0 2px 8px rgba(0,0,0,0.4)",
                }}
              >
                {city.count}
              </div>
              <span
                className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 text-[10px] whitespace-nowrap px-1.5 py-0.5 rounded"
                style={{ color: isSelected ? "white" : "#9ca3af", backgroundColor: isSelected ? "rgba(79,70,229,0.7)" : "transparent" }}
              >
                {city.city}
              </span>
            </button>
          );
        })}

        {/* Empty state */}
        {!loading && cities.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center pointer-events-auto">
              <MapPin size={32} className="text-indigo-500 opacity-40 mx-auto mb-3" />
              <p className="text-gray-400 text-sm font-medium mb-1">Your social map is empty</p>
              <p className="text-gray-600 text-xs mb-4">Import your LinkedIn, Instagram, or TikTok connections to see where your network lives</p>
              <button
                onClick={() => setShowImport(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
              >
                Import connections
              </button>
            </div>
          </div>
        )}

        {/* Hint when no city selected but there are cities */}
        {!loading && cities.length > 0 && !selectedCity && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-gray-900/80 backdrop-blur border border-gray-700 rounded-full px-4 py-2">
            <p className="text-xs text-gray-400">Click a pin to see your connections in that city</p>
          </div>
        )}

        {/* Connection panel */}
        {selectedCity && (
          <div className="absolute bottom-6 right-6 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-72 overflow-hidden">
            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <div>
                <h3 className="font-semibold text-white text-sm">{selectedCity.city}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{selectedCity.count} connections</p>
              </div>
              <button
                onClick={() => setSelectedCity(null)}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-800 text-gray-500 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Connection list */}
            <div className="p-3 max-h-72 overflow-y-auto">
              {connections.length === 0 ? (
                <p className="text-xs text-gray-600 text-center py-4">No connections found</p>
              ) : (
                <div className="space-y-1">
                  {connections.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-800 transition-colors group"
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: PLATFORM_COLORS[c.platform] ?? "#555" }}
                      >
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-white font-medium truncate">{c.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <PlatformBadge platform={c.platform} size="xs" />
                          {c.username && <p className="text-xs text-gray-500 truncate">@{c.username}</p>}
                        </div>
                      </div>
                      {c.profileUrl && (
                        <a
                          href={c.profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          title="View profile"
                        >
                          <ChevronRight size={14} className="text-gray-500" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedCity.count > connections.length && (
              <div className="px-5 py-3 border-t border-gray-800">
                <p className="text-xs text-gray-600">
                  +{selectedCity.count - connections.length} more · adjust platform filter to narrow
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
