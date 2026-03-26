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

Deno.serve(async (req) => {
  if (req.method !== 'GET') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const supabaseUrl = requiredEnv('SUPABASE_URL');
    const serviceRoleKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
    const query = new URL(`${supabaseUrl}/rest/v1/johoe_queue_24h_rolling`);

    query.searchParams.set('select', 'snapshot_ts_unix,snapshot_ts,count_buckets,weight_buckets,fee_buckets,count_total,weight_total,fee_total,fetched_at');
    query.searchParams.set('order', 'snapshot_ts.desc');
    query.searchParams.set('limit', '1');

    const response = await fetch(query.toString(), {
      headers: {
        Accept: 'application/json',
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    });

    if (!response.ok) {
      const details = await response.text();
      return Response.json({ error: 'Failed to fetch latest point', details }, { status: 502 });
    }

    const rows = await response.json() as JohoeRow[];
    const row = rows[0];

    if (!row) {
      return Response.json({ error: 'No data available' }, { status: 404 });
    }

    return Response.json({
      ...toPoint(row),
      source: 'johoe',
      provider: 'supabase',
      network: 'btc',
      sourceRange: '24h',
      _meta: {
        resolution: '1m',
        pollIntervalMs: 60_000,
        cachedAt: new Date().toISOString(),
        lastSuccessfulSyncAt: row.fetched_at ?? new Date().toISOString(),
        stale: false,
      },
    });
  } catch (error) {
    return Response.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
});
