import assert from 'node:assert/strict';
import request from 'supertest';

async function loadFreshApp(cacheBust) {
  const modulePath = new URL(`../server/app.js?${cacheBust}`, import.meta.url).href;
  const { createApp } = await import(modulePath);
  return createApp();
}

async function main() {
  process.env.NODE_ENV = 'test';
  process.env.GENERAL_API_RATE_LIMIT_MAX = '100';
  process.env.PUBLIC_API_RATE_LIMIT_MAX = '3';
  process.env.REFRESH_API_RATE_LIMIT_MAX = '2';
  process.env.REFRESH_API_TOKEN = 'test-refresh-token';

  const app = await loadFreshApp(`limits-${Date.now()}`);

  const publicStatuses = [];
  for (let index = 0; index < 3; index += 1) {
    const response = await request(app).get('/api/public/fear-greed');
    publicStatuses.push(response.status);
    assert.ok(response.headers['x-request-id'], 'public API responses should expose x-request-id');
  }
  const publicLimited = await request(app).get('/api/public/fear-greed');
  assert.equal(publicLimited.status, 429, 'public API should return 429 after the configured burst');
  assert.ok(publicLimited.headers['x-request-id'], 'rate-limited public responses should expose x-request-id');

  const refreshUnauthorized = await request(app)
    .get('/api/btc/refresh')
    .set('Authorization', 'Bearer wrong-token');
  assert.equal(refreshUnauthorized.status, 401, 'refresh endpoint should reject an invalid token');
  assert.ok(refreshUnauthorized.headers['x-request-id'], 'refresh responses should expose x-request-id');

  const refreshLimited = await request(app)
    .get('/api/btc/refresh')
    .set('Authorization', 'Bearer wrong-token');
  assert.equal(refreshLimited.status, 401, 'second invalid refresh request should still be unauthorized');

  const refreshBurstBlocked = await request(app)
    .get('/api/btc/refresh')
    .set('Authorization', 'Bearer wrong-token');
  assert.equal(refreshBurstBlocked.status, 429, 'refresh endpoint should return 429 after the configured burst');
  assert.ok(refreshBurstBlocked.headers['x-request-id'], 'rate-limited refresh responses should expose x-request-id');

  const privateRouteApp = await loadFreshApp(`private-routes-${Date.now()}`);

  const lightningFallbackUnauthorized = await request(privateRouteApp)
    .get('/api/public/lightning/fallback');
  assert.equal(lightningFallbackUnauthorized.status, 401, 'private lightning fallback endpoint should reject unauthenticated reads');

  const lightningFallbackWriteUnauthorized = await request(privateRouteApp)
    .post('/api/public/lightning/fallback')
    .send({ data: { ok: true } });
  assert.equal(lightningFallbackWriteUnauthorized.status, 401, 'private lightning fallback endpoint should reject unauthenticated writes');

  const privateRouteAuthorizedApp = await loadFreshApp(`private-routes-auth-${Date.now()}`);

  const lightningFallbackWriteAuthorized = await request(privateRouteAuthorizedApp)
    .post('/api/public/lightning/fallback')
    .set('Authorization', 'Bearer test-refresh-token')
    .send({
      source_provider: 'mempool.space',
      updated_at: '2026-03-26T00:00:00.000Z',
      data: { rows: [] },
    });
  assert.equal(lightningFallbackWriteAuthorized.status, 200, 'private lightning fallback endpoint should accept authenticated writes');

  const lightningFallbackReadAuthorized = await request(privateRouteAuthorizedApp)
    .get('/api/public/lightning/fallback')
    .set('Authorization', 'Bearer test-refresh-token');
  assert.equal(lightningFallbackReadAuthorized.status, 200, 'private lightning fallback endpoint should accept authenticated reads');

  delete process.env.REFRESH_API_TOKEN;
  const failClosedApp = await loadFreshApp(`failclosed-${Date.now()}`);
  const externalHostBlocked = await request(failClosedApp)
    .get('/api/btc/refresh')
    .set('Host', 'example.com')
    .set('X-Forwarded-For', '203.0.113.10');
  assert.equal(externalHostBlocked.status, 403, 'refresh endpoints should fail closed outside localhost without a token');
  assert.ok(externalHostBlocked.headers['x-request-id'], 'fail-closed responses should expose x-request-id');

  const spoofedLoopbackBlocked = await request(failClosedApp)
    .get('/api/btc/refresh')
    .set('Host', 'example.com')
    .set('X-Forwarded-For', '127.0.0.1');
  assert.equal(spoofedLoopbackBlocked.status, 403, 'refresh endpoints should not trust spoofed loopback headers when no token is configured');

  console.log('Security checks passed', {
    publicStatuses,
    publicLimited: publicLimited.status,
    refreshLimited: refreshBurstBlocked.status,
    lightningFallbackRead: lightningFallbackReadAuthorized.status,
    failClosed: externalHostBlocked.status,
    spoofedLoopbackBlocked: spoofedLoopbackBlocked.status,
  });
}

main().catch((error) => {
  console.error('Security checks failed');
  console.error(error);
  process.exitCode = 1;
});
