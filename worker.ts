import handler from 'vinext/server/fetch-handler';
import { workspace, AuthEnv } from './lib/workspace-auth';
import { publicMedia } from './lib/media-links';
import { POST as dispatch } from './app/api/dispatch/route';
type Env = AuthEnv & {
  ASSETS: Fetcher;
  CRON_SECRET?: string;
  SCHEDULER_ENABLED?: string;
};
export default {
  async fetch(
    req: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const u = new URL(req.url);
    const path = u.pathname;
    if (path.startsWith('/publish-media/')) return publicMedia(req);
    if (['/login', '/auth/login', '/auth/logout'].includes(path))
      return Response.redirect(new URL('/', req.url).toString(), 303);
    if (
      path.startsWith('/assets/') ||
      path.startsWith('/_next/static/') ||
      path === '/vinext-client-entry-manifest.json' ||
      path === '/favicon.svg'
    )
      return env.ASSETS.fetch(req);
    if (!env.SESSION_SECRET)
      return new Response('Workspace belum dikonfigurasi.', { status: 503 });
    const identity = await workspace(req, env);
    const headers = new Headers(req.headers);
    for (const name of [...headers.keys()])
      if (name.startsWith('oai-authenticated-') || name === 'x-kontena-owner')
        headers.delete(name);
    headers.set('x-kontena-owner', identity.owner);
    const response = await handler.fetch(
      new Request(req, { headers }),
      env,
      ctx,
    );
    const out = new Response(response.body, response);
    if (identity.cookie) out.headers.append('Set-Cookie', identity.cookie);
    out.headers.set('X-Content-Type-Options', 'nosniff');
    out.headers.set('Referrer-Policy', 'same-origin');
    if (path === '/' || path.startsWith('/api/'))
      out.headers.set('Cache-Control', 'private, no-store');
    return out;
  },
  async scheduled(
    _event: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ) {
    if (env.SCHEDULER_ENABLED !== 'true' || !env.CRON_SECRET) return;
    ctx.waitUntil(
      (async () => {
        const response = await dispatch(
          new Request('https://scheduler.internal/api/dispatch', {
            method: 'POST',
            headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
          }),
        );
        await env.DB.prepare(
          'INSERT INTO settings (id,payload) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload',
        )
          .bind(
            'scheduler:last-run',
            JSON.stringify({
              at: new Date().toISOString(),
              status: response.status,
            }),
          )
          .run();
        if (!response.ok)
          console.error(
            'Scheduler dispatch failed with status',
            response.status,
          );
      })(),
    );
  },
};
