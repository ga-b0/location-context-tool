export async function getLocation(zip) {
  const response = await fetch(`https://api.zippopotam.us/us/${zip}`);
  if (!response.ok) {
    throw new Error(`Zippopotam lookup failed with status ${response.status}`);
  }
  const data = await response.json();
  const place = data.places[0];
  return {
    city: place['place name'],
    state: place.state,
    country: data['country abbreviation'],
    lat: parseFloat(place.latitude),
    lon: parseFloat(place.longitude),
    source: 'zip',
  };
}

export async function getLocationFromIP() {
  const response = await fetch('http://ip-api.com/json/');
  if (!response.ok) {
    throw new Error(`IP lookup failed with status ${response.status}`);
  }
  const data = await response.json();
  if (data.status !== 'success') {
    throw new Error(`IP lookup failed: ${data.message ?? 'unknown error'}`);
  }
  return {
    city: data.city,
    state: data.regionName,
    country: data.countryCode,
    lat: data.lat,
    lon: data.lon,
    source: 'ip_fallback',
  };
}
