import type { Vehicle } from '@/types';

const BUS_FEED_URL =
  'https://gtfs-rt.itsmarta.com/TMGTFSRealTimeWebService/vehicle/vehiclepositions.pb';

const TRAIN_API_BASE =
  'https://developerservices.itsmarta.com:18096/itsmarta/railrealtimearrivals/traindata';

const LINE_NAME_MAP: Record<string, string> = {
  RED: 'Red Line',
  GOLD: 'Gold Line',
  BLUE: 'Blue Line',
  GREEN: 'Green Line',
};

export const MOCK_VEHICLES: Vehicle[] = [
  { id: 'mock-blue-1', type: 'train', route: 'Blue Line', lat: 33.7554, lng: -84.4011 },
  { id: 'mock-blue-2', type: 'train', route: 'Blue Line', lat: 33.7489, lng: -84.3889 },
  { id: 'mock-red-1', type: 'train', route: 'Red Line', lat: 33.7624, lng: -84.3877 },
  { id: 'mock-gold-1', type: 'train', route: 'Gold Line', lat: 33.7501, lng: -84.3916 },
  { id: 'mock-bus-1', type: 'bus', route: 'Route 110', lat: 33.7530, lng: -84.3940 },
  { id: 'mock-bus-2', type: 'bus', route: 'Route 12', lat: 33.7610, lng: -84.4050 },
];

const CACHE_TTL_MS = 2000;
let cached: { vehicles: Vehicle[]; at: number } | null = null;

async function fetchBusVehicles(): Promise<Vehicle[]> {
  const res = await fetch(BUS_FEED_URL, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`Bus feed HTTP ${res.status}`);

  const buffer = await res.arrayBuffer();
  const { transit_realtime } = await import('gtfs-realtime-bindings');
  const feed = transit_realtime.FeedMessage.decode(new Uint8Array(buffer));

  return feed.entity
    .filter((e) => e.vehicle?.position != null)
    .map((e) => ({
      id: `bus-${e.id}`,
      type: 'bus' as const,
      route: e.vehicle?.trip?.routeId ?? 'Bus',
      lat: e.vehicle!.position!.latitude,
      lng: e.vehicle!.position!.longitude,
    }));
}

interface MartaTrainRecord {
  TRAIN_ID: string;
  LINE: string;
  LATITUDE: string;
  LONGITUDE: string;
}

async function fetchTrainVehicles(): Promise<Vehicle[]> {
  const apiKey = process.env.MARTA_TRAIN_API_KEY;
  const url = apiKey
    ? `${TRAIN_API_BASE}?apiKey=${apiKey}`
    : TRAIN_API_BASE;

  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`Train API HTTP ${res.status}`);

  const data: MartaTrainRecord[] = await res.json() as MartaTrainRecord[];

  return data
    .filter((t) => t.LATITUDE && t.LONGITUDE)
    .map((t) => ({
      id: `train-${t.TRAIN_ID}`,
      type: 'train' as const,
      route: LINE_NAME_MAP[t.LINE] ?? t.LINE,
      lat: parseFloat(t.LATITUDE),
      lng: parseFloat(t.LONGITUDE),
    }));
}

export async function fetchMartaVehicles(): Promise<Vehicle[]> {
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.vehicles;
  }

  const results = await Promise.allSettled([
    fetchBusVehicles(),
    fetchTrainVehicles(),
  ]);

  const vehicles: Vehicle[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      vehicles.push(...result.value);
    }
  }

  const resolved = vehicles.length > 0 ? vehicles : MOCK_VEHICLES;
  cached = { vehicles: resolved, at: Date.now() };
  return resolved;
}
