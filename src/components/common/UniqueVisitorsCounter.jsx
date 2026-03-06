import { useEffect, useState } from 'react';
import { RefreshCw, Users } from 'lucide-react';

const TRACKED_SESSION_KEY = 'satoshi-unique-visitor-tracked';

const formatVisitorCount = (value) => {
  if (!Number.isFinite(value) || value < 0) return '--';
  return Math.floor(value).toLocaleString('en-US');
};

export default function UniqueVisitorsCounter({ compact = false }) {
  const [visitorCount, setVisitorCount] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const fetchVisitorPayload = async (url) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    };

    const applyPayload = (payload) => {
      const uniqueVisitors = Number(payload?.uniqueVisitors);
      if (!isActive || !Number.isFinite(uniqueVisitors) || uniqueVisitors < 0) return;
      setVisitorCount(Math.floor(uniqueVisitors));
      setIsLoading(false);
    };

    const initCounter = async () => {
      try {
        const hasTracked = sessionStorage.getItem(TRACKED_SESSION_KEY) === '1';
        const endpoint = hasTracked ? '/api/visitors/stats' : '/api/visitors/track';
        const payload = await fetchVisitorPayload(endpoint);
        if (!hasTracked) {
          sessionStorage.setItem(TRACKED_SESSION_KEY, '1');
        }
        applyPayload(payload);
      } catch {
        if (isActive) setIsLoading(false);
      }
    };

    const refreshStats = async () => {
      try {
        const payload = await fetchVisitorPayload('/api/visitors/stats');
        applyPayload(payload);
      } catch {
        return;
      }
    };

    initCounter();
    const timer = setInterval(refreshStats, 30_000);

    return () => {
      isActive = false;
      clearInterval(timer);
    };
  }, []);

  if (compact) {
    return (
      <div className="bg-gray-800/40 rounded p-3 border border-[#F7931A]/30 text-center">
        <div className="mb-1 flex items-center justify-center gap-1 text-[10px] uppercase tracking-widest text-[#f4be7f]">
          <RefreshCw size={11} className="animate-spin text-[#F7931A]" />
          Unique Visits
        </div>
        <div className="font-mono font-bold tabular-nums text-yellow-50" style={{ fontSize: 'var(--fs-body)' }}>
          {isLoading ? '--' : formatVisitorCount(visitorCount)}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#F7931A]/35 bg-gradient-to-br from-[#F7931A]/12 to-[#F7931A]/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-[#f4be7f]">Unique Visitors</div>
          <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-yellow-50">
            {isLoading ? '--' : formatVisitorCount(visitorCount)}
          </div>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#F7931A]/40 bg-[#F7931A]/15">
          <Users size={18} className="text-[#F7931A]" />
        </div>
      </div>
    </div>
  );
}
