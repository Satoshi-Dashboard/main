import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Users } from 'lucide-react';
import { fetchJson, postJson } from '../../lib/api.js';

const TRACKED_SESSION_KEY = 'satoshi-unique-visitor-tracked';
const VISITOR_ID_KEY = 'satoshi-visitor-id';

const formatVisitorCount = (value) => {
  if (!Number.isFinite(value) || value < 0) return '--';
  return Math.floor(value).toLocaleString('en-US');
};

export default function UniqueVisitorsCounter({ compact = false }) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['visitor-stats'],
    queryFn: () => fetchJson('/api/visitors/stats'),
    refetchInterval: 300_000,
    staleTime: 60_000,
  });

  useEffect(() => {
    const getVisitorId = () => {
      const existing = localStorage.getItem(VISITOR_ID_KEY);
      if (existing) return existing;

      const created = typeof globalThis.crypto?.randomUUID === 'function'
        ? globalThis.crypto.randomUUID().replace(/-/g, '')
        : `${Date.now()}${Math.random().toString(36).slice(2)}`;

      localStorage.setItem(VISITOR_ID_KEY, created);
      return created;
    };

    const initCounter = async () => {
      const hasTracked = Boolean(sessionStorage.getItem(TRACKED_SESSION_KEY));
      if (hasTracked) return;

      try {
        sessionStorage.setItem(TRACKED_SESSION_KEY, 'pending');
        await postJson('/api/visitors/track', { visitorId: getVisitorId() });
        sessionStorage.setItem(TRACKED_SESSION_KEY, '1');
        queryClient.invalidateQueries({ queryKey: ['visitor-stats'] });
      } catch {
        sessionStorage.removeItem(TRACKED_SESSION_KEY);
        return;
      }
    };

    initCounter();
  }, [queryClient]);

  const visitorCount = Number(data?.uniqueVisitors);
  const displayValue = Number.isFinite(visitorCount) ? formatVisitorCount(visitorCount) : '--';

  if (compact) {
    return (
      <div className="bg-gray-800/40 rounded p-3 border border-[#F7931A]/30 text-center">
        <div className="mb-1 flex items-center justify-center gap-1 text-[11px] uppercase tracking-widest text-[#f4be7f]">
          <RefreshCw size={11} className="animate-spin text-[#F7931A]" />
          Unique Visits
        </div>
        <div className="font-mono font-bold tabular-nums text-yellow-50" style={{ fontSize: 'var(--fs-body)' }}>
          {isLoading ? '--' : displayValue}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#F7931A]/35 bg-gradient-to-br from-[#F7931A]/12 to-[#F7931A]/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-[#f4be7f]">Unique Visitors</div>
          <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-yellow-50">
            {isLoading ? '--' : displayValue}
          </div>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#F7931A]/40 bg-[#F7931A]/15">
          <Users size={18} className="text-[#F7931A]" />
        </div>
      </div>
    </div>
  );
}
