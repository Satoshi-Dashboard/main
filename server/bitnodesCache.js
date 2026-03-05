import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const CACHE_FILE = path.resolve(process.cwd(), 'bitnodes_cache.json');
const BITNODES_URL = 'https://bitnodes.io/api/v1/snapshots/latest/?field=sorted_asns';
const UPDATE_HOURS_UTC = [6, 18];

function aggregateCountryCounts(sortedAsns) {
  const map = new Map();

  if (!Array.isArray(sortedAsns)) return [];

  sortedAsns.forEach((row) => {
    if (!Array.isArray(row) || row.length < 4) return;
    const countryCode = String(row[0] || '').toUpperCase();
    const nodeCount = Number(row[3]);

    if (!countryCode || !Number.isFinite(nodeCount) || nodeCount < 0) return;
    map.set(countryCode, (map.get(countryCode) || 0) + nodeCount);
  });

  return [...map.entries()]
    .map(([country_code, nodes]) => ({ country_code, nodes }))
    .sort((a, b) => b.nodes - a.nodes);
}

export function getNextUpdateDate(fromDate = new Date()) {
  const startMs = fromDate.getTime();
  const y = fromDate.getUTCFullYear();
  const m = fromDate.getUTCMonth();
  const d = fromDate.getUTCDate();

  for (let dayOffset = 0; dayOffset <= 2; dayOffset += 1) {
    for (const hour of UPDATE_HOURS_UTC) {
      const candidate = new Date(Date.UTC(y, m, d + dayOffset, hour, 0, 0, 0));
      if (candidate.getTime() > startMs) return candidate;
    }
  }

  return new Date(Date.UTC(y, m, d + 1, UPDATE_HOURS_UTC[0], 0, 0, 0));
}

export async function readBitnodesCache() {
  try {
    const text = await readFile(CACHE_FILE, 'utf8');
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function pendingResponse(fromDate = new Date()) {
  return {
    status: 'pending',
    message: 'Data not yet available',
    next_update: getNextUpdateDate(fromDate).toISOString(),
  };
}

export async function refreshBitnodesCache() {
  const res = await fetch(BITNODES_URL, {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`Bitnodes request failed with HTTP ${res.status}`);
  }

  const bitnodesData = await res.json();
  const now = new Date();
  const countryCounts = aggregateCountryCounts(bitnodesData?.sorted_asns);

  const payload = {
    last_updated: now.toISOString(),
    next_update: getNextUpdateDate(now).toISOString(),
    country_counts: countryCounts,
    data: bitnodesData,
  };

  await writeFile(CACHE_FILE, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return payload;
}
