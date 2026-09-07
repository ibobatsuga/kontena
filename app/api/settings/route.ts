import { db, body, fail, mutation, runtime } from '@/lib/server';
export async function GET() {
  try {
    const s = await db()
      .prepare('SELECT payload FROM settings WHERE id=?')
      .bind('workspace')
      .first<{ payload: string }>();
    return Response.json({
      ...(s
        ? JSON.parse(s.payload)
        : { brand: 'Kontena', handle: '@kontena', autoPost: false }),
      aiReady: !!(runtime.AI_GATEWAY_URL && runtime.AI_GATEWAY_KEY),
      publisherReady: !!runtime.SOCIAL_ENCRYPTION_KEY,
      instagramMediaReady: !!(
        runtime.MEDIA_STAGING_URL && runtime.MEDIA_STAGING_KEY
      ),
      schedulerReady:
        runtime.SCHEDULER_ENABLED === 'true' && !!runtime.CRON_SECRET,
    });
  } catch (e) {
    return fail(e, 500);
  }
}
export async function POST(req: Request) {
  try {
    mutation(req);
    const s = await body(req);
    if (
      typeof s.brand !== 'string' ||
      s.brand.length > 80 ||
      typeof s.handle !== 'string' ||
      s.handle.length > 80
    )
      throw new Error('Nama brand atau akun tidak valid.');
    const settings = {
      brand: s.brand,
      handle: s.handle,
      autoPost: !!s.autoPost,
    };
    await db()
      .prepare(
        'INSERT INTO settings (id,payload) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload',
      )
      .bind('workspace', JSON.stringify(settings))
      .run();
    return Response.json(settings);
  } catch (e) {
    return fail(e);
  }
}
