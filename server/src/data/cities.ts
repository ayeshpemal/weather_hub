import citiesRaw from "./cities.json" with { type: "json" };

export interface City {
  CityCode: string;
  CityName: string;
}

export const cities: City[] = citiesRaw.List.map(({ CityCode, CityName }) => ({
  CityCode,
  CityName,
}));

export const cityIds: string[] = cities.map((c) => c.CityCode);
