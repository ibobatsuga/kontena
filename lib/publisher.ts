import { mediaLink } from './media-links';
import { runtime, https, db } from './server';
import { Account, checkAccount, graph, version } from './social';
// Containers/photo uploads never publish until the final feed/media_publish call.
export async function publishJob(
  jobId: string,
  account: Account,
  payload: any,
) {
  const token = await checkAccount(account);
  const progress = payload.publication || { items: [] };
  async function remember() {
    await db()
      .prepare(
        "UPDATE schedules SET payload=json_set(payload,'$.publication',json(?)) WHERE id=?",
      )
      .bind(JSON.stringify(progress), jobId)
      .run();
  }
  if (account.platform === 'Facebook') {
    for (let i = progress.items.length; i < payload.images.length; i++) {
      const obj = await runtime.MEDIA.get(payload.images[i].split('/').pop());
      if (!obj) throw new Error('Gambar tidak ditemukan.');
      const form = new FormData();
      form.append(
        'source',
        new Blob([await obj.arrayBuffer()], {
          type: obj.httpMetadata?.contentType || 'image/jpeg',
        }),
        'slide.jpg',
      );
      form.append('published', 'false');
      const r = await fetch(
        `https://graph.facebook.com/${version()}/${account.remote_id}/photos`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
          signal: AbortSignal.timeout(30000),
        },
      );
      const result: any = await r.json();
      if (!r.ok || !result.id)
        throw new Error('Unggah foto Facebook gagal. Periksa izin akun.');
      progress.items.push(result.id);
      await remember();
    }
    const data: Record<string, string> = { message: payload.caption };
    progress.items.forEach(
      (id: string, i: number) =>
        (data[`attached_media[${i}]`] = JSON.stringify({ media_fbid: id })),
    );
    const result = await graph(
      account.remote_id + '/feed',
      token,
      data,
      'POST',
    );
    if (!result.id) throw new Error('Publikasi belum terkonfirmasi.');
    return { publishedId: result.id };
  }
  if (!progress.urls) {
    progress.urls = [];
    for (const path of payload.images) {
      const id = path.split('/').pop();
      const obj = await runtime.MEDIA.head(id);
      if (!obj || obj.httpMetadata?.contentType !== 'image/jpeg')
        throw new Error('Instagram memerlukan gambar JPEG.');
      progress.urls.push(await mediaLink(id, payload.origin));
    }
    await remember();
  }
  for (let i = progress.items.length; i < progress.urls.length; i++) {
    const result = await graph(
      account.remote_id + '/media',
      token,
      {
        image_url: progress.urls[i],
        ...(progress.urls.length > 1
          ? { is_carousel_item: 'true' }
          : { caption: payload.caption }),
      },
      'POST',
    );
    if (!result.id) throw new Error('Container gambar gagal dibuat.');
    progress.items.push(result.id);
    await remember();
  }
  for (const id of progress.items) {
    const result = await graph(id, token, { fields: 'status_code' });
    if (result.status_code === 'ERROR' || result.status_code === 'EXPIRED')
      throw new Error('Instagram menolak atau kedaluwarsa memproses gambar.');
    if (result.status_code !== 'FINISHED') return { pending: true };
  }
  if (progress.urls.length > 1 && !progress.parent) {
    const result = await graph(
      account.remote_id + '/media',
      token,
      {
        media_type: 'CAROUSEL',
        children: progress.items.join(','),
        caption: payload.caption,
      },
      'POST',
    );
    if (!result.id) throw new Error('Container carousel gagal dibuat.');
    progress.parent = result.id;
    await remember();
  }
  const container = progress.parent || progress.items[0];
  if (progress.parent) {
    const result = await graph(container, token, { fields: 'status_code' });
    if (result.status_code === 'ERROR' || result.status_code === 'EXPIRED')
      throw new Error('Carousel tidak dapat dipublikasikan.');
    if (result.status_code !== 'FINISHED') return { pending: true };
  }
  const published = await graph(
    account.remote_id + '/media_publish',
    token,
    { creation_id: container },
    'POST',
  );
  if (!published.id) throw new Error('Publikasi belum terkonfirmasi.');
  return { publishedId: published.id };
}
