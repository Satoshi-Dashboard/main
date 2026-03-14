import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchJson } from '@/shared/lib/api.js';
import { fetchMempoolOverviewBundle } from '@/shared/services/mempoolApi.js';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery.js';
import { useWindowWidth } from '@/shared/hooks/useWindowWidth.js';
import { formatMetaTimestamp } from '@/shared/utils/formatters.js';

const UI_COLORS = {
  brand: 'var(--accent-bitcoin)',
  positive: 'var(--accent-green)',
  warning: 'var(--accent-warning)',
};

const FEE_SCALE = [
  { max: 2, color: '#00FFCC', label: '<2' },
  { max: 10, color: '#00FF88', label: '2-10' },
  { max: 50, color: '#FFD700', label: '10-50' },
  { max: Number.POSITIVE_INFINITY, color: '#FF8C00', label: '>50' },
];

function feeColor(satVb) {
  return FEE_SCALE.find((step) => satVb < step.max)?.color ?? '#FF8C00';
}

/* ─── Binary treemap (recursive halving) ──────────────────── */
function binaryTreemap(items, x, y, w, h) {
  if (!items.length) return [];
  if (items.length === 1) return [{ ...items[0], x, y, w, h }];
  const total = items.reduce((s, t) => s + t.size, 0);
  let acc = 0, split = 1;
  for (let i = 0; i < items.length - 1; i++) {
    acc += items[i].size;
    split = i + 1;
    if (acc >= total * 0.5) break;
  }
  const a = items.slice(0, split);
  const b = items.slice(split);
  const ratio = a.reduce((s, t) => s + t.size, 0) / total;
  if (w >= h) {
    const aw = w * ratio;
    return [...binaryTreemap(a, x, y, aw, h), ...binaryTreemap(b, x + aw, y, w - aw, h)];
  }
  const ah = h * ratio;
  return [...binaryTreemap(a, x, y, w, ah), ...binaryTreemap(b, x, y + ah, w, h - ah)];
}

/* ─── Generate representative txs from fee histogram ──────── */
function genTxs(feeRange, txCount, blockSize) {
  const fr = feeRange?.length ? [...feeRange].sort((a, b) => a - b) : [1, 1, 2, 5];
  const count = Math.min(160, txCount || 100);
  const avgSz = Math.max(150, (blockSize || 1_000_000) / (txCount || 2000));
  return Array.from({ length: count }, (_, i) => {
    const pct  = i / count;
    const lo   = Math.min(Math.floor(pct * (fr.length - 1)), fr.length - 2);
    const t    = pct * (fr.length - 1) - lo;
    const rate = fr[lo] + t * (fr[lo + 1] - fr[lo]);
    const size = Math.max(100, avgSz * (0.5 + Math.random()));
    return { size, color: feeColor(Math.max(0, rate)) };
  }).sort((a, b) => b.size - a.size);
}

/* ─── Draw treemap onto canvas ─────────────────────────────── */
function drawTreemap(canvas, txs) {
  if (!canvas || !txs.length) return;
  const ctx = canvas.getContext('2d');
  const { width: W, height: H } = canvas;
  ctx.fillStyle = '#141414';
  ctx.fillRect(0, 0, W, H);
  for (const r of binaryTreemap(txs, 0, 0, W, H)) {
    ctx.fillStyle = r.color;
    ctx.fillRect(r.x + 1, r.y + 1, Math.max(1, r.w - 2), Math.max(1, r.h - 2));
  }
}

/* ─── BlockCanvas ──────────────────────────────────────────── */
const BASE_SIDE = 170;

function BlockCanvas({ block, selected, onClick, onDoubleClick, side }) {
  const ref  = useRef(null);
  const txs  = genTxs(block.extras?.feeRange, block.tx_count, block.size);
  useEffect(() => { drawTreemap(ref.current, txs); }, [txs, side]);

  const med  = block.extras?.medianFee;
  const pool = block.extras?.pool?.name ?? '—';
  const sc   = side / BASE_SIDE; // proportional scale for text

  return (
    <div
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className="relative flex-shrink-0 cursor-pointer overflow-hidden rounded transition-all duration-150"
      style={{
        width: side,
        height: side,
        border: selected ? `2px solid ${UI_COLORS.brand}` : '1px solid #2a2a2a',
      }}
    >
      <canvas className="visual-canvas-surface" ref={ref} width={side} height={side} style={{ display: 'block' }} />

      {/* height */}
      <div
        className="absolute top-1 left-1 bg-black/75 rounded px-1.5 py-px font-mono text-white/80"
        style={{ fontSize: Math.max(11, Math.round(10 * sc)) }}
      >
        #{block.height}
      </div>
      {/* pool */}
      <div
        className="absolute top-1 right-1 bg-black/70 rounded px-1 py-px font-mono text-white/40 truncate"
        style={{ fontSize: Math.max(11, Math.round(8 * sc)), maxWidth: Math.round(68 * sc) }}
      >
        {pool}
      </div>
      {/* median fee */}
      {med != null && (
        <div
          className="absolute bottom-1 right-1 rounded px-1.5 py-px font-mono font-bold"
          style={{
            background: 'rgba(0,0,0,0.75)',
            color: feeColor(med),
            fontSize: Math.max(11, Math.round(10 * sc)),
          }}
        >
          {med.toFixed(1)} s/vB
        </div>
      )}
      {/* tx count */}
      <div
        className="absolute bottom-1 left-1 bg-black/70 rounded px-1 py-px font-mono text-white/35"
        style={{ fontSize: Math.max(11, Math.round(8 * sc)) }}
      >
        {block.tx_count?.toLocaleString()} tx
      </div>
    </div>
  );
}

