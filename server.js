import { createServer } from 'node:http';
import { getLocationContext } from './src/locationContext.js';

const PORT = process.env.PORT || 3000;
const ZIP_PATTERN = /^\d{5}$/;

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body, null, 2));
}

async function resultForZip(zip) {
  if (!ZIP_PATTERN.test(zip)) {
    return {
      input: { zip, source: null },
      error: { message: `"${zip}" is not a valid 5-digit US ZIP code`, code: 'INVALID_ZIP' },
    };
  }

  try {
    return await getLocationContext(zip);
  } catch (err) {
    return {
      input: { zip, source: null },
      error: { message: err.message ?? 'Unknown error', code: 'UNEXPECTED_ERROR' },
    };
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method !== 'GET' || url.pathname !== '/context') {
    sendJson(res, 404, { error: { message: 'Not found', code: 'NOT_FOUND' } });
    return;
  }

  const zipParam = url.searchParams.get('zip');
  if (!zipParam) {
    sendJson(res, 400, { error: { message: 'Query param "zip" is required', code: 'INVALID_ZIP' } });
    return;
  }

  const requestedZips = zipParam
    .split(',')
    .map((zip) => zip.trim())
    .filter((zip) => zip.length > 0);

  if (requestedZips.length === 0) {
    sendJson(res, 400, { error: { message: 'Query param "zip" is required', code: 'INVALID_ZIP' } });
    return;
  }

  const results = await Promise.all(requestedZips.map(resultForZip));
  const responseBody = requestedZips.length === 1 ? results[0] : results;

  sendJson(res, 200, responseBody);
});

server.listen(PORT, () => {
  console.log(`Location Context Tool server listening on port ${PORT}`);
});
