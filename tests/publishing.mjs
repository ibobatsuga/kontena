import { readFileSync } from 'node:fs';
import { randomBytes, webcrypto } from 'node:crypto';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import ts from 'typescript';
function moduleAt(file, imports, extra = {}) {
  const exports = {};
  const compiled = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  vm.runInNewContext(
    compiled,
    {
      exports,
      require: (id) => {
        if (!(id in imports)) throw Error('Unexpected import ' + id);
        return imports[id];
      },
      crypto: webcrypto,
      TextEncoder,
      TextDecoder,
      Uint8Array,
      btoa,
      atob,
      URL,
      URLSearchParams,
      Response,
      Blob,
      FormData,
      AbortSignal,
      ...extra,
    },
    { filename: file },
  );
  return exports;
}
const writes = [];
const database = {
  prepare: () => ({
    bind: (...values) => ({
      run: async () => {
        writes.push(values);
        return { meta: { changes: 1 } };
      },
    }),
  }),
};
const runtime = { SOCIAL_ENCRYPTION_KEY: randomBytes(32).toString('base64') };
const social = moduleAt('lib/social.ts', {
  './server': { runtime, db: () => database },
});
const sealed = await social.seal('test-token', 'alice');
assert(!sealed.includes('test-token'));
assert.equal(await social.unseal(sealed, 'alice'), 'test-token');
await assert.rejects(() => social.unseal(sealed, 'bob'));
assert.notEqual(await social.seal('test-token', 'alice'), sealed);
console.log('PASS encryption round trip, randomized IV and owner binding');
runtime.MEDIA = {
  get: async () => ({
    httpMetadata: { contentType: 'image/jpeg' },
    arrayBuffer: async () => new Uint8Array([255, 216, 255, 217]).buffer,
  }),
};
const events = [];
let sequence = 0;
let pending = true;
const graph = async (path, token, params, method) => {
  events.push({ path, params, method });
  assert.equal(token, 'fake-token');
  if (params?.fields === 'status_code')
    return { status_code: pending ? 'IN_PROGRESS' : 'FINISHED' };
  return {
    id: path.endsWith('/media_publish')
      ? 'published-ig'
      : path.endsWith('/feed')
        ? 'published-fb'
        : String(++sequence),
  };
};
const fakeFetch = async (url, options) => {
  if (url.includes('/photos')) {
    assert.equal(options.body.get('published'), 'false');
    assert.equal(options.headers.Authorization, 'Bearer fake-token');
    events.push({ url });
    return Response.json({ id: String(++sequence) });
  }
  assert.equal(url, 'https://staging.example/');
  assert.equal(options.headers.Authorization, 'Bearer fake-staging-key');
  assert(!options.body.includes('fake-token'));
  return Response.json({
    urls: ['https://cdn.example/1.jpg', 'https://cdn.example/2.jpg'],
  });
};
const publisher = moduleAt(
  'lib/publisher.ts',
  {
    './server': {
      runtime,
      db: () => database,
      https: (v) => new URL(v).toString(),
    },
    './social': {
      checkAccount: async () => 'fake-token',
      graph,
      version: () => 'v22.0',
    },
  },
  { fetch: fakeFetch },
);
let result = await publisher.publishJob(
  'job-fb',
  { platform: 'Facebook', remote_id: 'page123' },
  { images: ['/api/assets/1', '/api/assets/2'], caption: 'caption' },
);
assert.equal(result.publishedId, 'published-fb');
assert.equal(events.filter((e) => e.url?.includes('/photos')).length, 2);
const feed = events.find((e) => e.path === 'page123/feed');
assert.equal(JSON.parse(feed.params['attached_media[0]']).media_fbid, '1');
assert.equal(feed.params.message, 'caption');
assert.equal(events.at(-1).path, 'page123/feed');
console.log(
  'PASS Facebook stages every photo before publishing to the connected Page',
);
events.length = 0;
runtime.MEDIA_STAGING_URL = 'https://staging.example';
runtime.MEDIA_STAGING_KEY = 'fake-staging-key';
const account = { platform: 'Instagram', remote_id: 'ig123' };
let payload = {
  images: ['/api/assets/1', '/api/assets/2'],
  caption: 'caption',
};
result = await publisher.publishJob('job-ig', account, payload);
assert.equal(result.pending, true);
assert(!events.some((e) => e.path?.endsWith('/media_publish')));
const saved = JSON.parse(writes.at(-1)[0]);
payload.publication = saved;
pending = false;
result = await publisher.publishJob('job-ig', account, payload);
assert.equal(result.publishedId, 'published-ig');
assert.equal(
  events.filter((e) => e.path === 'ig123/media' && e.params.is_carousel_item)
    .length,
  2,
);
assert.equal(events.at(-1).path, 'ig123/media_publish');
assert.equal(
  events.find((e) => e.params?.media_type === 'CAROUSEL').params.caption,
  'caption',
);
console.log(
  'PASS Instagram waits for media readiness, resumes existing containers and publishes carousel once',
);
