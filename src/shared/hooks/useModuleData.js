import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Generic data-fetch hook with polling, cleanup guard, and keep-previous-on-error.
 *
 * @param {() => Promise<any>} fetchFn  Stable async function (wrap with useCallback).
 * @param {object}             opts
 * @param {number}             [opts.refreshMs=0]            Polling interval in ms (0 = no poll).
 * @param {any}                [opts.initialData=null]        Initial state value.
 * @param {boolean}            [opts.keepPreviousOnError=true] Keep previous data on fetch error.
 * @param {(raw: any, prev: any) => any} [opts.transform]    Transform raw response before setState.
 *
 * @returns {{ data: any, loading: boolean, error: Error|null, refetch: () => void }}
 */
export function useModuleData(fetchFn, opts = {}) {
  const {
    refreshMs = 0,
    initialData = null,
    keepPreviousOnError = true,
    transform,
  } = opts;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
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

    setLoading(true);
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
