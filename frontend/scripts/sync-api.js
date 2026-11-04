import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const openApiPath = path.resolve(__dirname, '../../backend/openapi.json');
const targetPath = path.resolve(__dirname, '../src/app/core/api/openapi.json');

if (fs.existsSync(openApiPath)) {
  fs.copyFileSync(openApiPath, targetPath);
  console.log(`[API Sync] Successfully synced OpenAPI spec from backend/openapi.json to frontend/src/app/core/api/openapi.json`);
} else {
  console.warn(`[API Sync] backend/openapi.json does not exist yet. Run 'npm run export:openapi' in backend first.`);
}
