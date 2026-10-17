import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { gzipSync } from 'node:zlib';
import { test } from 'node:test';
import express from 'express';
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  createClerkProxyHandler,
  getClerkProxyHost,
} from '../src/middlewares/clerkProxyMiddleware.ts';

async function listen(t, handler) {
  const server = createServer(handler);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => {
    server.closeAllConnections();
    server.close(resolve);
  }));
  return `http://127.0.0.1:${server.address().port}`;
}

test('public hostname uses the first forwarded host and falls back to Host', () => {
  assert.equal(getClerkProxyHost({ headers: {
    'x-forwarded-host': ' public.example, internal.example', host: 'internal',
  } }), 'public.example');
  assert.equal(getClerkProxyHost({ headers: {
    'x-forwarded-host': ['public.example, internal.example'], host: 'internal',
  } }), 'public.example');
  assert.equal(getClerkProxyHost({ headers: { host: 'fallback.example' } }), 'fallback.example');
});

test('development requests bypass the production-only proxy', () => {
  assert.equal(process.env.NODE_ENV, 'development');
  let nextCalled = false;
  clerkProxyMiddleware()({}, {}, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
});

test('proxy preserves mounted path, query, POST body, auth headers and cookies', async (t) => {
  const upstream = await listen(t, async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    assert.equal(req.url, '/v1/client?test=yes');
    assert.equal(req.method, 'POST');
    assert.equal(req.headers.host, new URL(upstream).host);
    assert.equal(req.headers['clerk-proxy-url'], `https://public.example${CLERK_PROXY_PATH}`);
    assert.equal(req.headers['clerk-secret-key'], 'test-only-key');
    assert.equal(req.headers['x-forwarded-for'], '203.0.113.5');
    assert.equal(req.headers.cookie, 'session=test');
    assert.equal(Buffer.concat(chunks).toString(), '{"test":true}');
    res.setHeader('set-cookie', ['one=1; HttpOnly', 'two=2; Secure']);
    res.setHeader('content-type', 'application/json');
    res.write('{"ok":');
    res.end('true}');
  });
  const app = express();
  app.use(CLERK_PROXY_PATH, createClerkProxyHandler('test-only-key', upstream));
  const origin = await listen(t, app);
  const response = await fetch(`${origin}${CLERK_PROXY_PATH}/v1/client?test=yes`, {
    method: 'POST',
    headers: {
      'x-forwarded-host': 'public.example, internal.example',
      'x-forwarded-proto': 'https',
      'x-forwarded-for': '203.0.113.5, 10.0.0.1',
      cookie: 'session=test',
      'content-type': 'application/json',
    },
    body: '{"test":true}',
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-length'), '11');
  assert.equal(response.headers.get('transfer-encoding'), null);
  assert.deepEqual(response.headers.getSetCookie(), ['one=1; HttpOnly', 'two=2; Secure']);
  assert.deepEqual(await response.json(), { ok: true });
});

test('length-known compressed responses, HEAD, 204 and 304 retain their semantics', async (t) => {
  const compressed = gzipSync('asset content');
  const upstream = await listen(t, (req, res) => {
    if (req.url === '/empty') {
      res.writeHead(204);
      res.end();
    } else if (req.url === '/cached') {
      res.writeHead(304, { etag: '"test"' });
      res.end();
    } else {
      res.writeHead(200, {
        'content-length': compressed.length,
        'content-encoding': 'gzip',
      });
      res.end(req.method === 'HEAD' ? undefined : compressed);
    }
  });
  const app = express();
  app.use(CLERK_PROXY_PATH, createClerkProxyHandler('test-only-key', upstream));
  const origin = await listen(t, app);
  const asset = await fetch(`${origin}${CLERK_PROXY_PATH}/asset`);
  assert.equal(asset.headers.get('content-encoding'), 'gzip');
  assert.equal(asset.headers.get('content-length'), String(compressed.length));
  assert.equal(await asset.text(), 'asset content');
  const head = await fetch(`${origin}${CLERK_PROXY_PATH}/asset`, { method: 'HEAD' });
  assert.equal(head.headers.get('content-length'), String(compressed.length));
  assert.equal(await head.text(), '');
  const empty = await fetch(`${origin}${CLERK_PROXY_PATH}/empty`);
  assert.equal(empty.status, 204);
  assert.equal(empty.headers.get('content-length'), null);
  assert.equal(await empty.text(), '');
  const cached = await fetch(`${origin}${CLERK_PROXY_PATH}/cached`);
  assert.equal(cached.status, 304);
  assert.equal(cached.headers.get('etag'), '"test"');
});

test('upstream failure returns a length-known 502 instead of an unhandled rejection', async (t) => {
  const upstream = await listen(t, (req) => req.socket.destroy());
  const app = express();
  app.use(CLERK_PROXY_PATH, createClerkProxyHandler('test-only-key', upstream));
  const origin = await listen(t, app);
  const response = await fetch(`${origin}${CLERK_PROXY_PATH}/v1/client`);
  assert.equal(response.status, 502);
  assert.equal(response.headers.get('content-length'), '0');
  assert.equal(await response.text(), '');
});
