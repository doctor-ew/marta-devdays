"use client";

import { useEffect, useRef, useState } from "react";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { TransitMarkers } from "./TransitMarkers";

const MBS = {
  lat: parseFloat(process.env.NEXT_PUBLIC_STADIUM_LAT ?? "33.754542"),
  lng: parseFloat(process.env.NEXT_PUBLIC_STADIUM_LNG ?? "-84.402492"),
};

interface Props {
  onTrafficChange?: (on: boolean) => void;
}

export function StadiumMap({ onTrafficChange }: Props) {
  const divRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [trafficOn, setTrafficOn] = useState(true);
  const trafficRef = useRef<google.maps.TrafficLayer | null>(null);

  // Init map once
  useEffect(() => {
    let mounted = true;

    async function init() {
      if (!divRef.current || map) return;

      setOptions({
        key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        v: "weekly",
      });

      try {
        const { Map } = (await importLibrary("maps")) as google.maps.MapsLibrary;
        await importLibrary("marker");

        if (!mounted || !divRef.current) return;

        const newMap = new Map(divRef.current, {
          center: MBS,
          zoom: 14,
          mapId: "MERCEDES_BENZ_STADIUM_MAP",
          disableDefaultUI: true,
          gestureHandling: "greedy",
        });

        // Traffic layer — on by default
        trafficRef.current = new google.maps.TrafficLayer();
        trafficRef.current.setMap(newMap);

        // Stadium marker — soccer ball
        const stadiumDiv = document.createElement("div");
        stadiumDiv.textContent = "⚽";
        stadiumDiv.title = process.env.NEXT_PUBLIC_STADIUM_NAME ?? "Mercedes-Benz Stadium";
        stadiumDiv.style.cssText =
          "font-size:28px;filter:drop-shadow(0 1px 3px rgba(0,0,0,0.6));cursor:default;";
        new google.maps.marker.AdvancedMarkerElement({
          map: newMap,
          position: MBS,
          content: stadiumDiv,
          title: process.env.NEXT_PUBLIC_STADIUM_NAME ?? "Mercedes-Benz Stadium",
        });

        // User location
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              if (!mounted) return;
              const userDiv = document.createElement("div");
              userDiv.textContent = "🧍";
              userDiv.style.cssText =
                "font-size:24px;filter:drop-shadow(0 1px 3px rgba(0,0,0,0.5));";
              new google.maps.marker.AdvancedMarkerElement({
                map: newMap,
                position: { lat: pos.coords.latitude, lng: pos.coords.longitude },
                content: userDiv,
                title: "You",
              });
            },
            () => {}
          );
        }

        setMap(newMap);
      } catch {
        // Non-fatal — app routes without the map
      }
    }

    init();
    return () => { mounted = false; };
  }, [map]);

  // Toggle traffic layer
  useEffect(() => {
    if (!map || !trafficRef.current) return;
    trafficRef.current.setMap(trafficOn ? map : null);
    onTrafficChange?.(trafficOn);
  }, [trafficOn, map, onTrafficChange]);

  return (
    <div className="relative w-full h-full" data-testid="map-container">
      <div ref={divRef} className="w-full h-full" />
      {map && <TransitMarkers map={map} />}

      {/* Traffic toggle — bottom left, matching original */}
      <button
        onClick={() => setTrafficOn((v) => !v)}
        aria-pressed={trafficOn}
        aria-label="Toggle traffic layer"
        className={[
          "absolute bottom-4 left-4 z-10 flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold shadow-md transition-colors",
          trafficOn
            ? "bg-accent text-bg"
            : "bg-bg/90 text-text border border-border",
        ].join(" ")}
      >
        <span aria-hidden="true">🚦</span>
        Traffic: {trafficOn ? "ON" : "OFF"}
      </button>
    </div>
  );
}
