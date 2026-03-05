import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/* ─── Fee color scale ──────────────────────────────────────── */
function feeColor(satVb) {
  if (satVb < 2)  return '#00FFCC';
  if (satVb < 10) return '#00FF88';
  if (satVb < 50) return '#FFD700';
  return '#FF8C00';
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
  const txs  = useMemo(
    () => genTxs(block.extras?.feeRange, block.tx_count, block.size),
    [block.height], // eslint-disable-line react-hooks/exhaustive-deps
  );
  useEffect(() => { drawTreemap(ref.current, txs); }, [txs, side]);

  const med  = block.extras?.medianFee;
  const pool = block.extras?.pool?.name ?? '—';
  const sc   = side / BASE_SIDE; // proportional scale for text

  return (
    <div
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={`relative flex-shrink-0 cursor-pointer rounded overflow-hidden transition-all duration-150 ${
        selected ? 'ring-2 ring-[#F7931A]' : 'ring-1 ring-[#2a2a2a] hover:ring-[#555]'
      }`}
      style={{ width: side, height: side }}
    >
      <canvas ref={ref} width={side} height={side} style={{ display: 'block' }} />

      {/* height */}
      <div
        className="absolute top-1 left-1 bg-black/75 rounded px-1.5 py-px font-mono text-white/80"
        style={{ fontSize: Math.max(9, Math.round(10 * sc)) }}
      >
        #{block.height}
      </div>
      {/* pool */}
      <div
        className="absolute top-1 right-1 bg-black/70 rounded px-1 py-px font-mono text-white/40 truncate"
        style={{ fontSize: Math.max(8, Math.round(8 * sc)), maxWidth: Math.round(68 * sc) }}
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
            fontSize: Math.max(9, Math.round(10 * sc)),
          }}
        >
          {med.toFixed(1)} s/vB
        </div>
      )}
      {/* tx count */}
      <div
        className="absolute bottom-1 left-1 bg-black/70 rounded px-1 py-px font-mono text-white/35"
        style={{ fontSize: Math.max(8, Math.round(8 * sc)) }}
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
      <span className="font-mono text-white/30" style={{ fontSize: Math.max(8, Math.round(9 * sc)) }}>
        {idx === 0 ? 'NEXT' : `+${idx}`}
      </span>
      {/* fill bar */}
      <div className="relative w-full bg-[#1a1a1a] rounded overflow-hidden" style={{ height: Math.round(34 * sc) }}>
        <div
          className="absolute bottom-0 left-0 right-0 rounded"
          style={{ height: `${pct}%`, background: col, opacity: 0.75 }}
        />
      </div>
      <span className="font-mono font-bold" style={{ color: col, fontSize: Math.max(8, Math.round(9 * sc)) }}>
        {lo}–{hi}
      </span>
      <span className="font-mono text-white/30" style={{ fontSize: Math.max(7, Math.round(8 * sc)) }}>
        {(block.nTx ?? 0).toLocaleString()} tx
      </span>
    </div>
  );
}

