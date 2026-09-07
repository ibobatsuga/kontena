import { existsSync, readFileSync, appendFileSync, chmodSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
const env = existsSync('.env') ? readFileSync('.env', 'utf8') : '';
if (!/^SOCIAL_ENCRYPTION_KEY=.+$/m.test(env)) {
  appendFileSync(
    '.env',
    '\nSOCIAL_ENCRYPTION_KEY=' + randomBytes(32).toString('base64') + '\n',
  );
  chmodSync('.env', 0o600);
  console.log('Kunci enkripsi lokal dibuat di .env.');
}
const result = spawnSync(
  process.execPath,
  [
    'node_modules/wrangler/bin/wrangler.js',
    'd1',
    'migrations',
    'apply',
    'site-creator-d1',
    '--local',
    '--config',
    'wrangler.local.jsonc',
  ],
  {
    stdio: 'inherit',
    env: { ...process.env, CI: 'true', WRANGLER_WRITE_LOGS: 'false' },
  },
);
if (result.status !== 0) process.exit(result.status || 1);
console.log(
  'Database siap. Jalankan npm run dev, lalu buka http://localhost:3000/signin-with-chatgpt?return_to=/',
);
