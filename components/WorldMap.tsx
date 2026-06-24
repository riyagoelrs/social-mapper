"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";

type CityPoint = { city: string; lat: number | null; lng: number | null; count: number };
type Trip = { id: string; city: string; lat: number | null; lng: number | null };

interface Props {
  cities: CityPoint[];
  trips: Trip[];
  selectedCity: CityPoint | null;
  onCityClick: (city: CityPoint) => void;
}

// Simple equirectangular projection to % position on the SVG backdrop
function toXY(lat: number, lng: number) {
  return { x: ((lng + 180) / 360) * 100, y: ((90 - lat) / 180) * 100 };
}

// ─── Mapbox map (only rendered when token is present) ─────────────────────────

function MapboxMap({ cities, trips, selectedCity, onCityClick }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { default: Map, Marker, Popup } = require("react-map-gl/mapbox");
  const [popupCity, setPopupCity] = useState<CityPoint | null>(selectedCity);

  const handleClick = (city: CityPoint) => {
    setPopupCity(city);
    onCityClick(city);
  };

  // Track trip cities for distinct marker style
  const tripCityNames = new Set(trips.map((t) => t.city.toLowerCase()));

  return (
    <>
      <link href="https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css" rel="stylesheet" />
      <Map
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        initialViewState={{ longitude: 10, latitude: 25, zoom: 1.6 }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
      >
        {/* Connection city markers */}
        {cities.map((city) => {
          if (!city.lat || !city.lng) return null;
          const size = Math.max(28, Math.min(56, 22 + city.count * 2));
          const isSelected = selectedCity?.city === city.city;
          const isTrip = tripCityNames.has(city.city.toLowerCase());
          return (
            <Marker key={`city-${city.city}`} longitude={city.lng} latitude={city.lat} onClick={() => handleClick(city)}>
              <div
                className="rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer shadow-lg transition-all hover:scale-110"
                style={{
                  width: size, height: size,
                  backgroundColor: isSelected ? "#818cf8" : "#4f46e5",
                  border: isSelected ? "2px solid white" : isTrip ? "2px solid #f59e0b" : "2px solid rgba(255,255,255,0.12)",
                  boxShadow: isSelected ? "0 0 0 6px rgba(79,70,229,0.25)" : "0 2px 8px rgba(0,0,0,0.5)",
                }}
              >
                {city.count}
              </div>
            </Marker>
          );
        })}

        {/* Trip markers for cities with no connections yet */}
        {trips
          .filter((t) => t.lat && t.lng && !cities.find((c) => c.city.toLowerCase() === t.city.toLowerCase()))
          .map((trip) => (
            <Marker key={`trip-${trip.id}`} longitude={trip.lng!} latitude={trip.lat!}>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
                style={{ backgroundColor: "#f59e0b", border: "2px solid rgba(255,255,255,0.3)" }}
                title={`Trip: ${trip.city}`}
              >
                <MapPin size={14} className="text-white" />
              </div>
            </Marker>
          ))}

        {/* Popup on selected city */}
        {popupCity && popupCity.lat && popupCity.lng && (
          <Popup
            longitude={popupCity.lng} latitude={popupCity.lat}
            onClose={() => setPopupCity(null)} closeButton={false} offset={20}
            className="!bg-transparent !p-0 !shadow-none"
          >
            <div className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white shadow-2xl whitespace-nowrap">
              <span className="font-medium">{popupCity.city}</span>
              <span className="text-gray-400 ml-2">{popupCity.count} connections</span>
            </div>
          </Popup>
        )}
      </Map>
    </>
  );
}

// ─── SVG fallback map ─────────────────────────────────────────────────────────

function SvgMap({ cities, trips, selectedCity, onCityClick }: Props) {
  const tripCityNames = new Set(trips.map((t) => t.city.toLowerCase()));

  return (
    <div className="w-full h-full relative">
      {/* Backdrop */}
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

      {/* City pins */}
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
                boxShadow: isSelected ? "0 0 0 6px rgba(79,70,229,0.25)" : "0 2px 8px rgba(0,0,0,0.4)",
              }}>
              {city.count}
            </div>
            <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 text-[10px] whitespace-nowrap px-1.5 py-0.5 rounded"
              style={{ color: isSelected ? "white" : "#9ca3af", backgroundColor: isSelected ? "rgba(79,70,229,0.7)" : "transparent" }}>
              {city.city}
            </span>
          </button>
        );
      })}

      {/* Trip pins for cities with no connections */}
      {trips
        .filter((t) => t.lat && t.lng && !cities.find((c) => c.city.toLowerCase() === t.city.toLowerCase()))
        .map((trip) => {
          const { x, y } = toXY(trip.lat!, trip.lng!);
          return (
            <div key={trip.id} className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${x}%`, top: `${y}%`, zIndex: 10 }}
              title={`Trip: ${trip.city}`}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
                style={{ backgroundColor: "#f59e0b", border: "2px solid rgba(255,255,255,0.3)" }}>
                <MapPin size={13} className="text-white" />
              </div>
              <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 text-[10px] text-amber-400 whitespace-nowrap">{trip.city}</span>
            </div>
          );
        })}

      {/* Mapbox token prompt */}
      <div className="absolute bottom-4 right-4 bg-gray-900/80 backdrop-blur border border-gray-700 rounded-xl px-4 py-3 text-xs text-gray-500 max-w-xs">
        <span className="text-amber-400 font-medium">Add Mapbox token</span> in{" "}
        <code className="text-gray-400">.env</code> for a real interactive map.{" "}
        <a href="https://account.mapbox.com/access-tokens/" target="_blank" rel="noopener noreferrer"
          className="text-indigo-400 hover:text-indigo-300">Get a free token →</a>
      </div>
    </div>
  );
}

// ─── Auto-select Mapbox vs SVG ────────────────────────────────────────────────

export default function WorldMap(props: Props) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (token) return <MapboxMap {...props} />;
  return <SvgMap {...props} />;
}
