import handler from 'vinext/server/fetch-handler';
import {
  authenticated,
  login,
  loginPage,
  sameOrigin,
  AuthEnv,
} from './lib/workspace-auth';
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
    if (path === '/auth/login' && req.method === 'POST') return login(req, env);
    if (path === '/auth/logout' && req.method === 'POST') {
      if (!sameOrigin(req)) return new Response('Forbidden', { status: 403 });
      return new Response(null, {
        status: 303,
        headers: {
          Location: '/login',
          'Set-Cookie':
            'kontena_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0; Secure',
        },
      });
    }
    if (path === '/login')
      return new Response(loginPage(), {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store',
          'Content-Security-Policy':
            "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
          'Referrer-Policy': 'no-referrer',
        },
      });
    if (
      path.startsWith('/assets/') ||
      path.startsWith('/_next/static/') ||
      path === '/vinext-client-entry-manifest.json' ||
      path === '/favicon.svg'
    )
      return env.ASSETS.fetch(req);
    if (!(await authenticated(req, env))) {
      if (path.startsWith('/api/'))
        return Response.json(
          { error: 'Silakan masuk ke workspace.' },
          { status: 401 },
        );
      return Response.redirect(new URL('/login', req.url).toString(), 303);
    }
    const headers = new Headers(req.headers);
    for (const name of [...headers.keys()])
      if (name.startsWith('oai-authenticated-') || name === 'x-kontena-owner')
        headers.delete(name);
    headers.set('x-kontena-owner', 'owner');
    const response = await handler.fetch(
      new Request(req, { headers }),
      env,
      ctx,
    );
    const out = new Response(response.body, response);
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
