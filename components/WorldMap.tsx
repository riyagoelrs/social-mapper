"use client";

import { useEffect, useRef } from "react";
import { MapPin } from "lucide-react";

type CityPoint = { city: string; lat: number | null; lng: number | null; count: number };
type Trip = { id: string; city: string; lat: number | null; lng: number | null };

interface Props {
  cities: CityPoint[];
  trips: Trip[];
  selectedCity: CityPoint | null;
  onCityClick: (city: CityPoint) => void;
}

// Simple equirectangular projection for the SVG fallback
function toXY(lat: number, lng: number) {
  return { x: ((lng + 180) / 360) * 100, y: ((90 - lat) / 180) * 100 };
}

// ─── Leaflet map (free, no API key) ──────────────────────────────────────────

function LeafletMap({ cities, trips, selectedCity, onCityClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markersRef = useRef<import("leaflet").CircleMarker[]>([]);
  const tripMarkersRef = useRef<import("leaflet").Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    import("leaflet").then((L) => {
      // Fix default icon paths broken by webpack
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current!, {
        center: [25, 10],
        zoom: 2,
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Update city markers when cities or selectedCity changes
  useEffect(() => {
    if (!mapRef.current) return;

    import("leaflet").then((L) => {
      const map = mapRef.current!;
      const tripCityNames = new Set(trips.map((t) => t.city.toLowerCase()));

      // Remove old markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      cities.forEach((city) => {
        if (!city.lat || !city.lng) return;
        const isSelected = selectedCity?.city === city.city;
        const isTrip = tripCityNames.has(city.city.toLowerCase());
        const radius = Math.max(14, Math.min(28, 10 + city.count * 1.5));

        const marker = L.circleMarker([city.lat, city.lng], {
          radius,
          fillColor: isSelected ? "#818cf8" : "#4f46e5",
          color: isSelected ? "#ffffff" : isTrip ? "#f59e0b" : "rgba(255,255,255,0.2)",
          weight: isSelected ? 2 : 1.5,
          fillOpacity: 0.9,
        }).addTo(map);

        // Label
        const label = L.divIcon({
          className: "",
          html: `<div style="color:white;font-size:11px;font-weight:700;text-align:center;line-height:1;pointer-events:none">${city.count}</div>`,
          iconSize: [radius * 2, radius * 2],
          iconAnchor: [radius, radius],
        });
        L.marker([city.lat, city.lng], { icon: label, interactive: false }).addTo(map);

        marker.on("click", () => onCityClick(city));
        marker.bindTooltip(`<b>${city.city}</b><br>${city.count} connections`, {
          className: "leaflet-tooltip-dark",
          direction: "top",
          offset: [0, -radius],
        });

        markersRef.current.push(marker);
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cities, selectedCity]);

  // Trip-only markers
  useEffect(() => {
    if (!mapRef.current) return;

    import("leaflet").then((L) => {
      tripMarkersRef.current.forEach((m) => m.remove());
      tripMarkersRef.current = [];

      trips
        .filter((t) => t.lat && t.lng && !cities.find((c) => c.city.toLowerCase() === t.city.toLowerCase()))
        .forEach((trip) => {
          const icon = L.divIcon({
            className: "",
            html: `<div style="width:28px;height:28px;background:#f59e0b;border-radius:50%;border:2px solid rgba(255,255,255,0.4);display:flex;align-items:center;justify-content:center">
                     <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3" fill="none" stroke="white" stroke-width="2"/></svg>
                   </div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });
          const m = L.marker([trip.lat!, trip.lng!], { icon })
            .addTo(mapRef.current!)
            .bindTooltip(`Trip: ${trip.city}`, { className: "leaflet-tooltip-dark", direction: "top" });
          tripMarkersRef.current.push(m);
        });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trips, cities]);

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>{`
        .leaflet-tooltip-dark {
          background: #111827;
          border: 1px solid #374151;
          color: #f9fafb;
          border-radius: 8px;
          font-size: 12px;
          padding: 6px 10px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        }
        .leaflet-tooltip-dark::before { border-top-color: #374151; }
        .leaflet-container { background: #0f172a; }
        .leaflet-control-attribution { background: rgba(17,24,39,0.8) !important; color: #6b7280 !important; }
        .leaflet-control-attribution a { color: #6b7280 !important; }
      `}</style>
      <div ref={containerRef} className="w-full h-full" />
    </>
  );
}

// ─── SVG fallback (no dependencies) ──────────────────────────────────────────

function SvgMap({ cities, trips, selectedCity, onCityClick }: Props) {
  const tripCityNames = new Set(trips.map((t) => t.city.toLowerCase()));

  return (
    <div className="w-full h-full relative">
      <svg viewBox="0 0 1000 500" className="absolute inset-0 w-full h-full opacity-[0.08]" preserveAspectRatio="xMidYMid slice">
        <rect width="1000" height="500" fill="#1e293b" />
        <path d="M60 160 Q80 130 120 140 Q160 150 180 180 Q200 210 190 240 Q180 270 150 275 Q120 280 100 260 Q70 240 60 210 Z" fill="#334155" />
        <path d="M130 280 Q150 270 170 280 Q190 295 200 320 Q210 350 190 370 Q170 390 145 380 Q120 365 115 340 Q110 310 130 280 Z" fill="#334155" />
        <path d="M320 120 Q370 100 430 110 Q490 120 520 150 Q550 180 545 220 Q540 260 510 280 Q480 295 440 290 Q400 285 370 265 Q340 245 320 215 Q300 180 320 120 Z" fill="#334155" />
        <path d="M380 300 Q410 285 440 295 Q470 310 485 340 Q500 375 480 400 Q460 425 430 425 Q400 425 380 405 Q360 385 355 355 Q350 320 380 300 Z" fill="#334155" />
        <path d="M560 140 Q610 120 670 130 Q730 140 760 170 Q785 195 780 230 Q775 265 745 280 Q715 290 680 285 Q645 275 615 255 Q585 230 570 200 Q555 170 560 140 Z" fill="#334155" />
        <path d="M720 130 Q760 115 810 120 Q855 128 870 155 Q882 180 870 210 Q858 238 830 248 Q800 255 768 245 Q736 232 722 205 Q705 175 720 130 Z" fill="#334155" />
        <path d="M750 280 Q790 265 830 278 Q870 295 880 330 Q888 365 862 388 Q835 410 800 405 Q763 398 748 370 Q730 338 750 280 Z" fill="#334155" />
      </svg>
      {cities.map((city) => {
        if (!city.lat || !city.lng) return null;
        const { x, y } = toXY(city.lat, city.lng);
        const isSelected = selectedCity?.city === city.city;
        const isTrip = tripCityNames.has(city.city.toLowerCase());
        const size = Math.max(28, Math.min(52, 22 + city.count * 2));
        return (
          <button key={city.city} onClick={() => onCityClick(city)}
            className="absolute -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-110 focus:outline-none"
            style={{ left: `${x}%`, top: `${y}%`, zIndex: isSelected ? 20 : 10 }}>
            <div className="rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg"
              style={{
                width: size, height: size,
                backgroundColor: isSelected ? "#818cf8" : "#4f46e5",
                border: isSelected ? "2px solid white" : isTrip ? "2px solid #f59e0b" : "2px solid rgba(255,255,255,0.12)",
                boxShadow: isSelected ? "0 0 0 6px rgba(79,70,229,0.25)" : undefined,
              }}>
              {city.count}
            </div>
            <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 text-[10px] whitespace-nowrap px-1 py-0.5 rounded"
              style={{ color: isSelected ? "white" : "#9ca3af", backgroundColor: isSelected ? "rgba(79,70,229,0.7)" : "transparent" }}>
              {city.city}
            </span>
          </button>
        );
      })}
      {trips.filter((t) => t.lat && t.lng && !cities.find((c) => c.city.toLowerCase() === t.city.toLowerCase()))
        .map((trip) => {
          const { x, y } = toXY(trip.lat!, trip.lng!);
          return (
            <div key={trip.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%`, top: `${y}%`, zIndex: 10 }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: "#f59e0b", border: "2px solid rgba(255,255,255,0.3)" }}>
                <MapPin size={13} className="text-white" />
              </div>
              <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 text-[10px] text-amber-400 whitespace-nowrap">{trip.city}</span>
            </div>
          );
        })}
    </div>
  );
}

// ─── Entry: always use Leaflet now ───────────────────────────────────────────

export default function WorldMap(props: Props) {
  return <LeafletMap {...props} />;
}
