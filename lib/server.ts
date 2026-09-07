import { env } from 'cloudflare:workers';
export const runtime = env as unknown as {
  DB: D1Database;
  MEDIA: R2Bucket;
  AI_GATEWAY_URL?: string;
  AI_GATEWAY_KEY?: string;
  AI_TEXT_MODEL?: string;
  AI_IMAGE_MODEL?: string;
  PUBLISH_GATEWAY_URL?: string;
  PUBLISH_GATEWAY_KEY?: string;
  CRON_SECRET?: string;
  SCHEDULER_ENABLED?: string;
};
export function db() {
  if (!runtime.DB) throw new Error('Database tidak tersedia.');
  return runtime.DB;
}
export function fail(error: unknown, status = 400) {
  return Response.json(
    {
      error: error instanceof Error ? error.message : 'Permintaan tidak valid.',
    },
    { status },
  );
}
export async function body(request: Request): Promise<any> {
  if (Number(request.headers.get('content-length') || 0) > 500000)
    throw new Error('Data terlalu besar.');
  const text = await request.text();
  if (text.length > 500000) throw new Error('Data terlalu besar.');
  const value = JSON.parse(text);
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Data tidak valid.');
  return value;
}
export function mutation(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).origin !== new URL(request.url).origin)
    throw new Error('Origin tidak diizinkan.');
}
export function https(value: unknown) {
  if (typeof value !== 'string') throw new Error('URL tidak valid.');
  const u = new URL(value);
  if (u.protocol !== 'https:') throw new Error('URL harus menggunakan HTTPS.');
  return u.toString();
}
export async function gateway(kind: 'text' | 'image', payload: unknown) {
  if (!runtime.AI_GATEWAY_URL || !runtime.AI_GATEWAY_KEY)
    throw new Error(
      'Model AI belum terhubung. Gunakan mode demo atau unggah gambar.',
    );
  const r = await fetch(https(runtime.AI_GATEWAY_URL), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${runtime.AI_GATEWAY_KEY}`,
    },
    body: JSON.stringify({
      kind,
      model: kind === 'text' ? runtime.AI_TEXT_MODEL : runtime.AI_IMAGE_MODEL,
      ...(payload as object),
    }),
    signal: AbortSignal.timeout(90000),
  });
  if (!r.ok) throw new Error('Layanan AI gagal merespons. Coba lagi nanti.');
  return r.json() as Promise<any>;
}
