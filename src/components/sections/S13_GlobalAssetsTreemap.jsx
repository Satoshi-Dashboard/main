import { useCallback, useEffect, useMemo, useState } from 'react';
import { ResponsiveContainer, Treemap } from 'recharts';

const REFRESH_MS = 60 * 60 * 1000;

const ASSET_STYLE_BY_ID = {
  real_estate: { color: '#c4a882', textColor: '#111111', displayName: 'Real Estate' },
  bonds: { color: '#c8c8c0', textColor: '#111111', displayName: 'Bonds' },
  money: { color: '#9fca84', textColor: '#111111', displayName: 'Money' },
  equities: { color: '#6f95df', textColor: '#111111', displayName: 'Equities' },
  gold: { color: '#e8cc4b', textColor: '#111111', displayName: 'Gold' },
  collectibles: { color: '#b28be3', textColor: '#111111', displayName: 'Collectibles' },
  sp500: { color: '#5f85d8', textColor: '#ffffff', displayName: 'S&P 500' },
  bitcoin: { color: 'var(--accent-bitcoin)', textColor: '#ffffff', displayName: '₿' },
};

const LAYOUT_ORDER = [
  'bitcoin',
  'collectibles',
  'gold',
  'equities',
  'money',
  'bonds',
  'real_estate',
  'sp500',
];

const LAYOUT_INDEX = LAYOUT_ORDER.reduce((acc, id, idx) => {
  acc[id] = idx;
  return acc;
}, {});

function toDisplayAmount(size) {
  const n = Number(size);
  if (!Number.isFinite(n) || n <= 0) return '—';
  return `$${n.toFixed(2)}T`;
}

function toDisplayPercent(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return '—';
  return `${n.toFixed(2)}%`;
}

