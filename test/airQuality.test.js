import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mapAqiLevel, pickDominantPollutant } from '../src/airQuality.js';

test('mapAqiLevel boundaries', () => {
  assert.equal(mapAqiLevel(0), 'Good');
  assert.equal(mapAqiLevel(50), 'Good');
  assert.equal(mapAqiLevel(51), 'Moderate');
  assert.equal(mapAqiLevel(100), 'Moderate');
  assert.equal(mapAqiLevel(101), 'Unhealthy for Sensitive Groups');
  assert.equal(mapAqiLevel(150), 'Unhealthy for Sensitive Groups');
  assert.equal(mapAqiLevel(151), 'Unhealthy');
  assert.equal(mapAqiLevel(200), 'Unhealthy');
  assert.equal(mapAqiLevel(201), 'Very Unhealthy');
});

test('pickDominantPollutant picks highest ratio vs threshold (Denver case: ozone)', () => {
  const current = {
    pm2_5: 10.9,
    pm10: 13.6,
    carbon_monoxide: 140.0,
    nitrogen_dioxide: 3.8,
    ozone: 110.0,
    sulphur_dioxide: 0.9,
  };
  assert.equal(pickDominantPollutant(current), 'ozone');
});

test('pickDominantPollutant defaults to pm2_5 when all near zero', () => {
  const current = {
    pm2_5: 0,
    pm10: 0,
    carbon_monoxide: 0,
    nitrogen_dioxide: 0,
    ozone: 0,
    sulphur_dioxide: 0,
  };
  assert.equal(pickDominantPollutant(current), 'pm2_5');
});

test('pickDominantPollutant picks pm10 when it has highest ratio', () => {
  const current = {
    pm2_5: 1,
    pm10: 140,
    carbon_monoxide: 1,
    nitrogen_dioxide: 1,
    ozone: 1,
    sulphur_dioxide: 1,
  };
  assert.equal(pickDominantPollutant(current), 'pm10');
});
