/** Matches the shape of ScoredWeather returned by GET /api/weather */
export interface WeatherCity {
  cityId: string;
  cityName: string;
  tempC: number;
  humidity: number;
  windSpeed: number;
  cloudiness: number;
  pressure: number;
  visibility: number;
  description: string;
  icon: string;
  comfortScore: number;
  rank: number;
}
