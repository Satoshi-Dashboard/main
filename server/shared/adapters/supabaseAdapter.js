const SUPABASE_PROJECT_URL = String(process.env.SUPABASE_PROJECT_URL || process.env.SUPABASE_URL || '').trim().replace(/\/$/, '');
const SUPABASE_EDGE_FUNCTIONS_BASE_URL = SUPABASE_PROJECT_URL ? `${SUPABASE_PROJECT_URL}/functions/v1` : '';
const SUPABASE_FUNCTIONS_JWT = String(
  process.env.SUPABASE_FUNCTIONS_JWT
  || process.env.SUPABASE_ANON_KEY
  || '',
).trim();

export { SUPABASE_PROJECT_URL, SUPABASE_EDGE_FUNCTIONS_BASE_URL };

export function getSupabaseFunctionHeaders() {
  if (!SUPABASE_PROJECT_URL) {
    throw new Error('SUPABASE_PROJECT_URL is required for internal BTC queue functions');
  }

  if (!SUPABASE_FUNCTIONS_JWT) {
    throw new Error('SUPABASE_FUNCTIONS_JWT or SUPABASE_ANON_KEY is required for internal BTC queue functions');
  }

  return {
    Authorization: `Bearer ${SUPABASE_FUNCTIONS_JWT}`,
  };
}

export async function fetchSupabaseEdgeFunctionJson(functionName, { searchParams, timeoutMs } = {}) {
  const url = new URL(`${SUPABASE_EDGE_FUNCTIONS_BASE_URL}/${functionName}`);
  if (searchParams) {
    url.search = new URLSearchParams(searchParams).toString();
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs ?? 12_000);
  try {
    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...getSupabaseFunctionHeaders(),
      },
    });

    if (!response.ok) {
      throw new Error(`Upstream HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('Upstream request timeout');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
