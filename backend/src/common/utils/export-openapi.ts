import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { openApiSpec } from './openapi-spec.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputPath = path.resolve(__dirname, '../../../openapi.json');
fs.writeFileSync(outputPath, JSON.stringify(openApiSpec, null, 2), 'utf-8');
console.log(`[OpenAPI] Successfully generated and exported OpenAPI specification to: ${outputPath}`);
