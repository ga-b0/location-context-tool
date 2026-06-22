import { THRESHOLDS } from './constants/pollutantThresholds.js';

export function mapAqiLevel(usAqi) {
  if (usAqi <= 50) return 'Good';
  if (usAqi <= 100) return 'Moderate';
  if (usAqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (usAqi <= 200) return 'Unhealthy';
  return 'Very Unhealthy';
}

export function pickDominantPollutant(current) {
  let best = 'pm2_5';
  let bestRatio = 0;
  for (const pollutant of Object.keys(THRESHOLDS)) {
    const value = current[pollutant] ?? 0;
    const ratio = value / THRESHOLDS[pollutant];
    if (ratio > bestRatio) {
      bestRatio = ratio;
      best = pollutant;
    }
  }
  return best;
}

export async function getAirQuality(lat, lon) {
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,ozone,sulphur_dioxide`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Air quality API failed with status ${response.status}`);
  }
  const data = await response.json();
  const current = data.current;
  return {
    aqiUs: current.us_aqi,
    level: mapAqiLevel(current.us_aqi),
    dominantPollutant: pickDominantPollutant(current),
  };
}
