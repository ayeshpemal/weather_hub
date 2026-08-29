import { useCallback, useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import type { WeatherCity } from "../types/weather";

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3000";

export interface WeatherState {
  data: WeatherCity[] | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useWeatherData(): WeatherState {
  const { getAccessTokenSilently } = useAuth0();
  const [data, setData] = useState<WeatherCity[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  // Increment tick to trigger a re-fetch
  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    async function loadWeatherData() {
      try {
        const token = await getAccessTokenSilently();

        const res = await fetch(`${API_URL}/api/weather`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error(`Server responded with ${res.status} ${res.statusText}`);
        }

        const json = (await res.json()) as {
          data: WeatherCity[];
        };

        if (!cancelled) {
          setData(json.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load weather data");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadWeatherData();
    return () => {
      cancelled = true;
    };
  }, [getAccessTokenSilently, tick]);

  return { data, loading, error, refetch };
}
