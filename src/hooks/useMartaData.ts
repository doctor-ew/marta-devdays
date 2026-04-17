import useSWR from "swr";
import type { TransitVehicle } from "@/lib/types";

class FetchError extends Error {
  status?: number;
}

const fetcher = async (url: string): Promise<{ vehicles: TransitVehicle[] }> => {
  const res = await fetch(url);
  if (!res.ok) {
    const err = new FetchError("MARTA fetch failed");
    err.status = res.status;
    throw err;
  }
  return res.json();
};

export function useMartaData() {
  const { data, error, isLoading } = useSWR<{ vehicles: TransitVehicle[] }, FetchError>(
    "/api/marta",
    fetcher,
    {
      refreshInterval: 10000,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      errorRetryCount: 3,
    }
  );

  return {
    vehicles: data?.vehicles,
    isLoading,
    isError: !!error,
  };
}
