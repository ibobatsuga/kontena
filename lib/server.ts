import { env } from 'cloudflare:workers';
const bindings = env as unknown as {
  DB: D1Database;
  SESSION_SECRET?: string;
  ADMIN_PASSWORD_HASH?: string;
  MEDIA?: R2Bucket;
  MEDIA_KV?: KVNamespace;
  AI_GATEWAY_URL?: string;
  AI_GATEWAY_KEY?: string;
  AI_TEXT_MODEL?: string;
  AI_IMAGE_MODEL?: string;
  SOCIAL_ENCRYPTION_KEY?: string;
  META_GRAPH_VERSION?: string;
  CRON_SECRET?: string;
  SCHEDULER_ENABLED?: string;
};
// Immutable image objects can use KV until R2 is enabled on the owner's account.
function kvMedia(kv: KVNamespace) {
  async function read(id: string) {
    const item = await kv.getWithMetadata<{
      contentType: string;
      size: number;
    }>(id, { type: 'arrayBuffer' });
    if (!item.value) return null;
    return {
      body: item.value,
      arrayBuffer: async () => item.value!,
      size: item.metadata?.size || item.value.byteLength,
      httpMetadata: {
        contentType: item.metadata?.contentType || 'application/octet-stream',
      },
    };
  }
  return {
    get: read,
    head: read,
    put: async (id: string, value: ArrayBuffer | Uint8Array, options: any) => {
      const size = value.byteLength;
      await kv.put(id, value, {
        metadata: { contentType: options.httpMetadata.contentType, size },
      });
    },
  };
}
export const runtime = {
  ...bindings,
  MEDIA: (bindings.MEDIA ||
    (bindings.MEDIA_KV ? kvMedia(bindings.MEDIA_KV) : undefined)) as R2Bucket,
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
