import { useEffect, useMemo, useState } from 'react';
import { fmt } from '../../utils/formatters';
import { fetchBtcSpot } from '../../services/priceApi';

/* ── Circulating supply from protocol constants (no API needed) ── */
function calculateBitcoinSupply(blockHeight) {
  const BLOCKS_PER_HALVING = 210_000;
  let reward = 50;
  let supply = 0;
  let remaining = blockHeight;
  while (remaining > 0) {
    const era = Math.min(remaining, BLOCKS_PER_HALVING);
    supply += era * reward;
    remaining -= era;
    reward /= 2;
    if (reward < 1e-8) break;
  }
  return Math.floor(supply);
}

const defaultStats = {
  price: null,
  satsPerDollar: null,
  avgTxFee: null,
  blockHeight: null,
  hashRateEh: null,
  difficultyT: null,
  circulatingSupply: null,
  marketCap: null,
  nextDifficultyEtaBlocks: null,
  difficultyProgress: null,
  diffChangeNext: null,
  diffChangePrev: null,
};

/* ── Mini donut for Difficulty Adj. tile ── */
function MiniDonut({ pct }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(Math.max(((pct ?? 0) / 100) * circ, 0), circ);
  return (
    <svg width="96" height="96" viewBox="0 0 96 96">
      <circle cx="48" cy="48" r={r} fill="none" stroke="#2a2a2a" strokeWidth="9" />
      <circle
        cx="48"
        cy="48"
        r={r}
        fill="none"
        stroke="#F7931A"
        strokeWidth="9"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 48 48)"
      />
    </svg>
  );
}

/* ── Generic stat tile ── */
function Tile({ label, value, accent }) {
  return (
    <div className="flex flex-col items-center justify-center bg-[#111111] px-4 py-3 select-none">
      {value == null ? (
        <div className="skeleton w-3/4" style={{ height: '2.4em' }} />
      ) : (
        <div
          className="text-center font-mono font-bold leading-[1] text-white tabular-nums"
          style={{ fontSize: 'var(--fs-hero)' }}
        >
          {value}
          {accent && (
            <span className="text-[#F7931A]" style={{ fontSize: '0.28em', marginLeft: '0.25em' }}>
              {accent}
            </span>
          )}
        </div>
      )}
      <div
        className="mt-2 text-center uppercase tracking-[0.18em] text-[#F7931A]"
        style={{ fontSize: 'var(--fs-label)' }}
      >
        {label}
      </div>
    </div>
  );
}

/* ── Difficulty Adjustment tile (special layout) ── */
function DifficultyTile({ pct, etaBlocks, changeNext, changePrev }) {
  const loading = pct == null;
  return (
    <div className="flex flex-col items-center justify-center bg-[#111111] px-4 py-3 select-none gap-1">
      <div className="flex items-center gap-3">
        <div className="flex flex-col gap-1 text-right" style={{ fontSize: 'var(--fs-caption)' }}>
          {loading ? (
            <>
              <div className="skeleton" style={{ width: '90px', height: '1.1em' }} />
              <div className="skeleton" style={{ width: '90px', height: '1.1em', marginTop: '2px' }} />
            </>
          ) : (
            <>
              <span className="text-red-400 font-mono">
                {changeNext.toFixed(2)}% ▼ Next
              </span>
              <span className="text-[#00D897] font-mono">
                +{changePrev.toFixed(2)}% ▲ Prev
              </span>
            </>
          )}
        </div>
        <MiniDonut pct={pct} />
      </div>

      {loading ? (
        <div className="skeleton" style={{ width: '65%', height: '2em', marginTop: '4px' }} />
      ) : (
        <div
          className="font-mono font-bold text-white tabular-nums leading-none"
          style={{ fontSize: 'var(--fs-title)' }}
        >
          {pct.toFixed(2)}%
        </div>
      )}

      <div
        className="uppercase tracking-[0.18em] text-[#F7931A]"
        style={{ fontSize: 'var(--fs-label)' }}
      >
        DIFFICULTY ADJ.
      </div>

      {loading ? (
        <div className="skeleton" style={{ width: '55%', height: '1em' }} />
      ) : (
        <div
          className="text-white/30 font-mono"
          style={{ fontSize: 'var(--fs-micro)' }}
        >
          {fmt.num(etaBlocks)} blocks remaining
        </div>
      )}
    </div>
  );
}

