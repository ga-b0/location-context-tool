# Location Context Tool

CLI que recibe un ZIP code de EE.UU. y devuelve un JSON enriquecido, ubicación, clima, calidad del aire, un outdoor score (1-10) y un `agent_context` en texto natural, pensado para que un agente de IA lo consuma directo.

## Requisitos

- Node.js v26.0.0 (usa `fetch` nativo).
- pnpm como package manager.
- Sin dependencias externas de runtime.

## Clonar

```bash
git clone https://github.com/ga-b0/location-context-tool.git
cd location-context-tool
```

## Instalar

```bash
pnpm install
```

No hay dependencias de runtime, esto solo prepara tooling de dev. `fetch`, `node:http` y `node:test` nativos cubren todo lo demás.

## Uso

```bash
node index.js 80203
```

Si el ZIP no se puede resolver (inválido o falla de red), cae a geolocalización por IP (`ip-api.com`) y `input.source` queda en `"ip_fallback"` en vez de `"zip"`.

Si ambas fuentes fallan, imprime un error estructurado y sale con código 1, nunca crashea con stack trace:

```json
{ "error": { "message": "Could not resolve location from ZIP or IP fallback", "code": "LOCATION_RESOLUTION_FAILED" } }
```

## Forma del output

```json
{
  "input": { "zip": "80203", "source": "zip" },
  "location": { "city": "Denver", "state": "Colorado", "country": "US", "lat": 39.7313, "lon": -104.9811 },
  "weather": { "temperature_c": 14.5, "windspeed_kmh": 18.2, "condition": "Partly Cloudy" },
  "air_quality": { "aqi_us": 38, "level": "Good", "dominant_pollutant": "ozone" },
  "outdoor_score": 9,
  "agent_context": "You are in Denver, Colorado, US. Current conditions: 14.5°C, Partly Cloudy, wind 18.2 km/h, air quality Good (AQI 38). Outdoor score: 9/10."
}
```

## Agrupación de weathercodes WMO

El `weathercode` de Open-Meteo se mapea en dos capas (`src/constants/weatherCodes.js`):

- **Texto de display** (campo `condition`): cada código WMO mapea a un string legible, consciente de día/noche (ej. código `0` → "Sunny" de día, "Clear" de noche).
- **Bucket de scoring** (interno, solo usado por `outdoor_score`): los códigos se agrupan en 7 buckets 
  - `Clear` (0, 1)
  - `Cloudy` (2, 3)
  - `Foggy` (45, 48)
  - `Drizzle` (51, 53, 55, 56, 57)
  - `Rainy` (61, 63, 65, 66, 67, 80, 81, 82)
  - `Snowy` (71, 73, 75, 77, 85, 86)
  - `Thunderstorm` (95, 96, 99)

Dos capas porque el agente necesita texto preciso ("Light Drizzle"), pero el score solo necesita saber el nivel de severidad (drizzle y lluvia fuerte son ambos "mojado", solo distinta penalización).

## Lógica del outdoor score

Empieza en 10, resta penalizaciones, clamp a [1, 10]:

- **Temperatura**: rango ideal 15-25°C. Fuera de eso, -1 por cada 5°C de desviación, tope -3.
- **Viento**: >20 km/h es -1; >40 km/h es -1 adicional.
- **Condición climática** (bucket del weathercode WMO): Clear/Cloudy es 0; Foggy/Drizzle es -2; Rainy es -4; Snowy es -5; Thunderstorm es -6; Unknown es -1.
- **Calidad del aire** (US AQI): <50 es 0; 50-100 es -1; 100-150 es -3; >150 es -5.

## Limitaciones conocidas

- El fallback por IP detecta la IP de la máquina **que corre el script**, no necesariamente la IP real del usuario final — preciso solo cuando corre en la máquina del usuario, no en sandbox de nube o detrás de un server que no forwardea la IP del cliente.
- `ip-api.com` en tier free es solo HTTP (sin HTTPS) y tiene rate limit (~45 requests/minuto).

## Testing

```bash
pnpm test
```

Corre tests unitarios (`node:test` nativo) de todas las funciones puras de mapeo/scoring, sin llamadas de red. El comportamiento end-to-end se verifica manual corriendo `node index.js <zip>` contra las APIs reales.

## Servidor HTTP

```bash
pnpm serve
# o: PORT=4000 node server.js
```

`GET /context?zip=80203` devuelve el mismo JSON que el CLI.

- **Multi-ZIP**: separados por coma, `GET /context?zip=80203,10001,90210` devuelve un array. Un solo ZIP sigue devolviendo un objeto plano (no envuelto en array).
- **Aislamiento por ZIP**: un ZIP mal formado dentro de un batch recibe su propio `error`, no rompe los demás.
- **Errores**: falta param `zip` o formato inválido → `400` con `INVALID_ZIP`; ruta desconocida → `404` con `NOT_FOUND`.

### Probar API en producción

Deploy en vivo: `https://location-context-tool.onrender.com`

```bash
# zip único
curl "https://location-context-tool.onrender.com/context?zip=80203"

# multi-zip
curl "https://location-context-tool.onrender.com/context?zip=80203,10001,90210"

# zip inválido
curl "https://location-context-tool.onrender.com/context?zip=abcde"
```

En Postman: método `GET`, URL `https://location-context-tool.onrender.com/context`, query param `zip` = `80203` (o `80203,10001` para multi-zip).

Nota: instancia free de Render se duerme tras inactividad, la primera petición después de un rato puede tardar ~30-50s en despertar (cold start), las siguientes son rápidas.

## Caché en memoria

`src/locationContext.js` mantiene un `Map` indexado por ZIP. Resultados exitosos se cachean durante la vida del proceso, llamadas repetidas (el CLI vive poco, pero el server queda corriendo) se saltan todas las llamadas a APIs externas. Resultados con error nunca se cachean, así una falla transitoria se puede reintentar.
