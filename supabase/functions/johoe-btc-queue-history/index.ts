type JohoeRow = {
  snapshot_ts_unix: number | string;
  snapshot_ts: string;
  count_buckets: number[] | string;
  weight_buckets: number[] | string;
  fee_buckets: number[] | string;
  count_total: number | string;
  weight_total: number | string;
  fee_total: number | string;
  fetched_at?: string | null;
};

const TABLE_NAME = 'johoe_queue_24h_rolling';
const POLL_INTERVAL_MS = 60_000;
const STALE_AFTER_MS = 3 * 60_000;

function requiredEnv(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

function parseBucketArray(value: number[] | string): number[] {
  const parsed = Array.isArray(value) ? value : JSON.parse(String(value || '[]'));
  if (!Array.isArray(parsed)) {
    throw new Error('Invalid bucket payload');
  }
  return parsed.map((item) => Number(item));
}

function toPoint(row: JohoeRow) {
  return {
    snapshotTsUnix: Number(row.snapshot_ts_unix),
    snapshotTs: row.snapshot_ts,
    fetchedAt: row.fetched_at ?? null,
    timestamp: Number(row.snapshot_ts_unix),
    date: row.snapshot_ts,
    countTotal: Number(row.count_total),
    weightTotal: Number(row.weight_total),
    feeTotal: Number(row.fee_total),
    countBuckets: parseBucketArray(row.count_buckets),
    weightBuckets: parseBucketArray(row.weight_buckets),
    feeBuckets: parseBucketArray(row.fee_buckets),
  };
}

async function fetchAllRows(supabaseUrl: string, serviceRoleKey: string, table: string): Promise<JohoeRow[]> {
  const rows: JohoeRow[] = [];
  const pageSize = 1000;

  for (let offset = 0; offset < 5000; offset += pageSize) {
    const query = new URL(`${supabaseUrl}/rest/v1/${table}`);
    query.searchParams.set('select', 'snapshot_ts_unix,snapshot_ts,count_buckets,weight_buckets,fee_buckets,count_total,weight_total,fee_total,fetched_at');
    query.searchParams.set('order', 'snapshot_ts.asc');
    query.searchParams.set('limit', String(pageSize));
    query.searchParams.set('offset', String(offset));

    const response = await fetch(query.toString(), {
      headers: {
        Accept: 'application/json',
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`Failed to fetch history page: ${details}`);
    }

    const page = await response.json() as JohoeRow[];
    rows.push(...page);

    if (page.length < pageSize) {
      break;
    }
  }

  return rows;
}

function getLatestSnapshotTs(rows: JohoeRow[]): number | null {
  const latest = rows.at(-1)?.snapshot_ts;
  const timestamp = Date.parse(String(latest || ''));
  return Number.isFinite(timestamp) ? timestamp : null;
}

Deno.serve(async (req) => {
  if (req.method !== 'GET') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const url = new URL(req.url);
  const requestedRange = url.searchParams.get('range');
  if (requestedRange && requestedRange !== '24h') {
    return Response.json({ error: 'Invalid range. Only 24h is supported.' }, { status: 400 });
  }

  try {
    const supabaseUrl = requiredEnv('SUPABASE_URL');
    const serviceRoleKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
    const rows = await fetchAllRows(supabaseUrl, serviceRoleKey, TABLE_NAME);
    const fetchedAt = rows.at(-1)?.fetched_at ?? new Date().toISOString();
    const latestSnapshotTs = getLatestSnapshotTs(rows);
    const stale = !latestSnapshotTs || (Date.now() - latestSnapshotTs) > STALE_AFTER_MS;

    return Response.json({
      source: 'johoe',
      provider: 'supabase',
      network: 'btc',
      dataset: {
        label: '24h',
        resolution: '1m',
        rolling: true,
      },
      _meta: {
        pollIntervalMs: POLL_INTERVAL_MS,
        cachedAt: new Date().toISOString(),
        lastSuccessfulSyncAt: fetchedAt,
        latestSnapshotAt: rows.at(-1)?.snapshot_ts ?? null,
        stale,
      },
      points: rows.map(toPoint),
    });
  } catch (error) {
    return Response.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
});
