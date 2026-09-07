import { db, fail, body, mutation } from '@/lib/server';
import { userId, configuration, hash, version } from '@/lib/social';
export async function POST(req: Request) {
  try {
    mutation(req);
    const owner = userId(req);
    await body(req);
    const config = await configuration(owner);
    const state = crypto.randomUUID() + crypto.randomUUID();
    const browser = crypto.randomUUID() + crypto.randomUUID();
    const expires = new Date(Date.now() + 600000).toISOString();
    await db()
      .prepare('DELETE FROM oauth_states WHERE expires_at<? OR owner_id=?')
      .bind(new Date().toISOString(), owner)
      .run();
    await db()
      .prepare(
        'INSERT INTO oauth_states (id,owner_id,browser_hash,expires_at) VALUES (?,?,?,?)',
      )
      .bind(await hash(state), owner, await hash(browser), expires)
      .run();
    const url = new URL(`https://www.facebook.com/${version()}/dialog/oauth`);
    url.search = new URLSearchParams({
      client_id: config.appId,
      redirect_uri: new URL('/api/social/callback', req.url).toString(),
      state,
      response_type: 'code',
      auth_type: 'rerequest',
      scope:
        'pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish',
    }).toString();
    return Response.json(
      { url: url.toString() },
      {
        headers: {
          'Set-Cookie': `kontena_oauth=${browser}; HttpOnly; Secure; SameSite=Lax; Path=/api/social; Max-Age=600`,
          'Cache-Control': 'no-store',
        },
      },
    );
  } catch (e) {
    return fail(e);
  }
}
