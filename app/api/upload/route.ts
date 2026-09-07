import { fail, mutation, runtime } from '@/lib/server';
export async function POST(req: Request) {
  try {
    mutation(req);
    if (Number(req.headers.get('content-length') || 0) > 11000000)
      throw new Error('Ukuran gambar maksimal 10 MB.');
    const form = await req.formData();
    const file = form.get('file');
    if (
      !(file instanceof File) ||
      file.size > 10000000 ||
      !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)
    )
      throw new Error('Gunakan PNG, JPG, atau WebP maksimal 10 MB.');
    const bytes = new Uint8Array(await file.arrayBuffer());
    const png = bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78;
    const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const webp = String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
    if (!(png || jpg || webp)) throw new Error('File bukan gambar yang valid.');
    const id = crypto.randomUUID();
    await runtime.MEDIA.put(id, bytes, {
      httpMetadata: {
        contentType: png ? 'image/png' : jpg ? 'image/jpeg' : 'image/webp',
      },
    });
    return Response.json({ image: '/api/assets/' + id });
  } catch (e) {
    return fail(e);
  }
}
