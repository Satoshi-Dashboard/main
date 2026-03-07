import { useCallback, useEffect, useMemo, useState } from 'react';

const REFRESH_MS = 60 * 60 * 1000;

const ASSET_STYLE_BY_ID = {
  real_estate:  { color: '#c4a882', displayName: 'Real Estate' },
  bonds:        { color: '#c8c8c0', displayName: 'Bonds' },
  money:        { color: '#9fca84', displayName: 'Money' },
  equities:     { color: '#6f95df', displayName: 'Equities' },
  gold:         { color: '#e8cc4b', displayName: 'Gold' },
  collectibles: { color: '#b28be3', displayName: 'Collectibles' },
  sp500:        { color: '#FF4757', displayName: 'S&P 500' },
  bitcoin:      { color: '#F7931A', displayName: 'Bitcoin' },
};


function toDisplayAmount(size) {
  const n = Number(size);
  if (!Number.isFinite(n) || n <= 0) return '—';
  return `$${n.toFixed(2)}T`;
}

function normalizeAssetData(payload) {
  const rows = Array.isArray(payload?.data?.assets) ? payload.data.assets : [];
  const items = rows
    .map((row) => {
      const id = String(row?.id || '').trim();
      const size = Number(row?.value_trillions);
      if (!id || !Number.isFinite(size) || size <= 0) return null;
      const style = ASSET_STYLE_BY_ID[id] || { color: '#8d8d8d', displayName: String(row?.name || id) };
      return {
        id,
        name: style.displayName,
        fullName: String(row?.name || style.displayName),
        size,
        pct_total: Number(row?.pct_total),
        rank: Number(row?.rank),
        color: style.color,
      };
    })
    .filter(Boolean)
    // Sort by real % descending: highest market share → first card / leftmost bar segment
    .sort((a, b) => b.pct_total - a.pct_total);

  const totalSize = items.reduce((s, d) => s + d.size, 0);
  const minDisplay = totalSize * 0.03;
  return items.map(item => ({ ...item, displaySize: Math.max(item.size, minDisplay) }));
}

