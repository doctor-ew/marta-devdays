'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { renderToString } from 'react-dom/server';
import { Bus, Train } from 'lucide-react';
import { Loader } from '@googlemaps/js-api-loader';
import useSWR from 'swr';
import type { Vehicle, MartaApiResponse } from '@/types';
const IS_STATIC = process.env.NEXT_PUBLIC_STATIC_DEMO === 'true';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '';

const STADIUM_LAT = parseFloat(process.env.NEXT_PUBLIC_STADIUM_LAT ?? '33.7554');
const STADIUM_LNG = parseFloat(process.env.NEXT_PUBLIC_STADIUM_LNG ?? '-84.4011');
const STADIUM_NAME = process.env.NEXT_PUBLIC_STADIUM_NAME ?? 'Mercedes-Benz Stadium';

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json() as Promise<MartaApiResponse>);

function animateMarker(
  marker: google.maps.marker.AdvancedMarkerElement,
  to: google.maps.LatLngLiteral,
  duration = 1000,
) {
  const current = marker.position as google.maps.LatLngLiteral | null;
  if (!current) { marker.position = to; return; }

  const { lat: startLat, lng: startLng } = current;
  const startTime = performance.now();

  function step(now: number) {
    const t = Math.min((now - startTime) / duration, 1);
    const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    marker.position = {
      lat: startLat + (to.lat - startLat) * ease,
      lng: startLng + (to.lng - startLng) * ease,
    };
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function makeVehicleIcon(type: 'bus' | 'train'): HTMLElement {
  const div = document.createElement('div');
  div.innerHTML = renderToString(
    type === 'bus'
      ? <Bus size={28} color="#F0883E" strokeWidth={2.5} />
      : <Train size={28} color="#E8A838" strokeWidth={2.5} />,
  );
  div.style.filter = 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))';
  return div;
}

export default function MapView() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const trafficLayerRef = useRef<google.maps.TrafficLayer | null>(null);
  const trafficVisibleRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);

  const martaUrl = IS_STATIC ? `${API_BASE}/api/marta` : '/api/marta';
  const { data } = useSWR<MartaApiResponse>(martaUrl, fetcher, {
    refreshInterval: 2000,
    dedupingInterval: 1000,
  });

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!apiKey || mapInstanceRef.current) return;

    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['maps', 'marker'],
    });

    loader.load().then(() => {
      if (!mapRef.current) return;

      const map = new google.maps.Map(mapRef.current, {
        center: { lat: STADIUM_LAT, lng: STADIUM_LNG },
        zoom: 13,
        mapId: 'matchday-atl',
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
      mapInstanceRef.current = map;
      setMapReady(true);

      const stadiumDiv = document.createElement('div');
      stadiumDiv.textContent = '⚽';
      stadiumDiv.style.fontSize = '28px';
      new google.maps.marker.AdvancedMarkerElement({
        position: { lat: STADIUM_LAT, lng: STADIUM_LNG },
        map,
        title: STADIUM_NAME,
        content: stadiumDiv,
        zIndex: 999,
      });

      trafficLayerRef.current = new google.maps.TrafficLayer();

      const trafficBtn = document.createElement('button');
      trafficBtn.textContent = 'Traffic';
      trafficBtn.className =
        'mx-2 mt-2 px-3 py-1 rounded bg-white text-gray-800 text-sm shadow font-medium';
      trafficBtn.addEventListener('click', () => {
        trafficVisibleRef.current = !trafficVisibleRef.current;
        trafficLayerRef.current?.setMap(
          trafficVisibleRef.current ? map : null,
        );
        trafficBtn.textContent = trafficVisibleRef.current
          ? 'Hide Traffic'
          : 'Traffic';
      });
      map.controls[google.maps.ControlPosition.TOP_LEFT]?.push(trafficBtn);

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const dot = document.createElement('div');
            dot.style.cssText =
              'width:14px;height:14px;border-radius:50%;background:#4285F4;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.4)';
            new google.maps.marker.AdvancedMarkerElement({
              position: { lat: pos.coords.latitude, lng: pos.coords.longitude },
              map,
              title: 'Your location',
              content: dot,
            });
          },
          () => {},
        );
      }
    }).catch((err: unknown) => {
      console.error('[MapView] Google Maps load failed:', err);
    });
  }, []);

  const updateMarkers = useCallback((vehicles: Vehicle[]) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const seen = new Set<string>();

    for (const v of vehicles) {
      seen.add(v.id);
      const existing = markersRef.current.get(v.id);

      if (existing) {
        animateMarker(existing, { lat: v.lat, lng: v.lng });
      } else {
        const marker = new google.maps.marker.AdvancedMarkerElement({
          position: { lat: v.lat, lng: v.lng },
          map,
          title: v.route,
          content: makeVehicleIcon(v.type),
          zIndex: 10,
        });
        markersRef.current.set(v.id, marker);
      }
    }

    for (const [id, marker] of markersRef.current) {
      if (!seen.has(id)) {
        marker.map = null;
        markersRef.current.delete(id);
      }
    }
  }, []);

  useEffect(() => {
    if (data?.vehicles) updateMarkers(data.vehicles);
  }, [data, updateMarkers, mapReady]);

  if (!apiKey) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-900 text-gray-400">
        <span className="text-4xl">🗺️</span>
        <p className="text-sm font-medium">Google Maps API key not set</p>
        <p className="max-w-xs text-center text-xs">
          Add <code className="rounded bg-gray-800 px-1 py-0.5 text-gray-300">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to{' '}
          <code className="rounded bg-gray-800 px-1 py-0.5 text-gray-300">.env.local</code> and restart the server.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className="absolute inset-0"
      aria-label="Live MARTA transit map"
    />
  );
}
