import crypto from 'node:crypto';

const CACHE_PREFIX = String(process.env.CACHE_KEY_PREFIX || 'satoshi-dashboard:v1');
const REMOTE_URL = String(
  process.env.KV_REST_API_URL
  || process.env.UPSTASH_REDIS_REST_URL
  || '',
).trim();
const REMOTE_TOKEN = String(
  process.env.KV_REST_API_TOKEN
  || process.env.UPSTASH_REDIS_REST_TOKEN
  || '',
).trim();
const REMOTE_ENABLED = Boolean(REMOTE_URL && REMOTE_TOKEN);

const localCache = globalThis.__SATOSHI_RUNTIME_CACHE__ || new Map();
const localLocks = globalThis.__SATOSHI_RUNTIME_LOCKS__ || new Map();

if (!globalThis.__SATOSHI_RUNTIME_CACHE__) globalThis.__SATOSHI_RUNTIME_CACHE__ = localCache;
if (!globalThis.__SATOSHI_RUNTIME_LOCKS__) globalThis.__SATOSHI_RUNTIME_LOCKS__ = localLocks;

function withPrefix(key) {
  return `${CACHE_PREFIX}:${key}`;
}

async function remoteCommand(args) {
  if (!REMOTE_ENABLED) {
    return { ok: false, result: null };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);

  try {
    const response = await fetch(REMOTE_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${REMOTE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(args),
    });

    if (!response.ok) {
      return { ok: false, result: null };
    }

    const json = await response.json();
    return { ok: true, result: json?.result ?? null };
  } catch {
    return { ok: false, result: null };
  } finally {
    clearTimeout(timeout);
  }
}

function setLocalCache(key, value, ttlSeconds) {
  const expiresAt = Number.isFinite(ttlSeconds)
    ? Date.now() + (Math.max(1, ttlSeconds) * 1000)
    : null;
  localCache.set(key, { value, expiresAt });
}

function getLocalCache(key) {
  const entry = localCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt && Date.now() > entry.expiresAt) {
    localCache.delete(key);
    return null;
  }
  return entry.value;
}

function deleteLocalCache(key) {
  localCache.delete(key);
}

export async function cacheSetJson(key, value, { ttlSeconds } = {}) {
  const namespaced = withPrefix(key);
  const encoded = JSON.stringify(value);
  setLocalCache(namespaced, encoded, ttlSeconds);

  if (!REMOTE_ENABLED) return;

  const command = ['SET', namespaced, encoded];
  if (Number.isFinite(ttlSeconds)) {
    command.push('EX', String(Math.max(1, Math.floor(ttlSeconds))));
  }
  await remoteCommand(command);
}

export async function cacheGetJson(key) {
  const namespaced = withPrefix(key);
  const local = getLocalCache(namespaced);
  if (typeof local === 'string') {
    try {
      return JSON.parse(local);
    } catch {
      deleteLocalCache(namespaced);
    }
  }

  if (!REMOTE_ENABLED) return null;

  const remote = await remoteCommand(['GET', namespaced]);
  if (!remote.ok || typeof remote.result !== 'string') return null;

  setLocalCache(namespaced, remote.result, null);

  try {
    return JSON.parse(remote.result);
  } catch {
    return null;
  }
}

export async function cacheDelete(key) {
  const namespaced = withPrefix(key);
  deleteLocalCache(namespaced);
  if (!REMOTE_ENABLED) return;
  await remoteCommand(['DEL', namespaced]);
}

function acquireLocalLock(lockKey, token, ttlSeconds) {
  const now = Date.now();
  const entry = localLocks.get(lockKey);
  if (entry && entry.expiresAt > now) return false;

  const expiresAt = now + (Math.max(1, ttlSeconds) * 1000);
  localLocks.set(lockKey, { token, expiresAt });
  return true;
}

function releaseLocalLock(lockKey, token) {
  const entry = localLocks.get(lockKey);
  if (!entry || entry.token !== token) return;
  localLocks.delete(lockKey);
}

async function acquireDistributedLock(lockKey, token, ttlSeconds) {
  if (!REMOTE_ENABLED) return { mode: 'local', acquired: false };

  const result = await remoteCommand([
    'SET',
    lockKey,
    token,
    'EX',
    String(Math.max(1, Math.floor(ttlSeconds))),
    'NX',
  ]);

  if (!result.ok) return { mode: 'local', acquired: false };
  return { mode: 'remote', acquired: result.result === 'OK' };
}

async function releaseDistributedLock(lockKey, token) {
  if (!REMOTE_ENABLED) return;

  const current = await remoteCommand(['GET', lockKey]);
  if (!current.ok || current.result !== token) return;
  await remoteCommand(['DEL', lockKey]);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withCacheLock(
  lockKey,
  task,
  {
    ttlSeconds = 20,
    waitMs = 2500,
    pollMs = 120,
  } = {},
) {
  const namespaced = withPrefix(`lock:${lockKey}`);
  const token = crypto.randomUUID();
  const deadline = Date.now() + Math.max(0, waitMs);

  while (Date.now() <= deadline) {
    const distributed = await acquireDistributedLock(namespaced, token, ttlSeconds);
    if (distributed.mode === 'remote') {
      if (distributed.acquired) {
        try {
          return await task();
        } finally {
          await releaseDistributedLock(namespaced, token);
        }
      }
    } else {
      const acquired = acquireLocalLock(namespaced, token, ttlSeconds);
      if (acquired) {
        try {
          return await task();
        } finally {
          releaseLocalLock(namespaced, token);
        }
      }
    }

    await sleep(Math.max(30, pollMs));
  }

  return null;
}

export function isSharedCacheEnabled() {
  return REMOTE_ENABLED;
}
