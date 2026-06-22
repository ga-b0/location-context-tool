import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getLocation, getLocationFromIP } from '../src/location.js';

test('getLocation parses zippopotam response correctly', async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      country: 'United States',
      'country abbreviation': 'US',
      'post code': '80203',
      places: [
        {
          'place name': 'Denver',
          longitude: '-104.9811',
          latitude: '39.7313',
          state: 'Colorado',
          'state abbreviation': 'CO',
        },
      ],
    }),
  });
  t.after(() => { globalThis.fetch = originalFetch; });

  const result = await getLocation('80203');
  assert.deepEqual(result, {
    city: 'Denver',
    state: 'Colorado',
    country: 'US',
    lat: 39.7313,
    lon: -104.9811,
    source: 'zip',
  });
});

test('getLocation throws when ZIP is invalid (404, empty body)', async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: false,
    status: 404,
    json: async () => { throw new SyntaxError('Unexpected end of JSON input'); },
  });
  t.after(() => { globalThis.fetch = originalFetch; });

  await assert.rejects(() => getLocation('00000'));
});

test('getLocationFromIP parses successful ip-api response', async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      status: 'success',
      country: 'United States',
      countryCode: 'US',
      regionName: 'Virginia',
      city: 'Ashburn',
      lat: 39.0438,
      lon: -77.4874,
    }),
  });
  t.after(() => { globalThis.fetch = originalFetch; });

  const result = await getLocationFromIP();
  assert.deepEqual(result, {
    city: 'Ashburn',
    state: 'Virginia',
    country: 'US',
    lat: 39.0438,
    lon: -77.4874,
    source: 'ip_fallback',
  });
});

test('getLocationFromIP throws when body status is fail', async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ status: 'fail', message: 'invalid query' }),
  });
  t.after(() => { globalThis.fetch = originalFetch; });

  await assert.rejects(() => getLocationFromIP());
});
