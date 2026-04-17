"use client";

import { useEffect, useRef } from "react";
import { renderToString } from "react-dom/server";
import { Bus, Train } from "lucide-react";
import { useMartaData } from "@/hooks/useMartaData";

interface Props {
  map: google.maps.Map;
}

function animateMarker(
  marker: google.maps.marker.AdvancedMarkerElement,
  newPosition: google.maps.LatLngLiteral
) {
  const currentPos = marker.position as google.maps.LatLngLiteral | null;
  if (!currentPos) {
    marker.position = newPosition;
    return;
  }

  const { lat: startLat, lng: startLng } = currentPos;
  const { lat: endLat, lng: endLng } = newPosition;
  const duration = 1000;
  const startTime = performance.now();

  const step = (now: number) => {
    const t = Math.min((now - startTime) / duration, 1);
    const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    marker.position = {
      lat: startLat + (endLat - startLat) * ease,
      lng: startLng + (endLng - startLng) * ease,
    };
    if (t < 1) requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
}

export function TransitMarkers({ map }: Props) {
  const { vehicles } = useMartaData();
  const markersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(
    new Map()
  );

  useEffect(() => {
    if (!vehicles) return;
    const existing = markersRef.current;
    const currentIds = new Set(vehicles.map((v) => v.id));

    // Remove stale markers
    existing.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.map = null;
        existing.delete(id);
      }
    });

    // Update or create
    vehicles.forEach((vehicle) => {
      const pos = { lat: vehicle.latitude, lng: vehicle.longitude };
      const existing_marker = existing.get(vehicle.id);

      if (existing_marker) {
        animateMarker(existing_marker, pos);
      } else {
        const iconHtml = renderToString(
          vehicle.type === "bus" ? (
            <Bus size={28} color="#F0883E" strokeWidth={2.5} />
          ) : (
            <Train size={28} color="#E8A838" strokeWidth={2.5} />
          )
        );

        const div = document.createElement("div");
        div.innerHTML = iconHtml;
        div.style.filter = "drop-shadow(0 1px 2px rgba(0,0,0,0.5))";

        const marker = new google.maps.marker.AdvancedMarkerElement({
          map,
          position: pos,
          content: div,
          title: `${vehicle.type === "bus" ? "Bus" : "Train"} · Route ${vehicle.route}`,
        });

        existing.set(vehicle.id, marker);
      }
    });
  }, [map, vehicles]);

  return null;
}
