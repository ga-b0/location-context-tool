import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildAgentContext } from '../src/agentContext.js';

test('builds expected natural-language sentence', () => {
  const result = buildAgentContext({
    location: { city: 'Denver', state: 'Colorado', country: 'US' },
    weather: { temperatureC: 14, windspeedKmh: 18, conditionText: 'Partly Cloudy' },
    airQuality: { aqiUs: 38, level: 'Good' },
    outdoorScore: 9,
  });
  assert.equal(
    result,
    'You are in Denver, Colorado, US. Current conditions: 14°C, Partly Cloudy, wind 18 km/h, air quality Good (AQI 38). Outdoor score: 9/10.'
  );
});
