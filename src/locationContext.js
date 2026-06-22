import { getLocation, getLocationFromIP } from './location.js';
import { getWeather } from './weather.js';
import { getAirQuality } from './airQuality.js';
import { computeOutdoorScore } from './scoring.js';
import { buildAgentContext } from './agentContext.js';

async function resolveLocation(zip) {
  try {
    return await getLocation(zip);
  } catch {
    return await getLocationFromIP();
  }
}

const locationContextCache = new Map();

async function fetchLocationContext(zip) {
  let location;
  try {
    location = await resolveLocation(zip);
  } catch {
    return {
      error: {
        message: 'Could not resolve location from ZIP or IP fallback',
        code: 'LOCATION_RESOLUTION_FAILED',
      },
    };
  }

  const [weatherResult, airQualityResult] = await Promise.all([
    getWeather(location.lat, location.lon),
    getAirQuality(location.lat, location.lon),
  ]);

  const outdoorScore = computeOutdoorScore({
    temperatureC: weatherResult.temperatureC,
    windspeedKmh: weatherResult.windspeedKmh,
    conditionBucket: weatherResult.conditionBucket,
    aqiUs: airQualityResult.aqiUs,
  });

  const weather = {
    temperature_c: weatherResult.temperatureC,
    windspeed_kmh: weatherResult.windspeedKmh,
    condition: weatherResult.conditionText,
  };

  const airQuality = {
    aqi_us: airQualityResult.aqiUs,
    level: airQualityResult.level,
    dominant_pollutant: airQualityResult.dominantPollutant,
  };

  const agentContext = buildAgentContext({
    location,
    weather: { ...weather, temperatureC: weather.temperature_c, windspeedKmh: weather.windspeed_kmh, conditionText: weather.condition },
    airQuality: { ...airQuality, aqiUs: airQuality.aqi_us },
    outdoorScore,
  });

  return {
    input: { zip: zip ?? null, source: location.source },
    location: {
      city: location.city,
      state: location.state,
      country: location.country,
      lat: location.lat,
      lon: location.lon,
    },
    weather,
    air_quality: airQuality,
    outdoor_score: outdoorScore,
    agent_context: agentContext,
  };
}

export async function getLocationContext(zip) {
  if (locationContextCache.has(zip)) {
    return locationContextCache.get(zip);
  }

  const result = await fetchLocationContext(zip);

  if (!result.error) {
    locationContextCache.set(zip, result);
  }

  return result;
}
