export type AuthEnv = {
  SESSION_SECRET?: string;
  ADMIN_PASSWORD_HASH?: string;
  DB: D1Database;
};
const encode = new TextEncoder();
const hex = (v: ArrayBuffer) =>
  Array.from(new Uint8Array(v), (n) => n.toString(16).padStart(2, '0')).join(
    '',
  );
export async function digest(value: string) {
  return hex(await crypto.subtle.digest('SHA-256', encode.encode(value)));
}
export async function signature(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    encode.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return hex(await crypto.subtle.sign('HMAC', key, encode.encode(value)));
}
export function equal(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++)
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}
export async function validPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash || password.length > 256) return false;
  const key = await crypto.subtle.importKey(
    'raw',
    encode.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const value = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encode.encode(salt),
      iterations: 100000,
      hash: 'SHA-256',
    },
    key,
    256,
  );
  return equal(hex(value), hash);
}
export async function sessionCookie(env: AuthEnv) {
  if (!env.SESSION_SECRET) throw Error('Login belum dikonfigurasi.');
  const expires = Math.floor(Date.now() / 1000) + 7 * 86400;
  return `${expires}.${await signature('session:owner:' + expires, env.SESSION_SECRET)}`;
}
export async function authenticated(req: Request, env: AuthEnv) {
  if (!env.SESSION_SECRET) return false;
  const value = req.headers
    .get('cookie')
    ?.split(';')
    .map((v) => v.trim())
    .find((v) => v.startsWith('kontena_session='))
    ?.slice(16);
  if (!value) return false;
  const [expiry, mac] = value.split('.');
  if (
    !/^\d{10}$/.test(expiry) ||
    !mac ||
    Number(expiry) <= Date.now() / 1000 ||
    Number(expiry) > Date.now() / 1000 + 7 * 86400 + 60
  )
    return false;
  return equal(
    mac,
    await signature('session:owner:' + expiry, env.SESSION_SECRET),
  );
}
export function sameOrigin(req: Request) {
  const origin = req.headers.get('origin');
  return !!origin && origin === new URL(req.url).origin;
}
export function loginPage(error = '') {
  return `<!doctype html><html lang="id"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Masuk — Kontena</title><style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f7f7f5;color:#24211f;font-family:Arial,sans-serif}main{width:min(420px,calc(100% - 40px));background:white;border:1px solid #eee9e3;border-radius:22px;padding:40px;box-shadow:0 18px 60px #30201008}.brand{font-weight:800;font-size:28px;letter-spacing:-1px;margin-bottom:38px}.brand span{color:#f47721}h1{font-size:24px;letter-spacing:-.7px;margin-bottom:10px}p{color:#8a8177;font-size:14px;line-height:1.7}label{font-size:13px;display:block;margin:25px 0 9px}input{width:100%;padding:14px;border:1px solid #e6e0d9;border-radius:10px;font-size:15px}input:focus{outline:2px solid #ffc99d}button{background:#f47721;color:white;border:0;width:100%;padding:14px;border-radius:10px;margin-top:18px;font-size:14px;font-weight:600;cursor:pointer}.error{color:#af4537;background:#fff0eb;border-radius:8px;padding:10px;font-size:13px}small{display:block;color:#aaa098;text-align:center;margin-top:30px;font-size:11px}</style><main><div class="brand"><span>ϟ</span> kontena<span>.</span></div><h1>Selamat datang kembali.</h1><p>Masuk ke workspace untuk melanjutkan cerita dan kontenmu.</p>${error ? '<p class="error" role="alert">' + error + '</p>' : ''}<form method="post" action="/auth/login"><label for="password">Password workspace</label><input id="password" name="password" type="password" required maxlength="256" autocomplete="current-password" autofocus><button type="submit">Masuk ke workspace →</button></form><small>Kontena Studio · Your creative space</small></main></html>`;
}
export async function login(req: Request, env: AuthEnv) {
  if (!sameOrigin(req))
    return new Response('Origin tidak diizinkan.', { status: 403 });
  if (!env.ADMIN_PASSWORD_HASH || !env.SESSION_SECRET)
    return new Response(loginPage('Login belum dikonfigurasi.'), {
      status: 503,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  if (Number(req.headers.get('content-length') || 0) > 2048)
    return new Response('Data terlalu besar.', { status: 413 });
  const raw = await req.text();
  if (raw.length > 2048)
    return new Response('Data terlalu besar.', { status: 413 });
  const password = new URLSearchParams(raw).get('password') || '';
  const window = Math.floor(Date.now() / 600000);
  const key = await digest(
    (req.headers.get('cf-connecting-ip') || 'local') + ':' + window,
  );
  const attempt = await env.DB.prepare(
    'INSERT INTO login_attempts (id,attempts,expires_at) VALUES (?,1,?) ON CONFLICT(id) DO UPDATE SET attempts=attempts+1 RETURNING attempts',
  )
    .bind(key, Date.now() + 1200000)
    .first<{ attempts: number }>();
  if (!attempt || attempt.attempts > 10)
    return new Response(
      loginPage('Terlalu banyak percobaan. Coba lagi dalam 10 menit.'),
      {
        status: 429,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Retry-After': '600',
        },
      },
    );
  if (!(await validPassword(password, env.ADMIN_PASSWORD_HASH)))
    return new Response(
      loginPage('Password tidak sesuai. Silakan coba kembali.'),
      { status: 401, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  await env.DB.prepare('DELETE FROM login_attempts WHERE id=? OR expires_at<?')
    .bind(key, Date.now())
    .run();
  const secure = new URL(req.url).protocol === 'https:' ? '; Secure' : '';
  return new Response(null, {
    status: 303,
    headers: {
      Location: '/',
      'Set-Cookie': `kontena_session=${await sessionCookie(env)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800${secure}`,
      'Cache-Control': 'no-store',
    },
  });
}
