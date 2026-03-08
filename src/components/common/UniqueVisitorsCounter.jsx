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
      <div className="rounded p-3 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(247,147,26,0.3)' }}>
        <div className="mb-1 flex items-center justify-center gap-1 text-[11px] uppercase tracking-widest" style={{ color: 'var(--accent-bitcoin)' }}>
          <RefreshCw size={11} className="animate-spin" style={{ color: 'var(--accent-bitcoin)' }} />
          Unique Visits
        </div>
        <div className="font-mono font-bold tabular-nums" style={{ fontSize: 'var(--fs-body)', color: 'var(--text-primary)' }}>
          {isLoading ? '--' : displayValue}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg p-4" style={{ border: '1px solid rgba(247,147,26,0.35)', background: 'linear-gradient(135deg, rgba(247,147,26,0.12), rgba(247,147,26,0.05))' }}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--accent-bitcoin)' }}>Unique Visitors</div>
          <div className="mt-1 font-mono text-2xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
            {isLoading ? '--' : displayValue}
          </div>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ border: '1px solid rgba(247,147,26,0.4)', background: 'rgba(247,147,26,0.15)' }}>
          <Users size={18} style={{ color: 'var(--accent-bitcoin)' }} />
        </div>
      </div>
    </div>
  );
}