/* ─── Block detail panel ───────────────────────────────────── */
function DetailPanel({ block, onClose }) {
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
    <div className="flex-shrink-0 flex flex-col gap-1.5 bg-[#0d0d0d] border border-[#F7931A]/30 rounded-lg p-3 w-52">
      <div className="flex justify-between items-center mb-0.5">
        <span className="font-mono font-bold text-[#F7931A] text-[11px] tracking-widest uppercase">
          Block Detail
        </span>
        <button onClick={onClose} className="text-white/30 hover:text-white/70 text-xs">✕</button>
      </div>
      <div className="border-t border-[#1c1c1c]" />
      {rows.map(([label, val]) => (
        <div key={label} className="flex justify-between items-baseline gap-2">
          <span className="text-[9px] font-mono text-white/30 uppercase tracking-wide flex-shrink-0">{label}</span>
          <span className="text-[10px] font-mono text-white text-right truncate">{val}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Fee legend ───────────────────────────────────────────── */
function FeeLegend() {
  return (
    <div className="flex items-center gap-2">
      {[['#00FFCC','<2'],['#00FF88','2-10'],['#FFD700','10-50'],['#FF8C00','>50']].map(([col, label]) => (
        <div key={label} className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: col }} />
          <span className="text-[10px] font-mono text-white/30">{label}</span>
        </div>
      ))}
      <span className="text-[10px] font-mono text-white/20">s/vB</span>
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
  const wsRef        = useRef(null);
  const scrollRef    = useRef(null);

  /* Responsive block size via ResizeObserver */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      const { height, width } = entry.contentRect;
      const n   = 6;
      const gap = 8;
      const fromH = Math.max(BASE_SIDE, height - 4);
      const fromW = Math.floor((width - gap * (n - 1)) / n);
      setSide(Math.max(120, Math.min(fromH, fromW, 420)));
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  /* Initial REST load */
  useEffect(() => {
    fetch('https://mempool.space/api/v1/blocks')
      .then(r => r.json())
      .then(data => setBlocks(data.slice(0, 8)))
      .catch(() => {});
    fetch('https://mempool.space/api/v1/fees/recommended')
      .then(r => r.json())
      .then(d => setFees({ fastest: d.fastestFee, halfHour: d.halfHourFee, economy: d.economyFee }))
      .catch(() => {});
  }, []);

  /* WebSocket with auto-reconnect */
  useEffect(() => {
    let alive = true;
    function connect() {
      const ws = new WebSocket('wss://mempool.space/api/v1/ws');
      wsRef.current = ws;

      ws.onopen = () => {
        if (!alive) return;
        setWsStatus('connected');
        ws.send(JSON.stringify({ action: 'want', data: ['blocks', 'mempool-blocks', 'stats'] }));
      };

      ws.onmessage = ({ data }) => {
        if (!alive) return;
        try {
          const msg = JSON.parse(data);
          if (msg.block)              setBlocks(prev => [msg.block, ...prev].slice(0, 8));
          if (msg['mempool-blocks'])  setMempoolBlocks(msg['mempool-blocks'].slice(0, 8));
          const f = msg.fees ?? msg.stats?.fees;
          if (f) setFees({ fastest: f.fastestFee, halfHour: f.halfHourFee, economy: f.economyFee });
        } catch { /* ignore */ }
      };

      ws.onclose = () => {
        if (!alive) return;
        setWsStatus('reconnecting');
        setTimeout(connect, 5_000);
      };
      ws.onerror = () => ws.close();
    }
    connect();
    return () => { alive = false; wsRef.current?.close(); };
  }, []);

  const toggle = useCallback(
    (block) => setSelected(prev => prev?.height === block.height ? null : block),
    [],
  );

  /* Chip width proportional to block side */
  const chipW = Math.max(72, Math.min(Math.round(side * 0.44), 120));

  return (
    <div className="flex h-full w-full flex-col bg-[#0d0d0d] overflow-hidden select-none font-mono">

      {/* ── Top bar ── */}
      <div className="flex flex-shrink-0 items-center justify-between px-4 py-2 border-b border-[#1c1c1c] gap-4 flex-wrap">
        {/* WS status dot */}
        <div className="flex items-center gap-2">
          <div
            className="h-2 w-2 rounded-full flex-shrink-0"
            style={{
              background:  wsStatus === 'connected' ? '#00D897' : '#F7931A',
              boxShadow: `0 0 6px ${wsStatus === 'connected' ? '#00D897' : '#F7931A'}`,
            }}
          />
          <span className="text-[11px] uppercase tracking-widest text-white/30">
            {wsStatus === 'connected' ? 'LIVE BLOCKS' : wsStatus.toUpperCase()}
          </span>
        </div>

        {/* Fee indicator */}
        {fees && (
          <div className="flex items-center gap-4">
            {[
              { label: 'ECO',  val: fees.economy,  col: '#00FFCC' },
              { label: '30M',  val: fees.halfHour, col: '#00FF88' },
              { label: 'FAST', val: fees.fastest,  col: '#FF8C00' },
            ].map(({ label, val, col }) => (
              <div key={label} className="flex items-center gap-0.5">
                <span className="text-[10px] text-white/30 mr-0.5">{label}</span>
                <span className="text-[13px] font-bold" style={{ color: col }}>{val}</span>
                <span className="text-[10px] text-white/20"> s/vB</span>
              </div>
            ))}
          </div>
        )}

        <FeeLegend />
      </div>

      {/* ── Confirmed blocks ── */}
      <div className="flex flex-1 min-h-0 gap-3 p-3 overflow-hidden">
        <div className="flex flex-col flex-1 min-w-0 gap-2">
          <div className="flex items-center gap-3">
            <span className="text-[11px] uppercase tracking-[0.2em] text-white/20">Confirmed Blocks</span>
            <span className="text-[9px] font-mono text-white/15 border border-white/10 rounded px-1.5 py-px">
              ↗ dbl-click → mempool.space
            </span>
          </div>
          <div ref={scrollRef} className="flex items-start gap-2 overflow-x-auto pb-1 flex-1">
            {blocks.length === 0
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="skeleton flex-shrink-0 rounded" style={{ width: side, height: side }} />
                ))
              : blocks.slice(0, 6).map(b => (
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
          </div>
        </div>

        {/* Detail panel */}
        {selected && <DetailPanel block={selected} onClose={() => setSelected(null)} />}
      </div>

      {/* ── Mempool queue ── */}
      <div className="flex-shrink-0 border-t border-[#1c1c1c] px-3 pt-2 pb-3">
        <span className="text-[11px] uppercase tracking-[0.2em] text-white/20 block mb-2">
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
      </div>
    </div>
  );
}
