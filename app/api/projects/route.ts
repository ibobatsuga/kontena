import { db, body, fail, mutation } from '@/lib/server';
import { validateCreative } from '@/lib/validation';
import { presets, ratios } from '@/lib/model';
export async function GET() {
  try {
    const rows = await db()
      .prepare(
        'SELECT payload FROM projects ORDER BY updated_at DESC LIMIT 200',
      )
      .all<{ payload: string }>();
    return Response.json(rows.results.map((r) => JSON.parse(r.payload)));
  } catch (e) {
    return fail(e, 500);
  }
}
export async function POST(req: Request) {
  try {
    mutation(req);
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
    }
    const now = new Date().toISOString();
    const id =
      typeof p.id === 'string' && /^[a-f0-9-]{36}$/.test(p.id)
        ? p.id
        : crypto.randomUUID();
    const existing = await db()
      .prepare('SELECT created_at FROM projects WHERE id=?')
      .bind(id)
      .first<{ created_at: string }>();
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
        'INSERT INTO projects (id,title,payload,created_at,updated_at) VALUES (?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,payload=excluded.payload,updated_at=excluded.updated_at',
      )
      .bind(id, project.title, JSON.stringify(project), project.createdAt, now)
      .run();
    return Response.json(project);
  } catch (e) {
    return fail(e);
  }
}
