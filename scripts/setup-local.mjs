import { existsSync, writeFileSync, chmodSync } from 'node:fs';
import { randomBytes, pbkdf2Sync } from 'node:crypto';
import { spawnSync } from 'node:child_process';
if (!existsSync('.env')) {
  const password = randomBytes(24).toString('base64url');
  const salt = randomBytes(16).toString('hex');
  const secrets = {
    SESSION_SECRET: randomBytes(32).toString('base64url'),
    SOCIAL_ENCRYPTION_KEY: randomBytes(32).toString('base64'),
    CRON_SECRET: randomBytes(32).toString('base64url'),
    ADMIN_PASSWORD_HASH:
      salt +
      ':' +
      pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('hex'),
  };
  writeFileSync(
    '.env',
    Object.entries(secrets)
      .map(([k, v]) => `${k}=${v}`)
      .join('\n') + '\n',
    { mode: 0o600 },
  );
  writeFileSync(
    '.local-login.txt',
    'http://localhost:3000/login\nPassword: ' + password + '\n',
    { mode: 0o600 },
  );
  console.log('Kredensial lokal dibuat. Baca .local-login.txt untuk password.');
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
console.log('Jalankan npm run dev dan buka http://localhost:3000/login.');
