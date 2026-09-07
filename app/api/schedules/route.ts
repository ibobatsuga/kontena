import { ownsAsset } from '@/lib/asset-ownership';
import { db, body, fail, mutation, runtime } from '@/lib/server';
import { userId, ownedAccount, checkAccount } from '@/lib/social';
export async function GET(req: Request) {
  try {
    const owner = userId(req);
    const r = await db()
      .prepare(
        "SELECT s.id,s.project_id AS projectId,p.title,s.scheduled_at AS scheduledAt,s.platform,s.status,s.auto_post AS autoPost,s.mode,s.error,s.account_id AS accountId,s.account_name AS accountName,json_extract(s.payload,'$.caption') AS caption,json_extract(s.payload,'$.images') AS images,json_extract(s.payload,'$.ratio') AS ratio FROM schedules s JOIN projects p ON p.id=s.project_id AND p.owner_id=s.owner_id WHERE s.owner_id=? ORDER BY s.scheduled_at ASC LIMIT 300",
      )
      .bind(owner)
      .all();
    return Response.json(
      r.results.map((row: any) => ({
        ...row,
        images: JSON.parse(row.images || '[]'),
      })),
    );
  } catch (e) {
    return fail(e, 500);
  }
}
export async function POST(req: Request) {
  return saveSchedule(req, false);
}
export async function PATCH(req: Request) {
  return saveSchedule(req, true);
}
async function saveSchedule(req: Request, editing: boolean) {
  try {
    mutation(req);
    const owner = userId(req);
    const b = await body(req);
    const old = editing
      ? await db()
          .prepare('SELECT * FROM schedules WHERE id=? AND owner_id=?')
          .bind(b.id, owner)
          .first<any>()
      : null;
    if (
      editing &&
      (!old || !['scheduled', 'needs_attention'].includes(old.status))
    )
      throw new Error(
        'Jadwal tidak dapat diedit karena sudah diproses atau tidak ditemukan.',
      );
    if (old?.status === 'needs_attention' && b.confirmedRetry !== true)
      throw new Error(
        'Periksa platform dan pastikan konten belum terpublikasi sebelum menjadwalkan ulang.',
      );
    const date = new Date(b.scheduledAt);
    if (!Number.isFinite(date.getTime()) || date.getTime() < Date.now() + 30000)
      throw new Error('Pilih jadwal setidaknya 1 menit dari sekarang.');
    if (!['Instagram', 'Facebook'].includes(b.platform))
      throw new Error('Platform tidak valid.');
    if (!['demo', 'live'].includes(b.mode))
      throw new Error('Mode jadwal tidak valid.');
    let account = null;
    if (b.accountId) {
      account = await ownedAccount(b.accountId, owner);
      if (account.platform !== b.platform)
        throw new Error('Akun tidak sesuai platform.');
    }
    if (b.mode === 'live' && !account)
      throw new Error('Pilih akun media sosial terhubung sebagai tujuan.');
    if (
      b.mode === 'live' &&
      (!runtime.CRON_SECRET || runtime.SCHEDULER_ENABLED !== 'true')
    )
      throw new Error(
        'Hubungkan publisher dan runner scheduler sebelum menggunakan mode live.',
      );
    if (b.mode === 'live' && account) {
      await checkAccount(account);
      if (account.platform === 'Instagram' && !runtime.SESSION_SECRET)
        throw new Error('Layanan pengiriman gambar Instagram belum diatur.');
    }
    const row = await db()
      .prepare('SELECT payload FROM projects WHERE id=? AND owner_id=?')
      .bind(b.projectId, owner)
      .first<{ payload: string }>();
    if (!row) throw new Error('Simpan konten terlebih dahulu.');
    const p = JSON.parse(row.payload);
    if (old && old.project_id !== p.id)
      throw new Error('Konten jadwal tidak cocok.');
    const snapshot = old ? JSON.parse(old.payload) : null;
    const caption = typeof b.caption === 'string' ? b.caption : p.caption;
    if (typeof caption !== 'string' || caption.length > 10000)
      throw new Error('Caption maksimal 10.000 karakter.');
    const useSnapshot = !!old && !b.replaceImages;
    const images = useSnapshot ? snapshot.images : b.images;
    const ratio = useSnapshot ? snapshot.ratio : p.brief.ratio;
    if (
      !Array.isArray(images) ||
      (!useSnapshot && images.length !== p.slides.length) ||
      images.some(
        (i: unknown) =>
          typeof i !== 'string' || !/^\/api\/assets\/[a-f0-9-]{36}$/.test(i),
      )
    )
      throw new Error('Hasil render slide belum lengkap.');
    if (b.mode === 'live' && b.platform === 'Instagram' && ratio === '9:16')
      throw new Error(
        'Format Story belum didukung auto post. Gunakan 4:5 atau 1:1.',
      );
    if (
      b.mode === 'live' &&
      b.platform === 'Instagram' &&
      (images.length > 10 || caption.length > 2200)
    )
      throw new Error(
        'Instagram mendukung maksimal 10 slide dan caption 2.200 karakter pada integrasi ini.',
      );
    let totalSize = 0;
    for (const path of images) {
      const id = path.split('/').pop();
      if (!(await ownsAsset(id, owner)))
        throw new Error('Gambar jadwal tidak ditemukan.');
      const object = await runtime.MEDIA.head(id);
      if (!object) throw new Error('Gambar jadwal tidak ditemukan.');
      totalSize += object.size;
    }
    if (totalSize > 20000000)
      throw new Error(
        'Total gambar jadwal maksimal 20 MB. Kurangi jumlah slide.',
      );
    const payload = JSON.stringify({
      caption,
      images,
      ratio,
      handle: p.brief.handle,
      origin: new URL(req.url).origin,
    });
    const accountName = account
      ? `${account.name}${account.username ? ' · @' + account.username : ''}`
      : null;
    if (old) {
      const updated = await db()
        .prepare(
          "UPDATE schedules SET account_id=?,account_name=?,scheduled_at=?,platform=?,auto_post=?,mode=?,payload=?,status='scheduled',error=NULL,published_id=NULL WHERE id=? AND owner_id=? AND status=? AND payload=? AND scheduled_at=?",
        )
        .bind(
          account?.id || null,
          accountName,
          date.toISOString(),
          b.platform,
          b.autoPost ? 1 : 0,
          b.mode,
          payload,
          old.id,
          owner,
          old.status,
          old.payload,
          old.scheduled_at,
        )
        .run();
      if (!updated.meta.changes)
        throw new Error(
          'Jadwal berubah atau mulai diproses. Muat ulang kalender.',
        );
      return Response.json({ id: old.id, status: 'scheduled' });
    }
    const id = crypto.randomUUID();
    const status = 'scheduled';
    await db()
      .prepare(
        'INSERT INTO schedules (id,owner_id,account_id,account_name,project_id,scheduled_at,platform,status,auto_post,mode,payload) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      )
      .bind(
        id,
        owner,
        account?.id || null,
        accountName,
        p.id,
        date.toISOString(),
        b.platform,
        status,
        b.autoPost ? 1 : 0,
        b.mode,
        payload,
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
    const owner = userId(req);
    const b = await body(req);
    const r = await db()
      .prepare(
        "UPDATE schedules SET status='cancelled' WHERE id=? AND owner_id=? AND status IN ('scheduled','needs_attention')",
      )
      .bind(b.id, owner)
      .run();
    if (!r.meta.changes)
      throw new Error('Jadwal sudah diproses atau tidak ditemukan.');
    return Response.json({ success: true });
  } catch (e) {
    return fail(e);
  }
}
