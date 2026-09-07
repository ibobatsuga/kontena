import { db, fail, runtime, https } from '@/lib/server';
export async function POST(req: Request) {
  try {
    if (
      !runtime.CRON_SECRET ||
      req.headers.get('authorization') !== `Bearer ${runtime.CRON_SECRET}`
    )
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (
      runtime.SCHEDULER_ENABLED !== 'true' ||
      !runtime.PUBLISH_GATEWAY_URL ||
      !runtime.PUBLISH_GATEWAY_KEY
    )
      throw new Error('Publisher atau runner belum diaktifkan.');
    const due = await db()
      .prepare(
        "SELECT id,payload,platform FROM schedules WHERE status='scheduled' AND mode='live' AND auto_post=1 AND scheduled_at<=? ORDER BY scheduled_at LIMIT 5",
      )
      .bind(new Date().toISOString())
      .all<{ id: string; payload: string; platform: string }>();
    const outcomes = [];
    for (const job of due.results) {
      const claim = await db()
        .prepare(
          "UPDATE schedules SET status='processing' WHERE id=? AND status='scheduled'",
        )
        .bind(job.id)
        .run();
      if (!claim.meta.changes) continue;
      try {
        const p = JSON.parse(job.payload);
        const images = [];
        for (const path of p.images) {
          const asset = await runtime.MEDIA.get(path.split('/').pop());
          if (!asset) throw new Error('Asset tidak ditemukan.');
          const bytes = new Uint8Array(await asset.arrayBuffer());
          let binary = '';
          for (let i = 0; i < bytes.length; i += 8192)
            binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
          images.push({
            mimeType: asset.httpMetadata?.contentType,
            base64: btoa(binary),
          });
        }
        const r = await fetch(https(runtime.PUBLISH_GATEWAY_URL), {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${runtime.PUBLISH_GATEWAY_KEY}`,
            'Content-Type': 'application/json',
            'Idempotency-Key': job.id,
          },
          body: JSON.stringify({
            idempotencyKey: job.id,
            platform: job.platform,
            caption: p.caption,
            handle: p.handle,
            images,
          }),
          signal: AbortSignal.timeout(90000),
        });
        if (!r.ok) throw new Error('Publisher menolak permintaan.');
        const result: any = await r.json();
        if (!result.publishedId)
          throw new Error('Hasil publikasi belum dapat dikonfirmasi.');
        await db()
          .prepare(
            "UPDATE schedules SET status='published',published_id=? WHERE id=?",
          )
          .bind(result.publishedId, job.id)
          .run();
        outcomes.push({ id: job.id, status: 'published' });
      } catch {
        await db()
          .prepare(
            "UPDATE schedules SET status='needs_attention',error=? WHERE id=?",
          )
          .bind(
            'Periksa status pada platform sebelum mencoba ulang untuk menghindari duplikasi.',
            job.id,
          )
          .run();
        outcomes.push({ id: job.id, status: 'needs_attention' });
      }
    }
    return Response.json({ outcomes });
  } catch (e) {
    return fail(e);
  }
}
