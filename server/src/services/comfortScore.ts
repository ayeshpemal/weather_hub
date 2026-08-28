import type { NormalizedWeather } from "./weatherService.js";

interface ComfortParameter {
  name: string;
  description: string;
  weight: number;
  normalize: (weather: NormalizedWeather) => number;
}

export interface ScoredWeather extends NormalizedWeather {
  comfortScore: number;
  rank: number;
}

/* 
Trapezoidal comfort normalization.

Returns 1.0 inside the ideal band, 0 outside the absolute bounds,
and a linear ramp between each edge pair. 
*/
function trapezoid(
  value: number,
  absoluteMin: number,
  idealMin: number,
  idealMax: number,
  absoluteMax: number,
): number {
  if (value <= absoluteMin || value >= absoluteMax) return 0;
  if (value >= idealMin && value <= idealMax) return 1;
  if (value < idealMin) return (value - absoluteMin) / (idealMin - absoluteMin);
  return (absoluteMax - value) / (absoluteMax - idealMax);
}

const PARAMETERS: ComfortParameter[] = [
  {
    name: "Temperature",
    description: "Ideal 18–24 °C. Below −10 °C or above 42 °C = 0.",
    weight: 35,
    normalize: (w) => trapezoid(w.tempC, -10, 18, 24, 42),
  },
  {
    name: "Humidity",
    description: "Ideal 40–60 %. Very dry or very humid = 0.",
    weight: 30,
    normalize: (w) => trapezoid(w.humidity, 0, 40, 60, 100),
  },
  {
    name: "Wind Speed",
    description: "Ideal 1–5 m/s (gentle breeze). Gale ≥ 20 m/s = 0.",
    weight: 20,
    normalize: (w) => trapezoid(w.windSpeed, 0, 1, 5, 20),
  },
  {
    name: "Cloudiness",
    description: "Ideal 10–50 % (partly cloudy). Fully clear or fully overcast = lower.",
    weight: 15,
    normalize: (w) => trapezoid(w.cloudiness, 0, 10, 50, 100),
  },
];

/*
Formula:
  score = Σ( (weight_i / totalWeight) × subScore_i ) × 100
*/
export function computeComfortScore(weather: NormalizedWeather): number {
  const totalWeight = PARAMETERS.reduce((sum, p) => sum + p.weight, 0);

  const rawScore = PARAMETERS.reduce((sum, p) => {
    return sum + (p.weight / totalWeight) * p.normalize(weather);
  }, 0);

  // calculate score between 0 and 100 by rounding to two decimals
  return Math.round(rawScore * 10000) / 100;
}

export function rankCities(weatherList: NormalizedWeather[]): ScoredWeather[] {
  return weatherList
    .map((w) => ({ ...w, comfortScore: computeComfortScore(w), rank: 0 }))
    .sort((a, b) => b.comfortScore - a.comfortScore)
    .map((city, index) => ({ ...city, rank: index + 1 }));
}