/* ─── Mempool block chip ───────────────────────────────────── */
function MempoolChip({ block, idx, chipW }) {
  const fr  = block.feeRange ?? [];
  const lo  = fr[0]?.toFixed(0) ?? '?';
  const hi  = fr[fr.length - 1]?.toFixed(0) ?? '?';
  const med = block.medianFee ?? 1;
  const pct = Math.min(100, ((block.blockVSize ?? 0) / 1_000_000) * 100);
  const col = feeColor(med);
  const sc  = chipW / 72;

  return (
    <div
      onDoubleClick={() => window.open(`https://mempool.space/mempool-block/${idx}`, '_blank')}
      className="flex-shrink-0 flex flex-col items-center gap-1 rounded border border-[#252525] cursor-pointer"
      style={{ width: chipW, paddingTop: Math.round(6 * sc), paddingBottom: Math.round(8 * sc), paddingLeft: Math.round(8 * sc), paddingRight: Math.round(8 * sc) }}
    >
      <span className="font-mono text-white/30" style={{ fontSize: Math.max(11, Math.round(9 * sc)) }}>
        {idx === 0 ? 'NEXT' : `+${idx}`}
      </span>
      {/* fill bar */}
      <div className="relative w-full bg-[#1a1a1a] rounded overflow-hidden" style={{ height: Math.round(34 * sc) }}>
        <div
          className="absolute bottom-0 left-0 right-0 rounded"
          style={{ height: `${pct}%`, background: col, opacity: 0.75 }}
        />
      </div>
      <span className="font-mono font-bold" style={{ color: col, fontSize: Math.max(11, Math.round(9 * sc)) }}>
        {lo}–{hi}
      </span>
      <span className="font-mono text-white/30" style={{ fontSize: Math.max(11, Math.round(8 * sc)) }}>
        {(block.nTx ?? 0).toLocaleString()} tx
      </span>
    </div>
  );
}

