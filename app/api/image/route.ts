import { registerAsset } from '@/lib/asset-ownership';
import { userId } from '@/lib/social';
import { body, fail, gateway, mutation, runtime } from '@/lib/server';
import { ratios } from '@/lib/model';
import { resolveVisualTheme } from '@/lib/creative-options';
export async function POST(req: Request) {
  try {
    mutation(req);
    const b = await body(req);
    if (
      !ratios[b.ratio] ||
      typeof b.prompt !== 'string' ||
      !b.prompt.trim() ||
      b.prompt.length > 6000
    )
      throw new Error('Prompt atau rasio tidak valid.');
    const theme = resolveVisualTheme(
      b.visualLock || 'Auto',
      b.customTheme || '',
    );
    const result = await gateway('image', {
      prompt: b.prompt,
      subject: b.characterSubject,
      style: theme.style,
      aspectRatio: b.ratio,
      width: ratios[b.ratio][0],
      height: ratios[b.ratio][1],
      instructions:
        'Edge to edge image, no text, no letters, no logos, no watermark. Depict the scene described in the prompt.',
    });
    if (
      !['image/png', 'image/jpeg', 'image/webp'].includes(result.mimeType) ||
      typeof result.base64 !== 'string' ||
      result.base64.length > 14000000
    )
      throw new Error('Respons gambar tidak valid.');
    const bytes = Uint8Array.from(atob(result.base64), (c) => c.charCodeAt(0));
    const id = crypto.randomUUID();
    await runtime.MEDIA.put(id, bytes, {
      httpMetadata: { contentType: result.mimeType },
    });
    await registerAsset(id, userId(req));
    return Response.json({ image: '/api/assets/' + id });
  } catch (e) {
    return fail(e);
  }
}
