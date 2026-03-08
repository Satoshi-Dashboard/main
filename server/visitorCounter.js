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

function getPublicPayload(state, isNewVisitor = false) {
  return {
    uniqueVisitors: state.uniqueVisitors,
    totalHits: state.totalHits,
    isNewVisitor,
    lastUpdated: state.updatedAt,
  };
}

export async function trackVisitorById(visitorId) {
  const normalizedVisitorId = normalizeVisitorId(visitorId);
  if (!normalizedVisitorId) {
    throw new Error('Invalid visitor identifier');
  }

  const state = await getState();
  const visitorHash = hashVisitorId(normalizedVisitorId);

  state.totalHits += 1;

  const isNewVisitor = !state.seenVisitorHashes.has(visitorHash);
  if (isNewVisitor) {
    state.seenVisitorHashes.add(visitorHash);
    state.uniqueVisitors = state.seenVisitorHashes.size;
  }

  state.updatedAt = new Date().toISOString();
  await persistState(state);
  return getPublicPayload(state, isNewVisitor);
}

export async function getVisitorStats() {
  const state = await getState();
  return getPublicPayload(state, false);
}
