import { useCallback, useEffect, useRef, useState } from 'react';
import { getModuleData } from '@/shared/stores/bootstrapStore.js';

/**
 * Generic data-fetch hook with polling, cleanup guard, keep-previous-on-error,
 * and optional bootstrap hydration for instant first paint.
 *
 * @param {() => Promise<any>} fetchFn  Stable async function (wrap with useCallback).
 * @param {object}             opts
 * @param {number}             [opts.refreshMs=0]            Polling interval in ms (0 = no poll).
 * @param {any}                [opts.initialData=null]        Initial state value.
 * @param {boolean}            [opts.keepPreviousOnError=true] Keep previous data on fetch error.
 * @param {(raw: any, prev: any) => any} [opts.transform]    Transform raw response before setState.
 * @param {string}             [opts.bootstrapKey]            Registry key from bootstrapSnapshot.js.
 *                                                            When set, the hook seeds its initial data
 *                                                            from the bootstrap cache so the module
 *                                                            renders instantly without a loading state.
 * @param {(raw: any) => any}  [opts.bootstrapTransform]      Optional transform applied ONLY to the
 *                                                            bootstrap snapshot data before it becomes
 *                                                            the initial state. Use when the Redis cache
 *                                                            shape differs from what fetchFn returns
 *                                                            (e.g. btcRates raw → { usd, change24h }).
 *                                                            If the transform returns null/undefined the
 *                                                            hook falls back to initialData.
 *
 * @returns {{ data: any, loading: boolean, error: Error|null, refetch: () => void }}
 */
export function useModuleData(fetchFn, opts = {}) {
  const {
    refreshMs = 0,
    initialData = null,
    keepPreviousOnError = true,
    transform,
    bootstrapKey,
    bootstrapTransform,
  } = opts;

  // Resolve initial data: bootstrap snapshot > explicit initialData > null
  const bootstrapRaw = bootstrapKey ? getModuleData(bootstrapKey) : null;
  const bootstrapData = (bootstrapRaw != null && typeof bootstrapTransform === 'function')
    ? bootstrapTransform(bootstrapRaw)
    : bootstrapRaw;
  const effectiveInitial = bootstrapData ?? initialData;

  const [data, setData] = useState(effectiveInitial);
  const [loading, setLoading] = useState(effectiveInitial == null);
  const [error, setError] = useState(null);

  // Keep latest transform in a ref so callers don't need to memoize it
  const transformRef = useRef(transform);
  transformRef.current = transform;

  const fetchRef = useRef(fetchFn);
  fetchRef.current = fetchFn;

  const load = useCallback(async (active) => {
    try {
      const raw = await fetchRef.current();
      if (!active.current) return;

      setData((prev) => {
        if (typeof transformRef.current === 'function') {
          return transformRef.current(raw, prev);
        }
        return raw;
      });
      setError(null);
    } catch (err) {
      if (!active.current) return;
      setError(err);
      if (!keepPreviousOnError) setData(null);
    } finally {
      if (active.current) setLoading(false);
    }
  }, [keepPreviousOnError]);

  useEffect(() => {
    const active = { current: true };

    load(active);

    let timer;
    if (refreshMs > 0) {
      timer = setInterval(() => load(active), refreshMs);
    }

    return () => {
      active.current = false;
      if (timer) clearInterval(timer);
    };
  }, [load, refreshMs]);

  const refetch = useCallback(() => {
    const active = { current: true };
    load(active);
    // Note: this creates a one-shot fetch; the active flag is not
    // tied to the component lifecycle, but since we only set state
    // when active.current is true and we never set it to false here,
    // it works correctly for manual triggers.
  }, [load]);

  return { data, loading, error, refetch };
}
