import { CONDITION_PENALTY } from './constants/scoringPenalties.js';

function temperaturePenalty(temperatureC) {
  let deviation = 0;
  if (temperatureC < 15) deviation = 15 - temperatureC;
  else if (temperatureC > 25) deviation = temperatureC - 25;
  const steps = Math.floor(deviation / 5);
  return Math.min(steps, 3);
}

function windPenalty(windspeedKmh) {
  let penalty = 0;
  if (windspeedKmh > 20) penalty += 1;
  if (windspeedKmh > 40) penalty += 1;
  return penalty;
}

function aqiPenalty(aqiUs) {
  if (aqiUs < 50) return 0;
  if (aqiUs <= 100) return 1;
  if (aqiUs <= 150) return 3;
  return 5;
}

export function computeOutdoorScore({ temperatureC, windspeedKmh, conditionBucket, aqiUs }) {
  const penalties =
    temperaturePenalty(temperatureC) +
    windPenalty(windspeedKmh) +
    (CONDITION_PENALTY[conditionBucket] ?? CONDITION_PENALTY.Unknown) +
    aqiPenalty(aqiUs);
  const score = 10 - penalties;
  return Math.max(1, Math.min(10, score));
}
