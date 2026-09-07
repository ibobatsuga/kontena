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
// No sign-in is required. The signed, HttpOnly cookie owns this browser's workspace.
export async function workspace(req: Request, env: AuthEnv) {
  if (!env.SESSION_SECRET) throw new Error('Workspace belum dikonfigurasi.');
  const value = req.headers
    .get('cookie')
    ?.split(';')
    .map((v) => v.trim())
    .find((v) => v.startsWith('kontena_workspace='))
    ?.slice(18);
  const [id, expiry, mac, extra] = value?.split('.') || [];
  const now = Math.floor(Date.now() / 1000);
  const lifetime = 365 * 86400;
  if (
    id &&
    (id === 'owner' ||
      /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(
        id,
      )) &&
    /^\d{10}$/.test(expiry) &&
    Number(expiry) > now &&
    Number(expiry) <= now + lifetime + 60 &&
    mac &&
    !extra &&
    equal(mac, await signature(`workspace:${id}:${expiry}`, env.SESSION_SECRET))
  ) {
    return { owner: id, cookie: null };
  }
  // Preserve access for a browser with a valid session from the earlier deployment.
  const owner = (await authenticated(req, env)) ? 'owner' : crypto.randomUUID();
  const expires = now + lifetime;
  const signed = `${owner}.${expires}.${await signature(`workspace:${owner}:${expires}`, env.SESSION_SECRET)}`;
  const secure = new URL(req.url).protocol === 'https:' ? '; Secure' : '';
  return {
    owner,
    cookie: `kontena_workspace=${signed}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${lifetime}${secure}`,
  };
}
