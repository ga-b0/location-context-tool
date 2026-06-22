export function buildAgentContext({ location, weather, airQuality, outdoorScore }) {
  return (
    `You are in ${location.city}, ${location.state}, ${location.country}. ` +
    `Current conditions: ${weather.temperatureC}°C, ${weather.conditionText}, wind ${weather.windspeedKmh} km/h, ` +
    `air quality ${airQuality.level} (AQI ${airQuality.aqiUs}). ` +
    `Outdoor score: ${outdoorScore}/10.`
  );
}
