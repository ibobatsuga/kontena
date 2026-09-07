import { existsSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
if (!existsSync('.env')) {
  const secrets = {
    SESSION_SECRET: randomBytes(32).toString('base64url'),
    SOCIAL_ENCRYPTION_KEY: randomBytes(32).toString('base64'),
    CRON_SECRET: randomBytes(32).toString('base64url'),
  };
  writeFileSync(
    '.env',
    Object.entries(secrets)
      .map(([k, v]) => `${k}=${v}`)
      .join('\n') + '\n',
    { mode: 0o600 },
  );
  console.log('Konfigurasi lokal dibuat. Dashboard dapat dibuka tanpa login.');
}
const result = spawnSync(
  process.execPath,
  [
    'node_modules/wrangler/bin/wrangler.js',
    'd1',
    'migrations',
    'apply',
    'DB',
    '--local',
    '--config',
    'wrangler.jsonc',
  ],
  {
    stdio: 'inherit',
    env: { ...process.env, CI: 'true', WRANGLER_WRITE_LOGS: 'false' },
  },
);
if (result.status !== 0) process.exit(result.status || 1);
console.log('Jalankan npm run dev dan buka http://localhost:3000.');
