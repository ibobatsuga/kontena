import { db, body, fail, mutation } from '@/lib/server';
import { userId, ownedAccount, checkAccount } from '@/lib/social';
export async function GET(req: Request) {
  try {
    const owner = userId(req);
    const rows = await db()
      .prepare(
        "SELECT id,platform,name,username,expires_at AS expiresAt,CASE WHEN status='connected' AND expires_at IS NOT NULL AND expires_at<=? THEN 'expired' ELSE status END AS status,updated_at AS updatedAt FROM social_accounts WHERE owner_id=? AND status!='disconnected' ORDER BY platform,name",
      )
      .bind(new Date().toISOString(), owner)
      .all();
    return Response.json(rows.results, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    return fail(e, 401);
  }
}
export async function POST(req: Request) {
  try {
    mutation(req);
    const owner = userId(req);
    const { id } = await body(req);
    const a = await ownedAccount(id, owner);
    await checkAccount(a);
    return Response.json({ valid: true });
  } catch (e) {
    return fail(e);
  }
}
export async function DELETE(req: Request) {
  try {
    mutation(req);
    const owner = userId(req);
    const { id } = await body(req);
    await db().batch([
      db()
        .prepare(
          "UPDATE social_accounts SET status='disconnected',token='' WHERE id=? AND owner_id=?",
        )
        .bind(id, owner),
      db()
        .prepare(
          "UPDATE schedules SET status='needs_attention',error='Akun tujuan diputus. Hubungkan kembali akun dan buat jadwal baru.' WHERE account_id=? AND owner_id=? AND status='scheduled'",
        )
        .bind(id, owner),
    ]);
    return Response.json({ success: true });
  } catch (e) {
    return fail(e);
  }
}
