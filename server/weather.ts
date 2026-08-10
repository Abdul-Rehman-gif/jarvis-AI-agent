/**
 * Weather lookups via Open-Meteo (https://open-meteo.com) - free, no API
 * key required. Two calls: geocode the city name to lat/lon, then fetch
 * the current-conditions forecast for that point.
 */

const WEATHER_CODES: Record<number, string> = {
  0: "clear sky", 1: "mostly clear", 2: "partly cloudy", 3: "overcast",
  45: "fog", 48: "depositing rime fog",
  51: "light drizzle", 53: "moderate drizzle", 55: "dense drizzle",
  61: "light rain", 63: "moderate rain", 65: "heavy rain",
  66: "light freezing rain", 67: "heavy freezing rain",
  71: "light snow", 73: "moderate snow", 75: "heavy snow", 77: "snow grains",
  80: "light rain showers", 81: "moderate rain showers", 82: "violent rain showers",
  85: "light snow showers", 86: "heavy snow showers",
  95: "thunderstorm", 96: "thunderstorm with light hail", 99: "thunderstorm with heavy hail",
};

export async function getWeatherSummary(cityQuery: string): Promise<string> {
  const city = (cityQuery || process.env.WEATHER_DEFAULT_CITY || "Lahore, Pakistan").trim();

  try {
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
    );
    const geoData: any = await geoRes.json();
    const place = geoData?.results?.[0];
    if (!place) {
      return `I couldn't find a location called "${city}" - try a more specific city name.`;
    }

    const { latitude, longitude, name, country, admin1 } = place;
    const wxRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&temperature_unit=celsius&wind_speed_unit=kmh`
    );
    const wxData: any = await wxRes.json();
    const cur = wxData?.current;
    if (!cur) {
      return `I found ${name}, but couldn't fetch current weather for it right now.`;
    }

    const condition = WEATHER_CODES[cur.weather_code] ?? "unknown conditions";
    const locationLabel = [name, admin1, country].filter(Boolean).join(", ");

    return `It's currently ${Math.round(cur.temperature_2m)}°C with ${condition} in ${locationLabel}. Humidity is ${cur.relative_humidity_2m}% and wind is ${Math.round(cur.wind_speed_10m)} km/h.`;
  } catch (err: any) {
    return `I ran into an error checking the weather: ${err?.message || "unknown error"}.`;
  }
}