/* ── Proportional stacked bar — widths driven by real pct_total ── */
function StackedBar({ data }) {
  const [hovered, setHovered] = useState(null); // { id, name, pct, color, x }
  const totalPct = data.reduce((s, d) => s + (Number.isFinite(d.pct_total) ? d.pct_total : 0), 0) || 100;

  // 1% visual minimum per segment, then re-normalize so all widths still sum to 100%
  const MIN_VIS = 1; // percent
  const rawSegs = data.map(asset => {
    const pct = Number.isFinite(asset.pct_total) ? asset.pct_total : 0;
    return { asset, pct, visW: Math.max((pct / totalPct) * 100, MIN_VIS) };
  });
  const totalVisW = rawSegs.reduce((s, r) => s + r.visW, 0);
  const segments = rawSegs.map(r => ({ ...r, normW: (r.visW / totalVisW) * 100 }));

  return (
    <div className="relative">
      <div className="flex w-full overflow-hidden rounded-lg border border-white/10 h-7 sm:h-8">
        {segments.map(({ asset, pct, normW }) => (
          <div
            key={asset.id}
            style={{
              width: `${normW}%`,
              background: asset.color,
              cursor: 'default',
              opacity: hovered && hovered.id !== asset.id ? 0.55 : 1,
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={(e) => {
              const rect = e.currentTarget.parentElement.getBoundingClientRect();
              const x = e.currentTarget.getBoundingClientRect().left - rect.left;
              setHovered({ id: asset.id, name: asset.name, pct, color: asset.color, x });
            }}
            onMouseLeave={() => setHovered(null)}
            onTouchStart={(e) => {
              const rect = e.currentTarget.parentElement.getBoundingClientRect();
              const x = e.currentTarget.getBoundingClientRect().left - rect.left;
              setHovered({ id: asset.id, name: asset.name, pct, color: asset.color, x });
            }}
            onTouchEnd={() => setTimeout(() => setHovered(null), 1500)}
          />
        ))}
      </div>

      {/* tooltip — rendered BELOW the bar so it never clips off-screen on mobile */}
      {hovered && (
        <div
          className="pointer-events-none absolute z-20 top-full mt-1 flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-white shadow-lg"
          style={{
            left: `clamp(0px, ${hovered.x}px, calc(100% - 120px))`,
            background: 'rgba(15,15,15,0.95)',
            border: `1px solid ${hovered.color}60`,
            fontSize: 11,
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: 2, background: hovered.color, display: 'inline-block', flexShrink: 0 }} />
          <span style={{ color: 'rgba(255,255,255,0.75)' }}>{hovered.name}</span>
          <span style={{ color: hovered.color, fontWeight: 700 }}>{hovered.pct.toFixed(2)}%</span>
        </div>
      )}
    </div>
  );
}

/* ── Asset card ───────────────────────────────────────────────── */
function AssetCard({ asset }) {
  const isBtc  = asset.id === 'bitcoin';
  const accent = asset.color;

  return (
    <div
      className="flex flex-col overflow-hidden rounded-xl bg-[#111111] transition-colors hover:bg-[#161616] h-[148px] sm:h-[190px] lg:h-auto"
      style={{ border: `1px solid ${accent}33` }}
    >
      {/* top color stripe */}
      <div style={{ height: 3, background: accent, flexShrink: 0 }} />

      <div className="flex flex-1 flex-col px-3 py-2 sm:px-4 sm:py-3">

        {/* top group: name + value + btc price */}
        <div className="flex flex-col gap-1">
          {/* name */}
          <div
            className="font-mono font-bold leading-tight text-white"
            style={{ fontSize: 'clamp(12px, 1.4vw, 15px)' }}
          >
            {isBtc ? '₿ Bitcoin' : asset.name}
          </div>

          {/* value — main metric, large */}
          <div
            className="font-mono font-bold tabular-nums leading-tight"
            style={{ fontSize: 'clamp(15px, 2vw, 22px)', color: accent }}
          >
            {toDisplayAmount(asset.size)}
          </div>

        </div>

        {/* bottom group — pushed to card bottom */}
        <div className="mt-auto flex flex-col gap-0.5 pt-1">
          {/* full name (dimmed) */}
          <div
            className="font-mono leading-tight text-white/35 truncate"
            style={{ fontSize: 'clamp(9px, 0.9vw, 11px)' }}
            title={asset.fullName}
          >
            {asset.fullName}
          </div>

          {/* % and rank row */}
          <div className="flex items-center justify-between gap-2">
            <span
              className="font-mono tabular-nums text-white/60"
              style={{ fontSize: 'clamp(11px, 1.1vw, 13px)' }}
            >
              {Number.isFinite(asset.pct_total) ? `${asset.pct_total.toFixed(2)}%` : '—'}
            </span>
            <span
              className="font-mono text-white/50"
              style={{
                fontSize: 'clamp(10px, 1vw, 12px)',
                background: `${accent}18`,
                border: `1px solid ${accent}40`,
                borderRadius: 5,
                padding: '1px 6px',
              }}
            >
              #{Number.isFinite(asset.rank) ? asset.rank : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────── */
export default function S13_GlobalAssetsTreemap() {
  const [payload,  setPayload]  = useState(null);
  const [error,    setError]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/s13/global-assets', { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setPayload(await response.json());
      setError(null);
    } catch {
      if (!payload) setError('Global asset values are temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  }, [payload]);

  useEffect(() => {
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  const assetData = useMemo(() => normalizeAssetData(payload), [payload]);

  return (
    <div className="flex h-full w-full flex-col bg-[#111111] p-2 sm:p-3 lg:p-4">
      {loading ? (
        <div className="skeleton h-full w-full rounded-md" />
      ) : assetData.length > 0 ? (
        <div className="flex h-full flex-col gap-2 sm:gap-3">
          {/* title */}
          <div className="font-mono font-bold tracking-wide text-white/70" style={{ fontSize: 'clamp(11px, 1.1vw, 13px)' }}>
            Total Global Asset Values
          </div>

          {/* proportional stacked bar */}
          <StackedBar data={assetData} />

          {/* card grid:
              mobile  → 2 cols × 4 rows
              sm/md   → 4 cols × 2 rows
              lg+     → 4 cols × 2 rows (cards grow to fill height)   */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3 lg:flex-1 lg:grid-rows-2">
            {assetData.map(asset => (
              <AssetCard key={asset.id} asset={asset} />
            ))}
          </div>
        </div>
      ) : (
        <div
          className="flex h-full items-center justify-center rounded-md border border-white/10 font-mono text-[var(--text-secondary)]"
          style={{ fontSize: 'var(--fs-body)' }}
        >
          {error || 'No global asset values available.'}
        </div>
      )}
    </div>
  );
}
