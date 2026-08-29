import { Router, type Request, type Response } from "express";
import NodeCache from "node-cache";
import { getAllWeather, getRawCacheStatus } from "../services/weatherService.js";
import { rankCities } from "../services/comfortScore.js";
import { checkJwt } from "../middleware/auth.js";

const router = Router();

// Processed cache — stores the full scored + ranked result set
const processedCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
const PROCESSED_KEY = "ranked_weather";

// Protected: Returns all cities ranked by Comfort Index Score (highest first).
router.get("/weather", checkJwt, async (_req: Request, res: Response) => {
  try {
    const cached = processedCache.get(PROCESSED_KEY);
    if (cached) {
      res.json({ source: "CACHE", data: cached });
      return;
    }

    const weatherData = await getAllWeather();

    const ranked = rankCities(weatherData);

    processedCache.set(PROCESSED_KEY, ranked);

    res.json({ source: "API", data: ranked });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    res.status(500).json({ error: message });
  }
});

// Public debug endpoint — shows HIT/MISS state and remaining TTL
router.get("/cache-status", (_req: Request, res: Response) => {
  try {
    const processedHit = processedCache.has(PROCESSED_KEY);
    const processedExpiry = processedCache.getTtl(PROCESSED_KEY);
    const processedTtl = processedExpiry
      ? Math.round((processedExpiry - Date.now()) / 1_000)
      : undefined;

    res.json({
      processedCache: {
        hit: processedHit,
        ttlSeconds: processedTtl,
      },
      rawCache: getRawCacheStatus(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    res.status(500).json({ error: message });
  }
});

export default router;
