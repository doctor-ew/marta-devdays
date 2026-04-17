import { NextResponse } from "next/server";
import { TransitVehicle } from "@/lib/types";
import GtfsRealtimeBindings from "gtfs-realtime-bindings";

const MOCK_VEHICLES: TransitVehicle[] = [
  { id: "BUS001", type: "bus", latitude: 33.755, longitude: -84.405, route: "1" },
  { id: "BUS002", type: "bus", latitude: 33.752, longitude: -84.400, route: "2" },
  { id: "BUS003", type: "bus", latitude: 33.758, longitude: -84.410, route: "3" },
  { id: "TRAIN001", type: "train", latitude: 33.7537, longitude: -84.4000, route: "GOLD" },
  { id: "TRAIN002", type: "train", latitude: 33.7490, longitude: -84.3880, route: "BLUE" },
];

export async function GET() {
  if (process.env.USE_MOCK_MARTA_DATA === "true") {
    return NextResponse.json({ vehicles: MOCK_VEHICLES });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const [busResponse, trainResponse] = await Promise.all([
      fetch(
        "https://gtfs-rt.itsmarta.com/TMGTFSRealTimeWebService/vehicle/vehiclepositions.pb",
        { signal: controller.signal }
      ),
      fetch(
        `https://developerservices.itsmarta.com:18096/itsmarta/railrealtimearrivals/developerservices/traindata?apiKey=${process.env.MARTA_TRAIN_API_KEY}`,
        { signal: controller.signal }
      ),
    ]);

    clearTimeout(timeoutId);

    // Process buses via GTFS-RT protobuf
    let buses: TransitVehicle[] = [];
    if (busResponse.ok) {
      const buffer = await busResponse.arrayBuffer();
      const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
        new Uint8Array(buffer)
      );
      buses = feed.entity
        .filter((e) => e.vehicle?.position)
        .map((e) => ({
          id: e.vehicle!.vehicle?.id || e.id,
          type: "bus" as const,
          latitude: e.vehicle!.position!.latitude || 0,
          longitude: e.vehicle!.position!.longitude || 0,
          route: e.vehicle!.trip?.routeId || "Unknown",
        }))
        .filter((v) => v.latitude !== 0 && v.longitude !== 0);
    }

    // Process trains via REST API
    let trains: TransitVehicle[] = [];
    if (trainResponse.ok) {
      const trainData = await trainResponse.json();
      const trainMap = new Map<string, TransitVehicle>();
      trainData.forEach((t: Record<string, string>) => {
        if (t.TRAIN_ID && t.LATITUDE && t.LONGITUDE) {
          trainMap.set(t.TRAIN_ID, {
            id: t.TRAIN_ID,
            type: "train",
            latitude: parseFloat(t.LATITUDE),
            longitude: parseFloat(t.LONGITUDE),
            route: t.LINE || "Unknown",
          });
        }
      });
      trains = Array.from(trainMap.values()).filter(
        (v) => v.latitude !== 0 && v.longitude !== 0
      );
    }

    const vehicles = [...buses, ...trains];
    if (vehicles.length === 0) {
      return NextResponse.json({ vehicles: MOCK_VEHICLES });
    }
    return NextResponse.json({ vehicles });
  } catch {
    clearTimeout(timeoutId);
    return NextResponse.json({ vehicles: MOCK_VEHICLES });
  }
}
