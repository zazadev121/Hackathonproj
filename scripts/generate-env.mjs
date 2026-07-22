import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, '../src/environments/environment.ts');
const apiKey = (process.env.GROQ_API_KEY || '').trim();
const isVercel = process.env.VERCEL === '1';

if (isVercel && !apiKey) {
  console.error(
    'ERROR: GROQ_API_KEY is not set. Add it in Vercel → Project Settings → Environment Variables, then redeploy.'
  );
  process.exit(1);
}

const resolvedKey = apiKey || 'YOUR_GROQ_API_KEY';

mkdirSync(dirname(outPath), { recursive: true });

const contents = `export const environment = {
  production: ${process.env.NODE_ENV === 'production' || isVercel ? 'true' : 'false'},
  groqApiKey: '${resolvedKey.replace(/'/g, "\\'")}',
};
`;

writeFileSync(outPath, contents, 'utf8');
console.log(`Generated environment.ts${isVercel ? ' (Vercel)' : ''}`);
