import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mapWeatherCode, mapWeatherCodeToBucket } from '../src/weather.js';

test('mapWeatherCode returns day text for code 0, isDay=1', () => {
  assert.equal(mapWeatherCode(0, 1), 'Sunny');
});

test('mapWeatherCode returns night text for code 0, isDay=0', () => {
  assert.equal(mapWeatherCode(0, 0), 'Clear');
});

test('mapWeatherCode returns Rain for code 63 regardless of day/night', () => {
  assert.equal(mapWeatherCode(63, 1), 'Rain');
  assert.equal(mapWeatherCode(63, 0), 'Rain');
});

test('mapWeatherCode returns Unknown for unrecognized code', () => {
  assert.equal(mapWeatherCode(999, 1), 'Unknown');
});

test('mapWeatherCodeToBucket groups clear codes', () => {
  assert.equal(mapWeatherCodeToBucket(0), 'Clear');
  assert.equal(mapWeatherCodeToBucket(1), 'Clear');
});

test('mapWeatherCodeToBucket groups rainy codes including showers', () => {
  assert.equal(mapWeatherCodeToBucket(63), 'Rainy');
  assert.equal(mapWeatherCodeToBucket(80), 'Rainy');
});

test('mapWeatherCodeToBucket returns Unknown for unrecognized code', () => {
  assert.equal(mapWeatherCodeToBucket(999), 'Unknown');
});
