import { db, body, fail, mutation, runtime } from '@/lib/server';
export async function GET() {
  try {
    const r = await db()
      .prepare(
        'SELECT s.id,s.project_id AS projectId,p.title,s.scheduled_at AS scheduledAt,s.platform,s.status,s.auto_post AS autoPost,s.mode,s.error FROM schedules s JOIN projects p ON p.id=s.project_id ORDER BY s.scheduled_at ASC LIMIT 300',
      )
      .all();
    return Response.json(r.results);
  } catch (e) {
    return fail(e, 500);
  }
}
export async function POST(req: Request) {
  try {
    mutation(req);
    const b = await body(req);
    const date = new Date(b.scheduledAt);
    if (!Number.isFinite(date.getTime()) || date.getTime() < Date.now() + 30000)
      throw new Error('Pilih jadwal setidaknya 1 menit dari sekarang.');
    if (!['Instagram', 'Facebook'].includes(b.platform))
      throw new Error('Platform tidak valid.');
    if (!['demo', 'live'].includes(b.mode))
      throw new Error('Mode jadwal tidak valid.');
    if (
      b.mode === 'live' &&
      (!runtime.PUBLISH_GATEWAY_URL ||
        !runtime.PUBLISH_GATEWAY_KEY ||
        !runtime.CRON_SECRET ||
        runtime.SCHEDULER_ENABLED !== 'true')
    )
      throw new Error(
        'Hubungkan publisher dan runner scheduler sebelum menggunakan mode live.',
      );
    const row = await db()
      .prepare('SELECT payload FROM projects WHERE id=?')
      .bind(b.projectId)
      .first<{ payload: string }>();
    if (!row) throw new Error('Simpan konten terlebih dahulu.');
    const p = JSON.parse(row.payload);
    if (
      !Array.isArray(b.images) ||
      b.images.length !== p.slides.length ||
      b.images.some(
        (i: unknown) =>
          typeof i !== 'string' || !/^\/api\/assets\/[a-f0-9-]{36}$/.test(i),
      )
    )
      throw new Error('Hasil render slide belum lengkap.');
    if (
      b.mode === 'live' &&
      b.platform === 'Instagram' &&
      p.brief.ratio === '9:16'
    )
      throw new Error(
        'Format Story belum didukung auto post. Gunakan 4:5 atau 1:1.',
      );
    let totalSize = 0;
    for (const path of b.images) {
      const object = await runtime.MEDIA.head(path.split('/').pop());
      if (!object) throw new Error('Gambar jadwal tidak ditemukan.');
      totalSize += object.size;
    }
    if (totalSize > 20000000)
      throw new Error(
        'Total gambar jadwal maksimal 20 MB. Kurangi jumlah slide.',
      );
    const id = crypto.randomUUID();
    const status = 'scheduled';
    await db()
      .prepare(
        'INSERT INTO schedules (id,project_id,scheduled_at,platform,status,auto_post,mode,payload) VALUES (?,?,?,?,?,?,?,?)',
      )
      .bind(
        id,
        p.id,
        date.toISOString(),
        b.platform,
        status,
        b.autoPost ? 1 : 0,
        b.mode,
        JSON.stringify({
          caption: p.caption,
          images: b.images,
          ratio: p.brief.ratio,
          handle: p.brief.handle,
          origin: new URL(req.url).origin,
        }),
      )
      .run();
    return Response.json({ id, status });
  } catch (e) {
    return fail(e);
  }
}
export async function DELETE(req: Request) {
  try {
    mutation(req);
    const b = await body(req);
    const r = await db()
      .prepare(
        "UPDATE schedules SET status='cancelled' WHERE id=? AND status='scheduled'",
      )
      .bind(b.id)
      .run();
    if (!r.meta.changes)
      throw new Error('Jadwal sudah diproses atau tidak ditemukan.');
    return Response.json({ success: true });
  } catch (e) {
    return fail(e);
  }
}
