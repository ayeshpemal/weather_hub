import { describe, it, expect } from "vitest";
import { computeComfortScore, rankCities } from "./comfortScore.js";
import type { NormalizedWeather } from "./weatherService.js";

/** Build a NormalizedWeather object with sensible defaults; override any field. */
function makeWeather(overrides: Partial<NormalizedWeather> = {}): NormalizedWeather {
  return {
    cityId: "0",
    cityName: "TestCity",
    tempC: 21, // ideal 18-24 C
    humidity: 50, // ideal 40-60 %
    windSpeed: 3, // ideal 1-5 m/s
    cloudiness: 30, // ideal 10-50 %
    pressure: 1013,
    visibility: 9000, // ideal 8000-10000 m
    description: "clear sky",
    icon: "01d",
    ...overrides,
  };
}

// Weights mirror comfortScore.ts
const W_TEMP = 35;
const W_HUMIDITY = 30;
const W_WIND = 20;
const W_CLOUD = 15;
const W_VISIBILITY = 10;
const TOTAL_WEIGHT = W_TEMP + W_HUMIDITY + W_WIND + W_CLOUD + W_VISIBILITY; // 110

// ---------------------------------------------------------------------------
// computeComfortScore
// ---------------------------------------------------------------------------

describe("computeComfortScore", () => {
  it("returns 100 when all parameters are in the ideal band", () => {
    expect(computeComfortScore(makeWeather())).toBe(100);
  });

  it("returns 0 when all parameters are outside absolute bounds", () => {
    const weather = makeWeather({
      tempC: 50, // > absoluteMax 42
      humidity: 100, // >= absoluteMax
      windSpeed: 25, // > absoluteMax 20
      cloudiness: 100, // >= absoluteMax
      visibility: 0, // <= absoluteMin
    });
    expect(computeComfortScore(weather)).toBe(0);
  });

  it("score is always within [0, 100]", () => {
    const cases: Array<Partial<NormalizedWeather>> = [
      { tempC: -100, humidity: 0, windSpeed: 0, cloudiness: 0, visibility: 0 },
      { tempC: 100, humidity: 200, windSpeed: 100, cloudiness: 200, visibility: 20000 },
      { tempC: 18, humidity: 40, windSpeed: 1, cloudiness: 10, visibility: 8000 },
    ];
    for (const c of cases) {
      const score = computeComfortScore(makeWeather(c));
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });

  // --- per-parameter partial score tests ---

  it("returns correct partial score when only temperature is ideal", () => {
    const weather = makeWeather({
      tempC: 21,
      humidity: 100,
      windSpeed: 25,
      cloudiness: 100,
      visibility: 0,
    });
    const expected = Math.round((W_TEMP / TOTAL_WEIGHT) * 10000) / 100;
    expect(computeComfortScore(weather)).toBeCloseTo(expected, 2);
  });

  it("returns correct partial score when only humidity is ideal", () => {
    const weather = makeWeather({
      tempC: 50,
      humidity: 50,
      windSpeed: 25,
      cloudiness: 100,
      visibility: 0,
    });
    const expected = Math.round((W_HUMIDITY / TOTAL_WEIGHT) * 10000) / 100;
    expect(computeComfortScore(weather)).toBeCloseTo(expected, 2);
  });

  it("returns correct partial score when only wind speed is ideal", () => {
    const weather = makeWeather({
      tempC: 50,
      humidity: 100,
      windSpeed: 3,
      cloudiness: 100,
      visibility: 0,
    });
    const expected = Math.round((W_WIND / TOTAL_WEIGHT) * 10000) / 100;
    expect(computeComfortScore(weather)).toBeCloseTo(expected, 2);
  });

  it("returns correct partial score when only cloudiness is ideal", () => {
    const weather = makeWeather({
      tempC: 50,
      humidity: 100,
      windSpeed: 25,
      cloudiness: 30,
      visibility: 0,
    });
    const expected = Math.round((W_CLOUD / TOTAL_WEIGHT) * 10000) / 100;
    expect(computeComfortScore(weather)).toBeCloseTo(expected, 2);
  });

  it("returns correct partial score when only visibility is ideal", () => {
    const weather = makeWeather({
      tempC: 50,
      humidity: 100,
      windSpeed: 25,
      cloudiness: 100,
      visibility: 9000,
    });
    const expected = Math.round((W_VISIBILITY / TOTAL_WEIGHT) * 10000) / 100;
    expect(computeComfortScore(weather)).toBeCloseTo(expected, 2);
  });

  // --- ramp midpoint tests ---

  it("temperature: sub-score ~0.5 at lower ramp midpoint (4 C)", () => {
    // (4 - (-10)) / (18 - (-10)) = 14/28 = 0.5
    const weather = makeWeather({
      tempC: 4,
      humidity: 100,
      windSpeed: 25,
      cloudiness: 100,
      visibility: 0,
    });
    const expected = Math.round((W_TEMP / TOTAL_WEIGHT) * 0.5 * 10000) / 100;
    expect(computeComfortScore(weather)).toBeCloseTo(expected, 2);
  });

  it("humidity: sub-score ~0.5 at lower ramp midpoint (20 %)", () => {
    // (20 - 0) / (40 - 0) = 0.5
    const weather = makeWeather({
      tempC: 50,
      humidity: 20,
      windSpeed: 25,
      cloudiness: 100,
      visibility: 0,
    });
    const expected = Math.round((W_HUMIDITY / TOTAL_WEIGHT) * 0.5 * 10000) / 100;
    expect(computeComfortScore(weather)).toBeCloseTo(expected, 2);
  });

  it("wind: sub-score ~0.5 at upper ramp midpoint (12.5 m/s)", () => {
    // (20 - 12.5) / (20 - 5) = 7.5/15 = 0.5
    const weather = makeWeather({
      tempC: 50,
      humidity: 100,
      windSpeed: 12.5,
      cloudiness: 100,
      visibility: 0,
    });
    const expected = Math.round((W_WIND / TOTAL_WEIGHT) * 0.5 * 10000) / 100;
    expect(computeComfortScore(weather)).toBeCloseTo(expected, 2);
  });

  it("cloudiness sub-score ~0.5 at upper ramp midpont (75)", () => {
    // (100 - 75) / (100 - 50) = 25/50 = 0.5
    const weather = makeWeather({
      tempC: 50,
      humidity: 100,
      windSpeed: 25,
      cloudiness: 75,
      visibility: 0,
    });
    const expected = Math.round((W_CLOUD / TOTAL_WEIGHT) * 0.5 * 10000) / 100;
    expect(computeComfortScore(weather)).toBeCloseTo(expected, 2);
  });

  it("visibility: sub-score ~0.5 at lower ramp midpoint (4000 m)", () => {
    // (4000 - 0) / (8000 - 0) = 0.5
    const weather = makeWeather({
      tempC: 50,
      humidity: 100,
      windSpeed: 25,
      cloudiness: 100,
      visibility: 4000,
    });
    const expected = Math.round((W_VISIBILITY / TOTAL_WEIGHT) * 0.5 * 10000) / 100;
    expect(computeComfortScore(weather)).toBeCloseTo(expected, 2);
  });

  // --- boundary values ---

  it("temperature at absoluteMin (-10 C) scores 0", () => {
    expect(
      computeComfortScore(
        makeWeather({ tempC: -10, humidity: 100, windSpeed: 25, cloudiness: 100, visibility: 0 }),
      ),
    ).toBe(0);
  });

  it("temperature at absoluteMax (42 C) scores 0", () => {
    expect(
      computeComfortScore(
        makeWeather({ tempC: 42, humidity: 100, windSpeed: 25, cloudiness: 100, visibility: 0 }),
      ),
    ).toBe(0);
  });

  it("temperature at idealMin (18 C) sub-score is 1", () => {
    const weather = makeWeather({
      tempC: 18,
      humidity: 100,
      windSpeed: 25,
      cloudiness: 100,
      visibility: 0,
    });
    const expected = Math.round((W_TEMP / TOTAL_WEIGHT) * 10000) / 100;
    expect(computeComfortScore(weather)).toBeCloseTo(expected, 2);
  });

  it("temperature at idealMax (24 C) sub-score is 1", () => {
    const weather = makeWeather({
      tempC: 24,
      humidity: 100,
      windSpeed: 25,
      cloudiness: 100,
      visibility: 0,
    });
    const expected = Math.round((W_TEMP / TOTAL_WEIGHT) * 10000) / 100;
    expect(computeComfortScore(weather)).toBeCloseTo(expected, 2);
  });

  it("wind at absoluteMin (0 m/s) scores 0", () => {
    expect(
      computeComfortScore(
        makeWeather({ tempC: 50, humidity: 100, windSpeed: 0, cloudiness: 100, visibility: 0 }),
      ),
    ).toBe(0);
  });

  it("wind at absoluteMax (20 m/s) scores 0", () => {
    expect(
      computeComfortScore(
        makeWeather({ tempC: 50, humidity: 100, windSpeed: 20, cloudiness: 100, visibility: 0 }),
      ),
    ).toBe(0);
  });

  it("output has at most 2 decimal places", () => {
    const score = computeComfortScore(makeWeather({ tempC: 4 }));
    const decimals = (score.toString().split(".")[1] ?? "").length;
    expect(decimals).toBeLessThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// rankCities
// ---------------------------------------------------------------------------

describe("rankCities", () => {
  it("assigns rank 1 to the city with the highest comfort score", () => {
    const cities = [
      makeWeather({ cityId: "A", tempC: 50 }),
      makeWeather({ cityId: "B" }), // perfect score
      makeWeather({ cityId: "C", tempC: 10, humidity: 80 }),
    ];
    const ranked = rankCities(cities);
    expect(ranked[0].rank).toBe(1);
    expect(ranked[0].cityId).toBe("B");
  });

  it("sorts cities in descending comfort score order", () => {
    const cities = [
      makeWeather({ cityId: "low", tempC: 50 }),
      makeWeather({ cityId: "mid", tempC: 10 }),
      makeWeather({ cityId: "high" }),
    ];
    const ranked = rankCities(cities);
    for (let i = 0; i < ranked.length - 1; i++) {
      expect(ranked[i].comfortScore).toBeGreaterThanOrEqual(ranked[i + 1].comfortScore);
    }
  });

  it("assigns sequential ranks starting from 1", () => {
    const cities = [
      makeWeather({ cityId: "A", tempC: 50 }),
      makeWeather({ cityId: "B" }),
      makeWeather({ cityId: "C", tempC: 10 }),
    ];
    const ranked = rankCities(cities);
    const ranks = ranked.map((c) => c.rank).sort((a, b) => a - b);
    expect(ranks).toEqual([1, 2, 3]);
  });

  it("attaches a valid comfortScore to every city", () => {
    const cities = [makeWeather({ cityId: "X" }), makeWeather({ cityId: "Y", tempC: 50 })];
    for (const city of rankCities(cities)) {
      expect(typeof city.comfortScore).toBe("number");
      expect(city.comfortScore).toBeGreaterThanOrEqual(0);
      expect(city.comfortScore).toBeLessThanOrEqual(100);
    }
  });

  it("handles a single city — rank is 1, score is 100", () => {
    const ranked = rankCities([makeWeather()]);
    expect(ranked).toHaveLength(1);
    expect(ranked[0].rank).toBe(1);
    expect(ranked[0].comfortScore).toBe(100);
  });

  it("handles an empty array without throwing", () => {
    expect(() => rankCities([])).not.toThrow();
    expect(rankCities([])).toHaveLength(0);
  });

  it("preserves all original weather fields on scored results", () => {
    const original = makeWeather({ cityId: "TEST", cityName: "TestCity", tempC: 22 });
    const result = rankCities([original])[0];
    expect(result.cityId).toBe("TEST");
    expect(result.cityName).toBe("TestCity");
    expect(result.tempC).toBe(22);
    expect(result.description).toBe("clear sky");
  });
});
