import { runtime } from './server';
import { signature, equal } from './workspace-auth';
export async function mediaLink(id: string, origin: string) {
  if (!runtime.SESSION_SECRET) throw Error('Kunci media belum diatur.');
  if (!/^[a-f0-9-]{36}$/.test(id)) throw Error('ID media tidak valid.');
  const expires = Math.floor(Date.now() / 1000) + 86400;
  const mac = await signature(`media:${id}:${expires}`, runtime.SESSION_SECRET);
  return `${new URL(origin).origin}/publish-media/${id}?expires=${expires}&signature=${mac}`;
}
export async function publicMedia(req: Request) {
  const u = new URL(req.url);
  const id = u.pathname.split('/').pop() || '';
  const expiry = u.searchParams.get('expires') || '';
  const mac = u.searchParams.get('signature') || '';
  if (
    !runtime.SESSION_SECRET ||
    !['GET', 'HEAD'].includes(req.method) ||
    !/^[a-f0-9-]{36}$/.test(id) ||
    !/^\d{10}$/.test(expiry) ||
    Number(expiry) <= Date.now() / 1000 ||
    Number(expiry) > Date.now() / 1000 + 86460 ||
    !equal(
      mac,
      await signature(`media:${id}:${expiry}`, runtime.SESSION_SECRET),
    )
  )
    return new Response('Not found', { status: 404 });
  const obj = await runtime.MEDIA.get(id);
  if (!obj || obj.httpMetadata?.contentType !== 'image/jpeg')
    return new Response('Not found', { status: 404 });
  return new Response(req.method === 'HEAD' ? null : obj.body, {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
    },
  });
}
