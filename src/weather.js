import { DAY_NIGHT_TEXT, BUCKET_RANGES } from './constants/weatherCodes.js';

export function mapWeatherCode(code, isDay) {
  const pair = DAY_NIGHT_TEXT[code];
  if (!pair) return 'Unknown';
  return isDay === 1 ? pair[0] : pair[1];
}

export function mapWeatherCodeToBucket(code) {
  for (const { codes, bucket } of BUCKET_RANGES) {
    if (codes.includes(code)) return bucket;
  }
  return 'Unknown';
}

export async function getWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Weather API failed with status ${response.status}`);
  }
  const data = await response.json();
  const cw = data.current_weather;
  return {
    temperatureC: cw.temperature,
    windspeedKmh: cw.windspeed,
    conditionText: mapWeatherCode(cw.weathercode, cw.is_day),
    conditionBucket: mapWeatherCodeToBucket(cw.weathercode),
  };
}
