import { readFileSync } from 'node:fs';
import { webcrypto, pbkdf2Sync } from 'node:crypto';
import vm from 'node:vm';
import ts from 'typescript';
import assert from 'node:assert/strict';
function load(path, imports = {}) {
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(readFileSync(path, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
    {
      exports,
      require: (id) => imports[id],
      crypto: webcrypto,
      TextEncoder,
      Uint8Array,
      ArrayBuffer,
      Date,
      URL,
      URLSearchParams,
      Request,
      Response,
    },
  );
  return exports;
}
const auth = load('lib/workspace-auth.ts');
const env = { SESSION_SECRET: 'a'.repeat(64) };
const password = 'a-long-random-password-used-only-in-tests';
const salt = 'a-test-salt';
const hash =
  salt + ':' + pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('hex');
assert(await auth.validPassword(password, hash));
assert(!(await auth.validPassword('wrong', hash)));
const cookie = await auth.sessionCookie(env);
assert(
  await auth.authenticated(
    new Request('https://test.example', {
      headers: { cookie: 'kontena_session=' + cookie },
    }),
    env,
  ),
);
assert(
  !(await auth.authenticated(
    new Request('https://test.example', {
      headers: { cookie: 'kontena_session=' + cookie + 'x' },
    }),
    env,
  )),
);
assert(
  !(await auth.authenticated(
    new Request('https://test.example', {
      headers: {
        'x-kontena-owner': 'owner',
        'oai-authenticated-user-id': 'owner',
      },
    }),
    env,
  )),
);
assert(
  !auth.sameOrigin(
    new Request('https://test.example', {
      headers: { origin: 'https://evil.example' },
    }),
  ),
);
const guestA = await auth.workspace(new Request('https://test.example'), env);
const guestB = await auth.workspace(new Request('https://test.example'), env);
assert.notEqual(guestA.owner, guestB.owner);
assert.notEqual(guestA.owner, 'owner');
assert(guestA.cookie.includes('HttpOnly; SameSite=Lax; Path=/;'));
assert(guestA.cookie.endsWith('; Secure'));
const browserRequest = (value) =>
  new Request('https://test.example', { headers: { cookie: value } });
const restored = await auth.workspace(
  browserRequest(guestA.cookie.split(';')[0]),
  env,
);
assert.equal(restored.owner, guestA.owner);
assert.equal(restored.cookie, null);
const tampered = guestA.cookie.replace(guestA.owner, guestB.owner);
assert.notEqual(
  (await auth.workspace(browserRequest(tampered), env)).owner,
  guestB.owner,
);
const forged = await auth.workspace(
  new Request('https://test.example', {
    headers: { 'x-kontena-owner': 'owner' },
  }),
  env,
);
assert.notEqual(forged.owner, 'owner');
const legacy = await auth.workspace(
  browserRequest('kontena_session=' + cookie),
  env,
);
assert.equal(legacy.owner, 'owner');
assert(legacy.cookie.startsWith('kontena_workspace=owner.'));
const expiredCookie = guestA.cookie.replace(/\.\d{10}\./, '.1000000000.');
assert.notEqual(
  (await auth.workspace(browserRequest(expiredCookie), env)).owner,
  guestA.owner,
);
assert.notEqual(
  (
    await auth.workspace(
      browserRequest(guestA.cookie.split(';')[0] + '.extra'),
      env,
    )
  ).owner,
  guestA.owner,
);
await assert.rejects(() =>
  auth.workspace(new Request('https://test.example'), {}),
);
console.log(
  'PASS automatic workspace, browser isolation, cookie persistence, tampering/expiry rejection and legacy owner migration',
);
let reads = 0;
const runtime = {
  SESSION_SECRET: env.SESSION_SECRET,
  MEDIA: {
    get: async () => {
      reads++;
      return {
        body: new Uint8Array([255, 216, 255]),
        httpMetadata: { contentType: 'image/jpeg' },
      };
    },
  },
};
const links = load('lib/media-links.ts', {
  './server': { runtime },
  './workspace-auth': auth,
});
const id = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const url = await links.mediaLink(id, 'https://test.example');
assert.equal((await links.publicMedia(new Request(url))).status, 200);
assert.equal(reads, 1);
assert.equal(
  (
    await links.publicMedia(
      new Request(url.replace(id, 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb')),
    )
  ).status,
  404,
);
assert.equal(reads, 1);
const expired = new URL(url);
expired.searchParams.set('expires', '1000000000');
assert.equal((await links.publicMedia(new Request(expired))).status, 404);
console.log(
  'PASS password verification, signed session, forged identity/cookie rejection, origin validation, signed media and expired/tampered media rejection',
);
