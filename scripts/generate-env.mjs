import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, '../src/environments/environment.ts');
const apiKey = process.env.GROQ_API_KEY || 'YOUR_GROQ_API_KEY';

mkdirSync(dirname(outPath), { recursive: true });

const contents = `export const environment = {
  production: ${process.env.NODE_ENV === 'production' ? 'true' : 'false'},
  groqApiKey: '${apiKey.replace(/'/g, "\\'")}',
};
`;

writeFileSync(outPath, contents, 'utf8');
console.log('Generated src/environments/environment.ts');