/* ─── Block detail panel ───────────────────────────────────── */
function DetailPanel({ block, onClose, className = '' }) {
  const e = block.extras ?? {};
  const rows = [
    ['Height',     `#${block.height}`],
    ['Miner',      e.pool?.name ?? '—'],
    ['Txs',        block.tx_count?.toLocaleString()],
    ['Size',       block.size     ? `${(block.size    / 1e6).toFixed(2)} MB`  : '—'],
    ['Weight',     block.weight   ? `${(block.weight  / 1e6).toFixed(2)} MWU` : '—'],
    ['Reward',     e.reward       ? `₿${(e.reward     / 1e8).toFixed(4)}`     : '—'],
    ['Total fees', e.totalFees    ? `₿${(e.totalFees  / 1e8).toFixed(4)}`     : '—'],
    ['Avg fee',    e.avgFeeRate   ? `${Number(e.avgFeeRate).toFixed(1)} s/vB`  : '—'],
    ['Median fee', e.medianFee    ? `${Number(e.medianFee).toFixed(2)} s/vB`   : '—'],
    ['Time',       block.timestamp ? new Date(block.timestamp * 1000).toLocaleTimeString() : '—'],
  ];

  return (
    <div className={`flex flex-col gap-1.5 rounded-lg bg-[#0d0d0d]/95 p-3 ${className}`} style={{ border: `1px solid ${UI_COLORS.brand}4d` }}>
      <div className="flex justify-between items-center mb-0.5">
        <span className="font-mono font-bold text-[11px] tracking-widest uppercase" style={{ color: UI_COLORS.brand }}>
          Block Detail
        </span>
        <button type="button" onClick={onClose} className="inline-flex min-h-[32px] min-w-[32px] items-center justify-center rounded-full text-sm text-white/30 transition hover:bg-white/6 hover:text-white/70">✕</button>
      </div>
      <div className="border-t border-[#1c1c1c]" />
      {rows.map(([label, val]) => (
        <div key={label} className="flex justify-between items-baseline gap-2">
          <span className="text-[12px] font-mono text-white/30 uppercase tracking-wide flex-shrink-0">{label}</span>
          <span className="text-[12px] font-mono text-white text-right truncate">{val}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Fee legend ───────────────────────────────────────────── */
function FeeLegend() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {FEE_SCALE.map(({ color, label }) => (
        <div key={label} className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: color }} />
          <span className="text-[12px] font-mono text-white/30">{label}</span>
        </div>
      ))}
      <span className="text-[12px] font-mono text-white/20">s/vB</span>
    </div>
  );
}

/* ─── Main export ──────────────────────────────────────────── */
export default function S05_LongTermTrend() {
  const [blocks,        setBlocks]        = useState([]);
  const [mempoolBlocks, setMempoolBlocks] = useState([]);
  const [fees,          setFees]          = useState(null);
  const [selected,      setSelected]      = useState(null);
  const [wsStatus,      setWsStatus]      = useState('connecting');
  const [side,          setSide]          = useState(BASE_SIDE);
  const viewportWidth = useWindowWidth();
  const [lastUpdatedAt, setLastUpdatedAt] = useState(() => new Date());
  const showDesktopOverlay = useMediaQuery('(min-width: 1024px)');
  const scrollRef    = useRef(null);

  /* Responsive block size via ResizeObserver */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      const { height, width } = entry.contentRect;
      const isCompact = width < 640;
      const n = isCompact ? 2 : width >= 1500 ? 6 : width >= 1200 ? 5 : width >= 900 ? 4 : 3;
      const rows = isCompact ? 2 : 1;
      const gap = 8;
      const fromH = Math.max(110, Math.floor((height - gap * (rows - 1)) / rows));
      const fromW = Math.floor((width - gap * (n - 1)) / n);
      setSide(Math.max(110, Math.min(fromH, fromW, 420)));
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  /* Polling snapshot from backend cache */
  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const [payload, bundle] = await Promise.all([
          fetchJson('/api/public/mempool/live', { cache: 'no-store' }),
          fetchMempoolOverviewBundle({ cache: 'no-store' }),
        ]);
        if (!active) return;

        const live = payload?.data || {};
        const blocksData = Array.isArray(live.blocks) ? live.blocks : [];
        const mempoolQueue = Array.isArray(live.mempool_blocks) ? live.mempool_blocks : [];

        setBlocks(blocksData.slice(0, 8));
        setMempoolBlocks(mempoolQueue.slice(0, 8));
        setFees({
          fastest: bundle.fees.priority,
          halfHour: bundle.fees.normal,
          economy: bundle.fees.economy,
        });
        setLastUpdatedAt(payload?.updated_at || new Date());
        setWsStatus('connected');
      } catch {
        if (!active) return;
        setWsStatus((prev) => (prev === 'connected' ? 'reconnecting' : 'connecting'));
      }
    };

    load();
    const timer = setInterval(load, 10_000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const toggle = useCallback(
    (block) => setSelected(prev => prev?.height === block.height ? null : block),
    [],
  );

  const isMobile = viewportWidth < 640;
  const visibleBlocks = blocks.slice(0, isMobile ? 4 : 6);
  const mobileMissingCards = isMobile && visibleBlocks.length > 0 ? Math.max(0, 4 - visibleBlocks.length) : 0;

  /* Chip width proportional to block side */
  const chipW = Math.max(72, Math.min(Math.round(side * 0.44), 120));

  return (
    <div className="visual-integrity-lock flex h-full w-full flex-col bg-[#0d0d0d] overflow-hidden select-none font-mono">

      {/* ── Top bar ── */}
      <div className="flex flex-shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#1c1c1c] px-3 py-2 sm:px-4">
        {/* WS status dot */}
        <div className="flex items-center gap-2">
          <div
            className="h-2 w-2 rounded-full flex-shrink-0"
            style={{
              background: wsStatus === 'connected' ? UI_COLORS.positive : UI_COLORS.warning,
              boxShadow: `0 0 6px ${wsStatus === 'connected' ? UI_COLORS.positive : UI_COLORS.warning}`,
            }}
          />
            <span className="text-[12px] uppercase tracking-widest text-white/30">
            {wsStatus === 'connected' ? 'LIVE BLOCKS' : wsStatus.toUpperCase()}
          </span>
        </div>


        <div className="hidden sm:block">
          <FeeLegend />
        </div>
      </div>

      {/* ── Fee tiles: Economy / Normal / Priority ── */}
      <div className="flex flex-shrink-0 divide-x divide-[#2a2a2a] border-b border-[#1c1c1c]">
        {[
          { label: 'Economy',  val: fees?.economy,  col: '#00FFCC' },
          { label: 'Normal',   val: fees?.halfHour, col: '#FF8C00' },
          { label: 'Priority', val: fees?.fastest,  col: '#FF6B6B' },
        ].map(({ label, val, col }) => (
          <div key={label} className="flex flex-1 flex-col items-center gap-0.5 px-2 py-2 text-center">
            {val != null ? (
              <span className="font-mono font-bold tabular-nums leading-none" style={{ fontSize: 'clamp(1.6rem,3.8vw,2.4rem)', color: col }}>
                {Number(val).toFixed(2)}
              </span>
            ) : (
              <span className="font-mono font-bold text-[#333]" style={{ fontSize: 'clamp(1.6rem,3.8vw,2.4rem)' }}>--</span>
            )}
            <span className="font-mono uppercase tracking-[0.18em] text-white/30" style={{ fontSize: 'var(--fs-tag)' }}>{label}</span>
            <span className="font-mono text-white/20" style={{ fontSize: 'var(--fs-micro)' }}>sat/vB</span>
          </div>
        ))}
      </div>

      {/* ── Confirmed blocks ── */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-2 sm:p-3 lg:flex-row">
        <div className="relative flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="text-[12px] uppercase tracking-[0.2em] text-white/20">Confirmed Blocks</span>
            <span className="text-[12px] font-mono text-white/15 border border-white/10 rounded px-2 py-1">
              ↗ dbl-click → mempool.space
            </span>
          </div>
          <div
            ref={scrollRef}
            className={isMobile
              ? 'grid flex-1 grid-cols-2 auto-rows-max gap-2 pb-1 pr-1'
              : 'flex flex-1 items-start gap-2 overflow-x-auto pb-1'}
          >
            {visibleBlocks.length === 0
              ? Array.from({ length: isMobile ? 4 : 5 }).map((_, i) => (
                  <div key={i} className="skeleton flex-shrink-0 rounded" style={{ width: side, height: side }} />
                ))
              : visibleBlocks.map(b => (
                  <BlockCanvas
                    key={b.id ?? b.height}
                    block={b}
                    side={side}
                    selected={selected?.height === b.height}
                    onClick={() => toggle(b)}
                    onDoubleClick={() => window.open(`https://mempool.space/block/${b.id ?? b.height}`, '_blank')}
                  />
                ))
            }
            {mobileMissingCards > 0
              ? Array.from({ length: mobileMissingCards }).map((_, i) => (
                  <div key={`fill-${i}`} className="skeleton flex-shrink-0 rounded" style={{ width: side, height: side }} />
                ))
              : null}
          </div>

          {selected && (
            <div className="absolute right-1 top-8 z-10 w-[min(320px,92%)] max-h-[calc(100%-2.2rem)] rounded-lg shadow-[0_10px_30px_rgba(0,0,0,0.55)] lg:hidden">
              <DetailPanel block={selected} onClose={() => setSelected(null)} />
            </div>
          )}
        </div>

        {selected && (
          <div className="hidden w-52 flex-shrink-0 lg:block">
            <DetailPanel block={selected} onClose={() => setSelected(null)} className="h-full" />
          </div>
        )}
      </div>

      {/* ── Mempool queue ── */}
      <div className="relative flex-shrink-0 border-t border-[#1c1c1c] px-2 pt-2 pb-3 sm:px-3">
        <span className="text-[12px] uppercase tracking-[0.2em] text-white/20 block mb-2">
          Mempool Queue
        </span>
        <div className="flex gap-2 overflow-x-auto">
          {mempoolBlocks.length === 0
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton flex-shrink-0 rounded" style={{ width: chipW, height: Math.round(chipW * 1.1) }} />
              ))
            : mempoolBlocks.map((b, i) => <MempoolChip key={i} block={b} idx={i} chipW={chipW} />)
          }
        </div>

        {showDesktopOverlay && (
          <div className="mt-2 flex justify-end">
            <div className="text-right font-mono text-[12px] tracking-wide text-[#7c7c7c]">
            <div>
              <span>src: </span>
              <a href="https://mempool.space" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-bitcoin)', textDecoration: 'none' }}>
                mempool.space
              </a>
            </div>
            <div>Refresh target: 10s</div>
            <div>Last sync: {formatMetaTimestamp(lastUpdatedAt)}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
