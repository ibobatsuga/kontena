import { ownsAsset } from '@/lib/asset-ownership';
import { userId } from '@/lib/social';
import { runtime } from '@/lib/server';
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[a-f0-9-]{36}$/.test(id) || !(await ownsAsset(id, userId(req))))
    return new Response('Not found', { status: 404 });
  const object = await runtime.MEDIA.get(id);
  if (!object) return new Response('Not found', { status: 404 });
  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'image/png',
      'Cache-Control': 'private, max-age=86400',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