export default function S01_BitcoinOverview() {
  const [stats, setStats] = useState(defaultStats);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [spot, diffRes, heightRes, feeRes, hashRes] = await Promise.all([
          fetchBtcSpot(),
          fetch('https://mempool.space/api/v1/difficulty-adjustment'),
          fetch('https://mempool.space/api/blocks/tip/height'),
          fetch('https://mempool.space/api/v1/fees/recommended'),
          fetch('https://mempool.space/api/v1/mining/hashrate/pools'),
        ]);
        const [diff, heightText, fees, hashData] = await Promise.all([
          diffRes.json(),
          heightRes.text(),
          feeRes.json(),
          hashRes.json(),
        ]);
        if (!active) return;
        const h = Number(heightText);
        setStats((prev) => ({
          ...prev,
          price:         spot?.usd         || prev.price,
          satsPerDollar: spot?.usd ? Math.round(1e8 / spot.usd) : prev.satsPerDollar,
          marketCap:     spot?.marketCap   || prev.marketCap,
          circulatingSupply: h ? calculateBitcoinSupply(h) : prev.circulatingSupply,
          avgTxFee:      Number(fees?.halfHourFee) || prev.avgTxFee,
          blockHeight:   h || prev.blockHeight,
          difficultyT:   diff?.currentDifficulty ? diff.currentDifficulty / 1e12 : prev.difficultyT,
          nextDifficultyEtaBlocks: diff?.remainingBlocks  != null ? Number(diff.remainingBlocks)  : prev.nextDifficultyEtaBlocks,
          difficultyProgress:     diff?.progressPercent  != null ? Number(diff.progressPercent)  : prev.difficultyProgress,
          diffChangeNext:         diff?.difficultyChange  != null ? Number(diff.difficultyChange) : prev.diffChangeNext,
          diffChangePrev:         diff?.previousRetarget  != null ? Number(diff.previousRetarget) : prev.diffChangePrev,
          hashRateEh: hashData?.currentHashrate ? hashData.currentHashrate / 1e18 : prev.hashRateEh,
        }));
      } catch {
        /* keep previous values */
      }
    };
    load();
    const timer = setInterval(load, 60_000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const tiles = useMemo(
    () => [
      { label: 'BTC/USD',            value: stats.price         != null ? fmt.usd(stats.price, 0)                        : null },
      { label: 'SATS PER DOLLAR',    value: stats.satsPerDollar != null ? fmt.num(stats.satsPerDollar)                   : null },
      { label: 'AVG TX FEE (sat/vB)', value: stats.avgTxFee    != null ? fmt.num(stats.avgTxFee)                        : null },
      { label: 'BLOCK HEIGHT',        value: stats.blockHeight  != null ? fmt.num(stats.blockHeight)                     : null },
      { label: 'CURRENT HASH RATE',   value: stats.hashRateEh   != null ? `${stats.hashRateEh.toFixed(2)} EH/s`          : null },
      { label: 'NETWORK DIFFICULTY',  value: stats.difficultyT  != null ? `${stats.difficultyT.toFixed(2)} T`            : null },
      { label: 'CIRCULATING SUPPLY',  value: stats.circulatingSupply != null ? fmt.num(stats.circulatingSupply) : null, accent: '∞/21M' },
      { label: 'MARKET CAP',          value: stats.marketCap    != null ? fmt.compact(stats.marketCap)                   : null },
    ],
    [stats],
  );

  return (
    <div className="h-full w-full bg-[#111111]">
      <div className="grid h-full w-full grid-cols-3 grid-rows-3 divide-x divide-y divide-[#2a2a2a]">
        {tiles.map((t) => (
          <Tile key={t.label} {...t} />
        ))}
        <DifficultyTile
          pct={stats.difficultyProgress}
          etaBlocks={stats.nextDifficultyEtaBlocks}
          changeNext={stats.diffChangeNext}
          changePrev={stats.diffChangePrev}
        />
      </div>
    </div>
  );
}
