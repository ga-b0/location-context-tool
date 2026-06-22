import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeOutdoorScore } from '../src/scoring.js';

test('perfect conditions score 10', () => {
  const score = computeOutdoorScore({
    temperatureC: 20,
    windspeedKmh: 5,
    conditionBucket: 'Clear',
    aqiUs: 20,
  });
  assert.equal(score, 10);
});

test('temperature penalty: -1 per 5C beyond ideal range, capped at -3', () => {
  const score = computeOutdoorScore({
    temperatureC: 35,
    windspeedKmh: 5,
    conditionBucket: 'Clear',
    aqiUs: 20,
  });
  assert.equal(score, 8);
});

test('extreme cold caps temperature penalty at -3', () => {
  const score = computeOutdoorScore({
    temperatureC: -30,
    windspeedKmh: 5,
    conditionBucket: 'Clear',
    aqiUs: 20,
  });
  assert.equal(score, 7);
});

test('wind penalty: >20 is -1, >40 is additional -1', () => {
  const score20 = computeOutdoorScore({ temperatureC: 20, windspeedKmh: 25, conditionBucket: 'Clear', aqiUs: 20 });
  assert.equal(score20, 9);
  const score40 = computeOutdoorScore({ temperatureC: 20, windspeedKmh: 45, conditionBucket: 'Clear', aqiUs: 20 });
  assert.equal(score40, 8);
});

test('condition bucket penalties', () => {
  assert.equal(computeOutdoorScore({ temperatureC: 20, windspeedKmh: 5, conditionBucket: 'Rainy', aqiUs: 20 }), 6);
  assert.equal(computeOutdoorScore({ temperatureC: 20, windspeedKmh: 5, conditionBucket: 'Thunderstorm', aqiUs: 20 }), 4);
});

test('aqi penalties', () => {
  assert.equal(computeOutdoorScore({ temperatureC: 20, windspeedKmh: 5, conditionBucket: 'Clear', aqiUs: 75 }), 9);
  assert.equal(computeOutdoorScore({ temperatureC: 20, windspeedKmh: 5, conditionBucket: 'Clear', aqiUs: 160 }), 5);
});

test('score clamps to minimum 1, never below', () => {
  const score = computeOutdoorScore({
    temperatureC: -40,
    windspeedKmh: 60,
    conditionBucket: 'Thunderstorm',
    aqiUs: 300,
  });
  assert.equal(score, 1);
});
