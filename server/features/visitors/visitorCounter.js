import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { cacheGetJson, cacheSetJson, isSharedCacheEnabled, withCacheLock } from '../../core/runtimeCache.js';

const COUNTER_FILE = path.resolve(process.cwd(), 'visitor_counter.json');
const SHARED_STATE_KEY = 'visitors:state';
const SHARED_LOCK_KEY = 'visitors:state:update';
const IS_PRODUCTION = ['production', 'preview'].includes(String(process.env.VERCEL_ENV || '').toLowerCase())
  || String(process.env.NODE_ENV || '').toLowerCase() === 'production';

const CONFIGURED_SALT = String(process.env.VISITOR_COUNTER_SALT || '').trim();
const FALLBACK_SALT_SEED = String(
  process.env.REFRESH_API_TOKEN
  || process.env.KV_REST_API_TOKEN
  || process.env.UPSTASH_REDIS_REST_TOKEN
  || process.env.CACHE_KEY_PREFIX
  || 'satoshi-dashboard',
).trim();
const HASH_SALT = CONFIGURED_SALT
  || createHash('sha256').update(`visitor-salt:${FALLBACK_SALT_SEED}`).digest('hex');

let statePromise;
let writeQueue = Promise.resolve();
let warnedMissingSalt = false;

function warnIfSaltMissing() {
  if (!IS_PRODUCTION || CONFIGURED_SALT || warnedMissingSalt) return;
  warnedMissingSalt = true;
  console.warn('[visitors] VISITOR_COUNTER_SALT is not set; using derived fallback salt for pseudonymous hashing');
}

function getDefaultState() {
  const now = new Date().toISOString();
  return {
    uniqueVisitors: 0,
    totalHits: 0,
    createdAt: now,
    updatedAt: now,
    seenVisitorHashes: new Set(),
  };
}

function parseNumber(value, fallback) {
  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : fallback;
}

function toRuntimeState(raw) {
  const fallback = getDefaultState();
  if (!raw || typeof raw !== 'object') {
    return fallback;
  }

  const seenVisitorHashes = new Set(
    [
      ...(Array.isArray(raw.seenVisitorHashes) ? raw.seenVisitorHashes : []),
      ...(Array.isArray(raw.seenIpHashes) ? raw.seenIpHashes : []),
    ].filter((value) => typeof value === 'string' && value.length > 0),
  );

  const uniqueFromFile = parseNumber(raw.uniqueVisitors, 0);
  const uniqueVisitors = Math.max(uniqueFromFile, seenVisitorHashes.size);
  const totalHits = Math.max(parseNumber(raw.totalHits, uniqueVisitors), uniqueVisitors);

  return {
    uniqueVisitors,
    totalHits,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : fallback.createdAt,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : fallback.updatedAt,
    seenVisitorHashes,
  };
}

function toStoredState(state) {
  return {
    uniqueVisitors: state.uniqueVisitors,
    totalHits: state.totalHits,
    createdAt: state.createdAt,
    updatedAt: state.updatedAt,
    seenVisitorHashes: [...state.seenVisitorHashes],
  };
}

async function loadLocalState() {
  try {
    const text = await readFile(COUNTER_FILE, 'utf8');
    return toRuntimeState(JSON.parse(text));
  } catch {
    return getDefaultState();
  }
}

async function getLocalState() {
  if (!statePromise) {
    statePromise = loadLocalState();
  }
  return statePromise;
}

async function persistLocalState(state) {
  const payload = `${JSON.stringify(toStoredState(state), null, 2)}\n`;
  writeQueue = writeQueue
    .catch(() => undefined)
    .then(() => writeFile(COUNTER_FILE, payload, 'utf8'))
    .catch(() => undefined);
  await writeQueue;
}

async function readSharedState() {
  const shared = await cacheGetJson(SHARED_STATE_KEY);
  return toRuntimeState(shared);
}

async function persistSharedState(state) {
  await cacheSetJson(SHARED_STATE_KEY, toStoredState(state));
}

function normalizeVisitorId(value) {
  const raw = String(value || '').trim();
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(raw)) {
    return null;
  }
  return raw;
}

function hashVisitorId(visitorId) {
  return createHash('sha256').update(`${HASH_SALT}:${visitorId}`).digest('hex');
}

function mutateState(state, visitorHash) {
  state.totalHits += 1;

  const isNewVisitor = !state.seenVisitorHashes.has(visitorHash);
  if (isNewVisitor) {
    state.seenVisitorHashes.add(visitorHash);
    state.uniqueVisitors = state.seenVisitorHashes.size;
  }

  state.updatedAt = new Date().toISOString();
  return isNewVisitor;
}

function getPublicPayload(state, isNewVisitor = false) {
  const shared = isSharedCacheEnabled();
  return {
    uniqueVisitors: state.uniqueVisitors,
    totalHits: state.totalHits,
    isNewVisitor,
    lastUpdated: state.updatedAt,
    storageMode: shared ? 'shared-kv' : 'local-file',
    isApproximate: !shared && IS_PRODUCTION,
    privacySaltConfigured: Boolean(CONFIGURED_SALT),
  };
}

async function runSharedMutation(task) {
  const options = { ttlSeconds: 10, waitMs: 4500, pollMs: 120 };
  const first = await withCacheLock(SHARED_LOCK_KEY, task, options).catch(() => null);
  if (first !== null) return first;
  return await withCacheLock(SHARED_LOCK_KEY, task, { ...options, waitMs: 2500 }).catch(() => null);
}

export async function trackVisitorById(visitorId) {
  warnIfSaltMissing();

  const normalizedVisitorId = normalizeVisitorId(visitorId);
  if (!normalizedVisitorId) {
    throw new Error('Invalid visitor identifier');
  }

  const visitorHash = hashVisitorId(normalizedVisitorId);

  if (isSharedCacheEnabled()) {
    const payload = await runSharedMutation(async () => {
      const state = await readSharedState();
      const isNewVisitor = mutateState(state, visitorHash);
      await persistSharedState(state);
      return getPublicPayload(state, isNewVisitor);
    });

    if (payload) return payload;

    const sharedState = await readSharedState();
    return getPublicPayload(sharedState, false);
  }

  const state = await getLocalState();
  const isNewVisitor = mutateState(state, visitorHash);
  await persistLocalState(state);
  return getPublicPayload(state, isNewVisitor);
}

export async function getVisitorStats() {
  warnIfSaltMissing();

  if (isSharedCacheEnabled()) {
    const state = await readSharedState();
    return getPublicPayload(state, false);
  }

  const state = await getLocalState();
  return getPublicPayload(state, false);
}
