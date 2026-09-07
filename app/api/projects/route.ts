import { db, body, fail, mutation } from '@/lib/server';
import { validateCreative } from '@/lib/validation';
import { presets, ratios } from '@/lib/model';
import { userId } from '@/lib/social';
import { ownsAsset } from '@/lib/asset-ownership';
export async function GET(req: Request) {
  try {
    const rows = await db()
      .prepare(
        'SELECT payload FROM projects WHERE owner_id=? ORDER BY updated_at DESC LIMIT 200',
      )
      .bind(userId(req))
      .all<{ payload: string }>();
    return Response.json(rows.results.map((r) => JSON.parse(r.payload)));
  } catch (e) {
    return fail(e, 500);
  }
}
export async function POST(req: Request) {
  try {
    mutation(req);
    const owner = userId(req);
    const p = await body(req);
    validateCreative(p);
    if (
      !p.title?.trim() ||
      p.title.length > 180 ||
      !Array.isArray(p.slides) ||
      p.slides.length < 1 ||
      p.slides.length > 11 ||
      !ratios[p.brief?.ratio] ||
      !presets.some((t) => t.id === p.brief?.template)
    )
      throw new Error('Konten atau format tidak valid.');
    for (const s of p.slides) {
      if (
        typeof s.headline !== 'string' ||
        s.headline.length > 180 ||
        typeof s.body !== 'string' ||
        s.body.length > 600 ||
        typeof s.eyebrow !== 'string' ||
        s.eyebrow.length > 70 ||
        !/^\/(assets\/volcano\.png|api\/assets\/[a-f0-9-]+)$/.test(s.image)
      )
        throw new Error('Isi slide atau gambar tidak valid.');
      if (
        s.image.startsWith('/api/assets/') &&
        !(await ownsAsset(s.image.split('/').pop(), owner))
      )
        throw new Error('Gambar tidak ditemukan di workspace ini.');
    }
    const now = new Date().toISOString();
    const id =
      typeof p.id === 'string' && /^[a-f0-9-]{36}$/.test(p.id)
        ? p.id
        : crypto.randomUUID();
    const existing = await db()
      .prepare('SELECT created_at,owner_id FROM projects WHERE id=?')
      .bind(id)
      .first<{ created_at: string; owner_id: string }>();
    if (existing && existing.owner_id !== owner)
      throw new Error('Konten tidak ditemukan di workspace ini.');
    const project = {
      id,
      title: p.title.trim(),
      brief: p.brief,
      design: p.design,
      slides: p.slides,
      caption: String(p.caption || '').slice(0, 6000),
      createdAt: existing?.created_at || now,
      updatedAt: now,
    };
    await db()
      .prepare(
        'INSERT INTO projects (id,title,payload,created_at,updated_at,owner_id) VALUES (?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,payload=excluded.payload,updated_at=excluded.updated_at WHERE projects.owner_id=excluded.owner_id',
      )
      .bind(
        id,
        project.title,
        JSON.stringify(project),
        project.createdAt,
        now,
        owner,
      )
      .run();
    return Response.json(project);
  } catch (e) {
    return fail(e);
  }
}