function toDisplayTime(value) {
  const dt = new Date(value);
  if (!Number.isFinite(dt.getTime())) return '—';
  return dt.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function normalizeAssetData(payload) {
  const rows = Array.isArray(payload?.data?.assets) ? payload.data.assets : [];

  return rows
    .map((row) => {
      const id = String(row?.id || '').trim();
      const size = Number(row?.value_trillions);
      if (!id || !Number.isFinite(size) || size <= 0) return null;

      const style = ASSET_STYLE_BY_ID[id] || {
        color: '#8d8d8d',
        textColor: '#111111',
        displayName: String(row?.name || id),
      };

      return {
        id,
        name: style.displayName,
        fullName: String(row?.name || style.displayName),
        size,
        pct_total: Number(row?.pct_total),
        rank: Number(row?.rank),
        color: style.color,
        textColor: style.textColor,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const ai = Number.isFinite(LAYOUT_INDEX[a.id]) ? LAYOUT_INDEX[a.id] : 999;
      const bi = Number.isFinite(LAYOUT_INDEX[b.id]) ? LAYOUT_INDEX[b.id] : 999;
      if (ai !== bi) return ai - bi;
      return b.size - a.size;
    });
}

function extractNodeId(node) {
  if (!node || typeof node !== 'object') return null;
  if (typeof node.id === 'string' && node.id) return node.id;
  if (typeof node?.payload?.id === 'string' && node.payload.id) return node.payload.id;
  if (typeof node?.root?.id === 'string' && node.root.id) return node.root.id;
  return null;
}

function AssetCell(props) {
  const {
    x,
    y,
    width,
    height,
    payload,
    index,
    data,
    name,
  } = props;

  const fallbackFromIndex = Array.isArray(data) && Number.isFinite(index) ? data[index] : null;
  const tile = payload && typeof payload === 'object' ? payload : fallbackFromIndex;
  if (!tile || !width || !height || width < 4 || height < 4) return null;

  const fs = Math.min(width / 7, height / 4, 15);
  const showValue = width > 55 && height > 40;
  const showName = width > 40 && height > 24;
  const fill = tile.color || '#8d8d8d';
  const textColor = tile.textColor || '#111111';

  return (
    <g>
      <rect
        x={x + 1}
        y={y + 1}
        width={Math.max(0, width - 2)}
        height={Math.max(0, height - 2)}
        fill={fill}
        stroke="rgba(17,17,17,0.8)"
        strokeWidth={2}
        rx={3}
      />

      {showName && (
        <text
          x={x + width / 2}
          y={y + height / 2 - (showValue ? fs * 0.8 : 0)}
          textAnchor="middle"
          fill={textColor}
          fontSize={Math.max(8, fs)}
          fontFamily="monospace"
          fontWeight="600"
        >
          {tile.name || name}
        </text>
      )}

      {showValue && (
        <text
          x={x + width / 2}
          y={y + height / 2 + fs * 0.9}
          textAnchor="middle"
          fill={textColor}
          fontSize={Math.max(7, fs * 0.85)}
          fontFamily="monospace"
        >
          {toDisplayAmount(tile.size)}
        </text>
      )}
    </g>
  );
}

export default function S13_GlobalAssetsTreemap() {
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/s13/global-assets', { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const next = await response.json();
      setPayload(next);
      setError(null);
    } catch {
      if (!payload) {
        setError('Global asset values are temporarily unavailable.');
      }
    } finally {
      setLoading(false);
    }
  }, [payload]);

  useEffect(() => {
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  const treemapData = useMemo(() => normalizeAssetData(payload), [payload]);

  useEffect(() => {
    if (!treemapData.length) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !treemapData.some((item) => item.id === selectedId)) {
      setSelectedId(treemapData[0].id);
    }
  }, [treemapData, selectedId]);

  const selectedAsset = useMemo(
    () => treemapData.find((asset) => asset.id === selectedId) || treemapData[0] || null,
    [treemapData, selectedId],
  );

  return (
    <div className="flex h-full w-full flex-col bg-[var(--bg-primary)]">
      <div className="flex-none px-4 pb-2 pt-4 sm:px-6 sm:pt-5 lg:px-8">
        <h1
          className="text-center font-mono"
          style={{
            color: 'var(--accent-bitcoin)',
            fontSize: 'var(--fs-subtitle)',
            fontWeight: 700,
          }}
        >
          Total Global Assets
        </h1>
      </div>

      <div className="min-h-0 flex-1 px-2 pb-2 sm:px-4 sm:pb-4 lg:px-5 lg:pb-5">
        <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto_auto] gap-2 sm:gap-3">
          {loading ? (
            <div className="skeleton min-h-[280px] rounded-md" />
          ) : treemapData.length > 0 ? (
            <div className="min-h-[280px] overflow-hidden rounded-md border border-white/10 bg-[var(--bg-card)] sm:min-h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <Treemap
                  data={treemapData}
                  dataKey="size"
                  nameKey="name"
                  content={(props) => <AssetCell {...props} data={treemapData} />}
                  type="flat"
                  aspectRatio={1.85}
                  isAnimationActive={false}
                  onClick={(node) => {
                    const id = extractNodeId(node);
                    if (id) setSelectedId(id);
                  }}
                  onMouseMove={(node) => {
                    const id = extractNodeId(node);
                    if (id) setSelectedId(id);
                  }}
                />
              </ResponsiveContainer>
            </div>
          ) : (
            <div
              className="flex min-h-[280px] items-center justify-center rounded-md border border-white/10 bg-[var(--bg-card)] font-mono text-[var(--text-secondary)]"
              style={{ fontSize: 'var(--fs-body)' }}
            >
              {error || 'No global asset values available.'}
            </div>
          )}

          <div className="rounded-md border border-white/10 bg-[var(--bg-card)] px-3 py-2 font-mono sm:px-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-[var(--text-primary)]" style={{ fontSize: 'var(--fs-heading)' }}>
                  {selectedAsset?.fullName || 'Asset'}
                </div>
                <div className="text-[var(--text-secondary)]" style={{ fontSize: 'var(--fs-caption)' }}>
                  Rank #{Number.isFinite(selectedAsset?.rank) ? selectedAsset.rank : '—'}
                </div>
              </div>

              <div className="text-right">
                <div className="text-[var(--text-primary)] tabular-nums" style={{ fontSize: 'var(--fs-section)' }}>
                  {toDisplayAmount(selectedAsset?.size)}
                </div>
                <div className="text-[var(--text-secondary)] tabular-nums" style={{ fontSize: 'var(--fs-caption)' }}>
                  {toDisplayPercent(selectedAsset?.pct_total)} of total
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-md border border-white/10 bg-[var(--bg-card)] px-2 py-2 sm:px-3">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {treemapData.map((asset) => {
                const selected = selectedAsset?.id === asset.id;
                return (
                  <button
                    key={asset.id}
                    type="button"
                    className="shrink-0 rounded border px-2 py-1 font-mono transition-colors"
                    onClick={() => setSelectedId(asset.id)}
                    style={{
                      fontSize: 'var(--fs-caption)',
                      borderColor: selected ? 'var(--accent-bitcoin)' : 'rgba(255,255,255,0.18)',
                      color: selected ? 'var(--accent-bitcoin)' : 'var(--text-secondary)',
                      background: selected ? 'rgba(247,147,26,0.1)' : 'transparent',
                    }}
                  >
                    {asset.name} {toDisplayAmount(asset.size)}
                  </button>
                );
              })}
            </div>

            <div className="mt-1 text-right font-mono text-[var(--text-tertiary)]" style={{ fontSize: 'var(--fs-micro)' }}>
              src: Newhedge API · update: 1h
              {payload?.updated_at ? ` · last ${toDisplayTime(payload.updated_at)}` : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
