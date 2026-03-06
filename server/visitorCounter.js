import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const COUNTER_FILE = path.resolve(process.cwd(), 'visitor_counter.json');
const HASH_SALT = String(process.env.VISITOR_COUNTER_SALT || 'satoshi-dashboard');

let statePromise;
let writeQueue = Promise.resolve();

function getDefaultState() {
  const now = new Date().toISOString();
  return {
    uniqueVisitors: 0,
    totalHits: 0,
    createdAt: now,
    updatedAt: now,
    seenIpHashes: new Set(),
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

  const seenIpHashes = new Set(
    Array.isArray(raw.seenIpHashes)
      ? raw.seenIpHashes.filter((value) => typeof value === 'string' && value.length > 0)
      : [],
  );

  const uniqueFromFile = parseNumber(raw.uniqueVisitors, 0);
  const uniqueVisitors = Math.max(uniqueFromFile, seenIpHashes.size);
  const totalHits = Math.max(parseNumber(raw.totalHits, uniqueVisitors), uniqueVisitors);

  return {
    uniqueVisitors,
    totalHits,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : fallback.createdAt,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : fallback.updatedAt,
    seenIpHashes,
  };
}

function toStoredState(state) {
  return {
    uniqueVisitors: state.uniqueVisitors,
    totalHits: state.totalHits,
    createdAt: state.createdAt,
    updatedAt: state.updatedAt,
    seenIpHashes: [...state.seenIpHashes],
  };
}

async function loadState() {
  try {
    const text = await readFile(COUNTER_FILE, 'utf8');
    return toRuntimeState(JSON.parse(text));
  } catch {
    return getDefaultState();
  }
}

async function getState() {
  if (!statePromise) {
    statePromise = loadState();
  }
  return statePromise;
}

async function persistState(state) {
  const payload = `${JSON.stringify(toStoredState(state), null, 2)}\n`;
  writeQueue = writeQueue
    .catch(() => undefined)
    .then(() => writeFile(COUNTER_FILE, payload, 'utf8'))
    .catch(() => undefined);
  await writeQueue;
}

function normalizeIp(value) {
  const raw = String(value || '').trim();
  if (!raw) return 'unknown';

  const first = raw.split(',')[0].trim();
  if (!first) return 'unknown';
  if (first === '::1') return '127.0.0.1';
  if (first.startsWith('::ffff:')) return first.slice(7);
  return first;
}

function hashIp(ip) {
  return createHash('sha256').update(`${HASH_SALT}:${ip}`).digest('hex');
}

function getPublicPayload(state, isNewVisitor = false) {
  return {
    uniqueVisitors: state.uniqueVisitors,
    totalHits: state.totalHits,
    isNewVisitor,
    lastUpdated: state.updatedAt,
  };
}

export function extractClientIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return normalizeIp(forwardedFor);
  }
  if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    return normalizeIp(forwardedFor[0]);
  }

  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) {
    return normalizeIp(realIp);
  }
  if (Array.isArray(realIp) && realIp.length > 0) {
    return normalizeIp(realIp[0]);
  }

  return normalizeIp(req.socket?.remoteAddress || req.ip);
}

export async function trackVisitorByIp(ip) {
  const state = await getState();
  const normalizedIp = normalizeIp(ip);
  const ipHash = hashIp(normalizedIp);

  state.totalHits += 1;

  const isNewVisitor = !state.seenIpHashes.has(ipHash);
  if (isNewVisitor) {
    state.seenIpHashes.add(ipHash);
    state.uniqueVisitors = state.seenIpHashes.size;
  }

  state.updatedAt = new Date().toISOString();
  await persistState(state);
  return getPublicPayload(state, isNewVisitor);
}

export async function getVisitorStats() {
  const state = await getState();
  return getPublicPayload(state, false);
}
