const MARTA_API_URL =
  "https://developerservices.itsmarta.com:18096/itsmarta/railrealtimearrivals/developerservices/traindata";

export interface TrainArrival {
  STATION: string;
  LINE: string;
  DIRECTION: string;
  WAITING_SECONDS: number;
  TRAIN_ID: string;
}

async function loadFallback(): Promise<TrainArrival[]> {
  const data = await import("../../public/marta-fallback.json");
  return data.default as TrainArrival[];
}

export async function getTrainArrivals(): Promise<TrainArrival[]> {
  if (process.env.USE_MOCK_MARTA_DATA === "true") {
    return loadFallback();
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(
      `${MARTA_API_URL}?apiKey=${process.env.MARTA_TRAIN_API_KEY}`,
      { signal: controller.signal, next: { revalidate: 30 } }
    );
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`MARTA API ${res.status}`);
    return res.json();
  } catch {
    clearTimeout(timeout);
    return loadFallback();
  }
}
