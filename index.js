import { getLocationContext } from './src/locationContext.js';

async function main() {
  const zip = process.argv[2];
  const result = await getLocationContext(zip);

  console.log(JSON.stringify(result, null, 2));
  if (result.error) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.log(JSON.stringify({
    error: {
      message: err.message ?? 'Unknown error',
      code: 'UNEXPECTED_ERROR',
    },
  }, null, 2));
  process.exitCode = 1;
});
