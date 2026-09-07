import { db } from '@/lib/server';
import {
  userId,
  configuration,
  hash,
  seal,
  graph,
  version,
} from '@/lib/social';
function back(req: Request, status: string) {
  return new Response(null, {
    status: 303,
    headers: {
      Location: new URL(
        '/?view=accounts&connection=' + status,
        req.url,
      ).toString(),
      'Cache-Control': 'no-store',
      'Set-Cookie':
        'kontena_oauth=; HttpOnly; Secure; SameSite=Lax; Path=/api/social; Max-Age=0',
      'Referrer-Policy': 'no-referrer',
    },
  });
}
export async function GET(req: Request) {
  try {
    const owner = userId(req);
    const q = new URL(req.url).searchParams;
    const state = q.get('state');
    const browser = req.headers
      .get('cookie')
      ?.split(';')
      .map((x) => x.trim())
      .find((x) => x.startsWith('kontena_oauth='))
      ?.slice(14);
    if (!state || !browser) return back(req, 'invalid_state');
    const claimed = await db()
      .prepare(
        'DELETE FROM oauth_states WHERE id=? AND owner_id=? AND browser_hash=? AND expires_at>? RETURNING id',
      )
      .bind(
        await hash(state),
        owner,
        await hash(browser),
        new Date().toISOString(),
      )
      .first();
    if (!claimed) return back(req, 'invalid_state');
    if (q.get('error')) return back(req, 'cancelled');
    const code = q.get('code');
    if (!code) return back(req, 'failed');
    const cfg = await configuration(owner);
    const exchange = new URL(
      `https://graph.facebook.com/${version()}/oauth/access_token`,
    );
    exchange.search = new URLSearchParams({
      client_id: cfg.appId,
      client_secret: cfg.appSecret,
      redirect_uri: new URL('/api/social/callback', req.url).toString(),
      code,
    }).toString();
    let r = await fetch(exchange, { signal: AbortSignal.timeout(30000) });
    let token: any = await r.json();
    if (!r.ok || !token.access_token) return back(req, 'failed');
    const long = new URL(
      `https://graph.facebook.com/${version()}/oauth/access_token`,
    );
    long.search = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: cfg.appId,
      client_secret: cfg.appSecret,
      fb_exchange_token: token.access_token,
    }).toString();
    r = await fetch(long, { signal: AbortSignal.timeout(30000) });
    const extended: any = await r.json();
    if (!r.ok || !extended.access_token) return back(req, 'failed');
    token = extended;
    const permissions = await graph('me/permissions', token.access_token);
    const granted = new Set(
      (permissions.data || [])
        .filter((p: any) => p.status === 'granted')
        .map((p: any) => p.permission),
    );
    if (!granted.has('pages_show_list')) return back(req, 'permissions');
    const expiry = token.expires_in
      ? new Date(Date.now() + token.expires_in * 1000).toISOString()
      : null;
    let after = '';
    let count = 0;
    for (let page = 0; page < 20; page++) {
      const result = await graph('me/accounts', token.access_token, {
        fields: 'id,name,access_token,tasks,instagram_business_account',
        limit: '100',
        ...(after ? { after } : {}),
      });
      for (const p of result.data || []) {
        if (
          !p.access_token ||
          !p.id ||
          !Array.isArray(p.tasks) ||
          !p.tasks.some((t: string) =>
            [
              'CREATE_CONTENT',
              'MANAGE',
              'PROFILE_PLUS_CREATE_CONTENT',
              'PROFILE_PLUS_FULL_CONTROL',
            ].includes(t),
          )
        )
          continue;
        const candidates = [];
        if (
          granted.has('pages_manage_posts') &&
          granted.has('pages_read_engagement')
        )
          candidates.push({
            platform: 'Facebook',
            remoteId: p.id,
            name: p.name,
            username: null,
          });
        if (
          p.instagram_business_account?.id &&
          granted.has('instagram_basic') &&
          granted.has('instagram_content_publish') &&
          granted.has('pages_read_engagement')
        ) {
          const ig = await graph(
            p.instagram_business_account.id,
            p.access_token,
            { fields: 'id,username,name' },
          );
          candidates.push({
            platform: 'Instagram',
            remoteId: ig.id,
            name: ig.name || ig.username,
            username: ig.username,
          });
        }
        for (const a of candidates) {
          const id = await hash(owner + ':' + a.platform + ':' + a.remoteId);
          await db()
            .prepare(
              "INSERT INTO social_accounts (id,owner_id,platform,remote_id,name,username,token,expires_at,status,permissions,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,username=excluded.username,token=excluded.token,expires_at=excluded.expires_at,status='connected',permissions=excluded.permissions,updated_at=excluded.updated_at",
            )
            .bind(
              id,
              owner,
              a.platform,
              a.remoteId,
              a.name,
              a.username,
              await seal(p.access_token, owner),
              expiry,
              'connected',
              JSON.stringify([...granted]),
              new Date().toISOString(),
            )
            .run();
          count++;
        }
      }
      if (!result.paging?.next || !result.paging?.cursors?.after) break;
      after = result.paging.cursors.after;
    }
    return back(req, count ? 'connected' : 'no_accounts');
  } catch {
    return back(req, 'failed');
  }
}
