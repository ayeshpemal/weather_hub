import axios from "axios";
import NodeCache from "node-cache";
import { cities } from "../data/cities.js";

// Raw response cache — one entry per city, 5-minute TTL
const rawCache = new NodeCache({ stdTTL: 300 });

export interface OpenWeatherResponse {
  id: number;
  name: string;
  main: {
    temp: number;
    humidity: number;
    pressure: number;
  };
  weather: { description: string; icon: string }[];
  wind: { speed: number };
  clouds: { all: number };
  visibility: number;
}

export interface NormalizedWeather {
  cityId: string;
  cityName: string;
  tempC: number; // C (Celcius)
  humidity: number; // %
  windSpeed: number; // m/s
  cloudiness: number; // %
  pressure: number; // hPa
  visibility: number; // meters
  description: string; // e.g. "broken clouds"
  icon: string; // e.g. "04d"
}

function buildApiUrl(cityId: string): string {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) throw new Error("OPENWEATHER_API_KEY is not set in environment");
  return (
    `https://api.openweathermap.org/data/2.5/weather` + `?id=${cityId}&appid=${key}&units=metric`
  );
}

function normalize(raw: OpenWeatherResponse, cityId: string, cityName: string): NormalizedWeather {
  return {
    cityId,
    cityName,
    tempC: raw.main.temp,
    humidity: raw.main.humidity,
    windSpeed: raw.wind.speed,
    cloudiness: raw.clouds.all,
    pressure: raw.main.pressure,
    visibility: raw.visibility,
    description: raw.weather[0].description,
    icon: raw.weather[0].icon,
  };
}

async function fetchCity(cityId: string, cityName: string): Promise<NormalizedWeather> {
  const cacheKey = `raw:${cityId}`;
  const cached = rawCache.get<OpenWeatherResponse>(cacheKey);

  if (cached) {
    return normalize(cached, cityId, cityName);
  }

  const { data } = await axios.get<OpenWeatherResponse>(buildApiUrl(cityId));
  rawCache.set(cacheKey, data);
  return normalize(data, cityId, cityName);
}

export async function getAllWeather(): Promise<NormalizedWeather[]> {
  const results = await Promise.allSettled(cities.map((c) => fetchCity(c.CityCode, c.CityName)));

  return results
    .filter((r): r is PromiseFulfilledResult<NormalizedWeather> => r.status === "fulfilled")
    .map((r) => r.value);
}

export function getRawCacheStatus() {
  return cities.map((c) => {
    const cacheKey = `raw:${c.CityCode}`;
    const hit = rawCache.has(cacheKey);
    const expiresAt = hit ? rawCache.getTtl(cacheKey) : undefined;
    const ttlSeconds =
      expiresAt !== undefined ? Math.round((expiresAt - Date.now()) / 1_000) : undefined;

    return {
      cityId: c.CityCode,
      cityName: c.CityName,
      hit,
      ttlSeconds,
    };
  });
}
