import { db, runtime } from './server';
export function userId(req: Request) {
  const id = req.headers.get('x-kontena-owner');
  if (!id) throw new Error('Silakan masuk ke Kontena terlebih dahulu.');
  return id;
}
export function socialReady() {
  return !!runtime.SOCIAL_ENCRYPTION_KEY;
}
const enc = new TextEncoder();
const dec = new TextDecoder();
function b64(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes));
}
function unb64(s: string) {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}
async function key() {
  if (!runtime.SOCIAL_ENCRYPTION_KEY)
    throw new Error('Penyimpanan koneksi belum dikonfigurasi.');
  return crypto.subtle.importKey(
    'raw',
    unb64(runtime.SOCIAL_ENCRYPTION_KEY),
    'AES-GCM',
    false,
    ['encrypt', 'decrypt'],
  );
}
export async function seal(value: string, owner: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: enc.encode(owner) },
    await key(),
    enc.encode(value),
  );
  return b64(iv) + '.' + b64(new Uint8Array(data));
}
export async function unseal(value: string, owner: string) {
  const [iv, data] = value.split('.');
  return dec.decode(
    await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: unb64(iv), additionalData: enc.encode(owner) },
      await key(),
      unb64(data),
    ),
  );
}
export async function hash(value: string) {
  return Array.from(
    new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(value))),
  )
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('');
}
export const version = () => runtime.META_GRAPH_VERSION || 'v22.0';
export async function configuration(owner: string) {
  const row = await db()
    .prepare('SELECT app_id,secret FROM social_config WHERE owner_id=?')
    .bind(owner)
    .first<{ app_id: string; secret: string }>();
  if (!row) throw new Error('Atur aplikasi Meta sebelum menghubungkan akun.');
  return { appId: row.app_id, appSecret: await unseal(row.secret, owner) };
}
export async function graph(
  path: string,
  token: string,
  params: Record<string, string> = {},
  method = 'GET',
): Promise<any> {
  if (!/^[a-zA-Z0-9_\/]+$/.test(path))
    throw new Error('Endpoint Meta tidak valid.');
  const url = new URL(`https://graph.facebook.com/${version()}/${path}`);
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  let body: URLSearchParams | undefined;
  if (method === 'GET')
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  else {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    body = new URLSearchParams(params);
  }
  const r = await fetch(url, {
    method,
    headers,
    body,
    signal: AbortSignal.timeout(30000),
  });
  const d: any = await r.json();
  if (!r.ok || d.error) {
    const e = new Error(
      d.error?.code === 190
        ? 'Sesi akun berakhir. Hubungkan ulang akun.'
        : 'Meta tidak dapat memproses permintaan. Periksa izin akun lalu coba kembali.',
    );
    (e as any).code = d.error?.code;
    throw e;
  }
  return d;
}
export type Account = {
  id: string;
  owner_id: string;
  platform: string;
  remote_id: string;
  name: string;
  username: string | null;
  token: string;
  expires_at: string | null;
  status: string;
  permissions: string;
};
export async function ownedAccount(id: string, owner: string) {
  const a = await db()
    .prepare('SELECT * FROM social_accounts WHERE id=? AND owner_id=?')
    .bind(id, owner)
    .first<Account>();
  if (
    !a ||
    a.status !== 'connected' ||
    (a.expires_at && new Date(a.expires_at).getTime() <= Date.now())
  )
    throw new Error('Akun tujuan belum terhubung atau sesinya sudah berakhir.');
  return a;
}
export async function checkAccount(account: Account) {
  try {
    const token = await unseal(account.token, account.owner_id);
    await graph(account.remote_id, token, { fields: 'id,name' });
    await db()
      .prepare('UPDATE social_accounts SET updated_at=? WHERE id=?')
      .bind(new Date().toISOString(), account.id)
      .run();
    return token;
  } catch (e) {
    if ((e as any).code === 190)
      await db()
        .prepare("UPDATE social_accounts SET status='expired' WHERE id=?")
        .bind(account.id)
        .run();
    throw e;
  }
}
