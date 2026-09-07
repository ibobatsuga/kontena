import { db, body, fail, mutation } from '@/lib/server';
import { userId, seal, socialReady } from '@/lib/social';
export async function GET(req: Request) {
  try {
    const owner = userId(req);
    const row = await db()
      .prepare('SELECT app_id FROM social_config WHERE owner_id=?')
      .bind(owner)
      .first<{ app_id: string }>();
    return Response.json(
      {
        configured: !!row && socialReady(),
        appId: row?.app_id || '',
        storageReady: socialReady(),
        redirectUri: new URL('/api/social/callback', req.url).toString(),
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (e) {
    return fail(e, 401);
  }
}
export async function POST(req: Request) {
  try {
    mutation(req);
    const owner = userId(req);
    const b = await body(req);
    if (
      !/^\d{5,40}$/.test(b.appId) ||
      typeof b.appSecret !== 'string' ||
      b.appSecret.length < 16 ||
      b.appSecret.length > 256
    )
      throw new Error('Isi Meta App ID dan App Secret yang valid.');
    const connected = await db()
      .prepare(
        "SELECT id FROM social_accounts WHERE owner_id=? AND status='connected' LIMIT 1",
      )
      .bind(owner)
      .first();
    const prior = await db()
      .prepare('SELECT app_id FROM social_config WHERE owner_id=?')
      .bind(owner)
      .first<{ app_id: string }>();
    if (connected && prior?.app_id !== b.appId)
      throw new Error(
        'Putuskan akun terhubung sebelum mengganti aplikasi Meta.',
      );
    const secret = await seal(b.appSecret, owner);
    await db()
      .prepare(
        'INSERT INTO social_config (owner_id,app_id,secret) VALUES (?,?,?) ON CONFLICT(owner_id) DO UPDATE SET app_id=excluded.app_id,secret=excluded.secret',
      )
      .bind(owner, b.appId, secret)
      .run();
    return Response.json({ success: true });
  } catch (e) {
    return fail(e);
  }
}
