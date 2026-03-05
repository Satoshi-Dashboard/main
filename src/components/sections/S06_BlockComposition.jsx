import { useEffect, useMemo, useState } from 'react';
import { Treemap, ResponsiveContainer } from 'recharts';
import { fmt } from '../../utils/formatters';

const FALLBACK_BLOCK = { height: 900496, tx_count: 2278, extras: { pool: { name: 'Mining Pool' }, totalFees: 19500000, medianFee: 1.95 } };
const FALLBACK_MEMPOOL = { count: 5100, vsize: 5_100_000 };

const feeColor = (idx) => {
  const p = ['#00D4BB', '#0FC9B4', '#22D3A8', '#F7931A', '#E8A435', '#17C9A8', '#1FCFB2', '#F4A623'];
  return p[idx % p.length];
};

const buildTxData = (n) =>
  Array.from({ length: Math.min(n, 220) }, (_, i) => ({
    name: `tx-${i}`,
    size: Math.max(1, Math.round((Math.sin(i * 0.31) + 1.4) * 10 + (i % 7 === 0 ? 20 : 0))),
  }));

const TxCell = (props) => {
  const { x, y, width, height, index } = props;
  if (width < 2 || height < 2) return null;
  return <rect x={x + 0.5} y={y + 0.5} width={Math.max(0, width - 1)} height={Math.max(0, height - 1)} style={{ fill: feeColor(index), stroke: '#111', strokeWidth: 1 }} />;
};

const MempoolCell = (props) => {
  const { x, y, width, height, index } = props;
  if (width < 1 || height < 1) return null;
  const p = ['#00D4BB', '#17C9A8', '#F7931A', '#22D3A8'];
  return <rect x={x + 0.5} y={y + 0.5} width={Math.max(0, width - 1)} height={Math.max(0, height - 1)} style={{ fill: p[index % 4], stroke: '#111', strokeWidth: 0.5 }} />;
};

export default function S06_BlockComposition() {
  const [block, setBlock] = useState(FALLBACK_BLOCK);
  const [mempool, setMempool] = useState(FALLBACK_MEMPOOL);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [bRes, mRes] = await Promise.all([
          fetch('https://mempool.space/api/v1/blocks'),
          fetch('https://mempool.space/api/mempool'),
        ]);
        const [blocks, mem] = await Promise.all([bRes.json(), mRes.json()]);
        if (!active) return;
        if (Array.isArray(blocks) && blocks.length > 0) setBlock(blocks[0]);
        if (mem?.count) setMempool({ count: mem.count, vsize: mem.vsize ?? 0 });
      } catch { /* keep fallback */ }
    };
    load();
    const t = setInterval(load, 120_000);
    return () => { active = false; clearInterval(t); };
  }, []);

  const blockData = useMemo(() => buildTxData(block?.tx_count ?? 2278), [block]);
  const mempoolData = useMemo(() => buildTxData(Math.min(mempool.count, 160)), [mempool]);

  const poolName = block?.extras?.pool?.name ?? 'Unknown Pool';
  const totalFeesBtc = block?.extras?.totalFees ? (block.extras.totalFees / 1e8).toFixed(4) : '—';
  const medianFee = block?.extras?.medianFee?.toFixed(0) ?? '—';

  return (
    <div className="flex h-full w-full flex-col bg-[#111111]">
      {/* Top: left panel + main treemap */}
      <div className="flex min-h-0 flex-1">
        {/* Left info panel */}
        <div className="flex w-36 flex-none flex-col gap-3 border-r border-[#2a2a2a] bg-[#0e0e0e] px-4 py-5 sm:w-48">
          <div>
            <div className="uppercase tracking-[0.18em] text-[#00D4BB]" style={{ fontSize: 'var(--fs-tag)' }}>Latest Block</div>
            <div className="mt-1 font-mono font-bold text-[#00D4BB] tabular-nums" style={{ fontSize: 'var(--fs-subtitle)' }}>
              {fmt.num(block.height ?? 900496)}
            </div>
          </div>
          <div className="font-mono font-bold text-[#F7931A]" style={{ fontSize: 'var(--fs-caption)' }}>
            {fmt.num(block.tx_count ?? 2278)} transactions
          </div>
          <div className="text-white/50" style={{ fontSize: 'var(--fs-tag)' }}>{poolName}</div>
          <div className="mt-auto space-y-1 text-white/35" style={{ fontSize: 'var(--fs-tag)' }}>
            <div>{totalFeesBtc} BTC total fees</div>
            <div>{medianFee} sats/vbyte</div>
          </div>
        </div>

        {/* Main treemap */}
        <div className="min-w-0 flex-1 bg-[#0f0f0f]">
          <ResponsiveContainer width="100%" height="100%">
            <Treemap data={blockData} dataKey="size" stroke="#111" animationDuration={0} content={<TxCell />} />
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom: mempool strip */}
      <div className="flex h-28 flex-none flex-col border-t border-[#2a2a2a] sm:h-32">
        <div className="min-h-0 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <Treemap data={mempoolData} dataKey="size" stroke="#111" animationDuration={0} content={<MempoolCell />} />
          </ResponsiveContainer>
        </div>
        <div className="flex-none border-t border-[#2a2a2a] px-5 py-1.5">
          <span className="font-monos text-white/35">
            Mempool: <span className="text-white/60">{fmt.num(mempool.count)}</span> unconfirmed
          </span>
        </div>
      </div>
    </div>
  );
}
