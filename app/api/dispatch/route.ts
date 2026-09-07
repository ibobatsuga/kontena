import { db, fail, runtime } from '@/lib/server';
import { ownedAccount } from '@/lib/social';
import { publishJob } from '@/lib/publisher';
export async function POST(req: Request) {
  try {
    if (
      !runtime.CRON_SECRET ||
      req.headers.get('authorization') !== `Bearer ${runtime.CRON_SECRET}`
    )
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (runtime.SCHEDULER_ENABLED !== 'true')
      throw new Error('Runner belum diaktifkan.');
    const due = await db()
      .prepare(
        "SELECT id,payload,owner_id,account_id FROM schedules WHERE status='scheduled' AND mode='live' AND auto_post=1 AND scheduled_at<=? ORDER BY scheduled_at LIMIT 1",
      )
      .bind(new Date().toISOString())
      .all<{
        id: string;
        payload: string;
        owner_id: string;
        account_id: string;
      }>();
    const outcomes = [];
    for (const job of due.results) {
      const claim = await db()
        .prepare(
          "UPDATE schedules SET status='processing' WHERE id=? AND status='scheduled' AND payload=? AND scheduled_at<=?",
        )
        .bind(job.id, job.payload, new Date().toISOString())
        .run();
      if (!claim.meta.changes) continue;
      try {
        if (!job.account_id || !job.owner_id)
          throw new Error('Akun tujuan belum dipilih.');
        const account = await ownedAccount(job.account_id, job.owner_id);
        const result = await publishJob(
          job.id,
          account,
          JSON.parse(job.payload),
        );
        if (result.pending) {
          await db()
            .prepare(
              "UPDATE schedules SET status='scheduled' WHERE id=? AND status='processing'",
            )
            .bind(job.id)
            .run();
          outcomes.push({ id: job.id, status: 'waiting_for_media' });
        } else {
          await db()
            .prepare(
              "UPDATE schedules SET status='published',published_id=? WHERE id=?",
            )
            .bind(result.publishedId, job.id)
            .run();
          outcomes.push({ id: job.id, status: 'published' });
        }
      } catch {
        await db()
          .prepare(
            "UPDATE schedules SET status='needs_attention',error=? WHERE id=?",
          )
          .bind(
            'Publikasi belum terkonfirmasi. Periksa koneksi akun dan postingan di platform sebelum mencoba ulang.',
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
