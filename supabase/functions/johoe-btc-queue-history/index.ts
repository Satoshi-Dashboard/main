type RangeKey = '24h' | '30d' | 'all';

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

const TABLE_BY_RANGE: Record<RangeKey, string> = {
  '24h': 'johoe_queue_24h_rolling',
  '30d': 'johoe_queue_30d_rolling',
  all: 'johoe_queue_all_daily',
};

const DATASET_META: Record<RangeKey, { label: string; resolution: string; rolling: boolean; pollIntervalMs: number }> = {
  '24h': { label: '24h', resolution: '1m', rolling: true, pollIntervalMs: 60_000 },
  '30d': { label: '30d', resolution: '30m', rolling: true, pollIntervalMs: 15 * 60_000 },
  all: { label: 'all', resolution: '1d', rolling: false, pollIntervalMs: 6 * 60 * 60_000 },
};

function getRange(value: string | null): RangeKey {
  if (value === '30d' || value === 'all') return value;
  return '24h';
}

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

Deno.serve(async (req) => {
  if (req.method !== 'GET') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const url = new URL(req.url);
  const range = getRange(url.searchParams.get('range'));
  const table = TABLE_BY_RANGE[range];
  const meta = DATASET_META[range];

  try {
    const supabaseUrl = requiredEnv('SUPABASE_URL');
    const serviceRoleKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
    const rows = await fetchAllRows(supabaseUrl, serviceRoleKey, table);
    const fetchedAt = rows.at(-1)?.fetched_at ?? new Date().toISOString();

    return Response.json({
      source: 'johoe',
      provider: 'supabase',
      network: 'btc',
      dataset: {
        label: meta.label,
        resolution: meta.resolution,
        rolling: meta.rolling,
      },
      _meta: {
        pollIntervalMs: meta.pollIntervalMs,
        cachedAt: new Date().toISOString(),
        lastSuccessfulSyncAt: fetchedAt,
        stale: false,
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
