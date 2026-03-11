import { useEffect, useMemo, useState } from 'react';
import AnimatedMetric from '@/shared/components/common/AnimatedMetric.jsx';
import {
  fetchMempoolNodeSnapshot,
  fetchMempoolOfficialUsageSnapshot,
  fetchMempoolOverviewBundle,
} from '@/shared/services/mempoolApi.js';

const UI_COLORS = {
  brand: 'var(--accent-bitcoin)',
  positive: 'var(--accent-green)',
  negative: 'var(--accent-red)',
  muted: 'rgba(255,255,255,0.38)',
};

function formatMemory(bytes) {
  if (bytes == null) return { value: null, unit: null, decimals: 1 };
  if (bytes < 1_000_000) {
    return { value: parseFloat((bytes / 1e3).toFixed(1)), unit: 'KB', decimals: 1 };
  }
  return { value: parseFloat((bytes / 1e6).toFixed(1)), unit: 'MB', decimals: 1 };
}

function toVmb(bytes) {
  if (bytes == null) return null;
  const numericValue = Number(bytes);
  if (!Number.isFinite(numericValue)) return null;
  return parseFloat((numericValue / 1e6).toFixed(1));
}

function btcKbToSatVb(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return null;
  return numericValue * 100_000;
}

function getMetricDecimals(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return 0;
  if (Number.isInteger(numericValue)) return 0;
  if (Math.abs(numericValue) >= 10) return 1;
  return 2;
}

function GaugeArc({ usageBytes, maxBytes, loading, centerLabel = 'USAGE' }) {
  const hasData = usageBytes != null && maxBytes != null && maxBytes > 0;
  const usageMB = usageBytes != null ? usageBytes / 1e6 : 0;
  const maxMB = maxBytes != null ? maxBytes / 1e6 : 0;
  const pct = hasData ? Math.min((usageMB / maxMB) * 100, 100) : 0;

  const r = 120;
  const cx = 180;
  const cy = 160;
  const arcPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const totalArcLength = Math.PI * r;
  const filledLength = (pct / 100) * totalArcLength;

  return (
    <svg width="360" height="190" viewBox="0 0 360 190" className="w-full max-w-[420px]">
      <path d={arcPath} fill="none" stroke="#2a2a2a" strokeWidth="18" strokeLinecap="round" />
      {!loading && hasData ? (
        <path
          d={arcPath}
          fill="none"
          stroke={UI_COLORS.brand}
          strokeWidth="18"
          strokeLinecap="round"
          strokeDasharray={`${filledLength} ${totalArcLength}`}
          style={{ filter: 'drop-shadow(0 0 8px rgba(247,147,26,0.5))' }}
        />
      ) : null}

      {loading ? (
        <>
          <rect x={cx - 60} y={cy - 58} width="120" height="40" rx="6" fill="#2a2a2a" opacity="0.7">
            <animate attributeName="opacity" values="0.4;0.8;0.4" dur="1.4s" repeatCount="indefinite" />
          </rect>
          <rect x={cx - 48} y={cy - 6} width="96" height="20" rx="4" fill="#2a2a2a" opacity="0.5">
            <animate attributeName="opacity" values="0.3;0.6;0.3" dur="1.4s" repeatCount="indefinite" />
          </rect>
        </>
      ) : hasData ? (
        <>
          <text x={cx} y={cy - 18} textAnchor="middle" fill={UI_COLORS.brand}
            fontSize="42" fontFamily="JetBrains Mono, monospace" fontWeight="700">
            {pct.toFixed(1)}%
          </text>
          <text x={cx} y={cy + 14} textAnchor="middle" fill="rgba(255,255,255,0.35)"
            fontSize="18" fontFamily="JetBrains Mono, monospace" letterSpacing="3">
            {centerLabel}
          </text>
        </>
      ) : (
        <>
          <text x={cx} y={cy - 18} textAnchor="middle" fill="#333"
            fontSize="42" fontFamily="JetBrains Mono, monospace" fontWeight="700">
            --%
          </text>
          <text x={cx} y={cy + 14} textAnchor="middle" fill="rgba(255,255,255,0.12)"
            fontSize="18" fontFamily="JetBrains Mono, monospace" letterSpacing="3">
            {centerLabel}
          </text>
        </>
      )}

    </svg>
  );
}

function MetricTile({ label, value, unit = null, decimals = 0, loading }) {
  const hasValue = value != null;

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      {loading ? (
        <div className="skeleton" style={{ width: 96, height: '1.8em' }} />
      ) : hasValue ? (
        <div className="flex min-h-[2em] items-center font-mono font-bold text-white tabular-nums" style={{ fontSize: 'var(--fs-title)' }}>
          <AnimatedMetric value={value} variant="number" decimals={decimals} inline />
          {unit ? <span className="ml-1 text-[0.4em] text-white/50">{unit}</span> : null}
        </div>
      ) : (
        <div className="flex min-h-[2em] items-center font-mono font-bold text-[#333333]" style={{ fontSize: 'var(--fs-title)' }}>
          --
        </div>
      )}
      <div className="uppercase tracking-[0.18em]" style={{ fontSize: 'var(--fs-label)', color: UI_COLORS.brand }}>
        {label}
      </div>
    </div>
  );
}

function BottomTile({ label, value, unit = null, decimals = 0, loading, color = UI_COLORS.brand }) {
  const hasValue = value != null;

  return (
    <div className="flex min-w-[92px] flex-1 basis-[132px] flex-col items-center gap-2 border-[#2a2a2a] px-4 py-1 text-center sm:flex-none sm:basis-auto sm:px-6">
      {loading ? (
        <div className="skeleton" style={{ width: 56, height: '2em' }} />
      ) : hasValue ? (
        <div className="flex min-h-[2.1em] items-center font-mono font-bold tabular-nums" style={{ fontSize: 'var(--fs-title)', color }}>
          <AnimatedMetric value={value} variant="number" decimals={decimals} inline />
        </div>
      ) : (
        <div className="flex min-h-[2.1em] items-center font-mono font-bold text-[#333333]" style={{ fontSize: 'var(--fs-title)' }}>
          --
        </div>
      )}
      <div className="uppercase tracking-[0.18em] text-white/30" style={{ fontSize: 'var(--fs-tag)' }}>{label}</div>
      <div className="font-mono text-white/20" style={{ fontSize: 'var(--fs-micro)' }}>{unit || ''}</div>
    </div>
  );
}

function SourceButton({ label, description, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-w-[150px] rounded-lg border px-3 py-2 text-left transition-colors"
      style={{
        borderColor: active ? UI_COLORS.brand : 'rgba(255,255,255,0.10)',
        background: active ? 'rgba(247,147,26,0.08)' : '#121212',
      }}
    >
      <div className="font-mono uppercase" style={{ fontSize: 'var(--fs-caption)', color: UI_COLORS.brand }}>
        {label}
      </div>
      <div className="mt-1 font-mono text-white/45" style={{ fontSize: 'var(--fs-micro)' }}>
        {description}
      </div>
    </button>
  );
}


function MempoolPanel({
  usageBytes,
  maxBytes,
  usageLabel,
  loading,
  unavailableLabel,
  stats,
  footerTiles,
  footerSource,
  hideSourceOnDesktop = false,
}) {
  const hasGaugeData = usageBytes != null && maxBytes != null && maxBytes > 0;

  return (
    <div className="flex min-h-0 flex-1 w-full flex-col items-center justify-center gap-4 sm:gap-6">
      <div className="flex w-full flex-col items-center justify-center gap-1">
        <GaugeArc usageBytes={usageBytes} maxBytes={maxBytes} loading={loading} centerLabel="USAGE" />
        {loading ? null : hasGaugeData ? (
          <div className="font-mono text-white/25" style={{ fontSize: 'var(--fs-micro)' }}>
            {usageLabel}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 font-mono" style={{ fontSize: 'var(--fs-micro)', color: UI_COLORS.negative }}>
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-current opacity-80" />
            {unavailableLabel}
          </div>
        )}
      </div>

      <div className="flex w-full max-w-[700px] flex-col items-center gap-4 border-y border-[#2a2a2a] px-3 py-4 sm:flex-row sm:items-end sm:justify-center sm:gap-8 sm:px-8 sm:py-5">
        {stats.map((stat, index) => (
          <div key={stat.label} className="contents">
            {index > 0 ? <div className="h-px w-28 bg-[#2a2a2a] sm:h-16 sm:w-px" /> : null}
            <MetricTile {...stat} loading={loading} />
          </div>
        ))}
      </div>

      <div className="flex w-full flex-wrap items-center justify-center gap-1 sm:w-auto sm:flex-nowrap sm:items-end sm:gap-0 sm:divide-x sm:divide-[#2a2a2a]">
        {footerTiles.map((tile) => (
          <BottomTile key={tile.label} {...tile} loading={loading} />
        ))}
      </div>

      <div className={`flex-shrink-0 pb-1${hideSourceOnDesktop ? ' sm:invisible' : ''}`}>
        <span className="font-mono text-white/20" style={{ fontSize: 'var(--fs-micro)' }}>
          {footerSource}
        </span>
      </div>
    </div>
  );
}

export default function S04_MempoolGauge() {
  const [officialOverview, setOfficialOverview] = useState({
    count: null,
    vsizeVmb: null,
    feeLow: null,
    feeMid: null,
    feeHigh: null,
  });
  const [officialUsage, setOfficialUsage] = useState({
    usageBytes: null,
    maxBytes: null,
    label: null,
  });
  const [nodeView, setNodeView] = useState({
    usageBytes: null,
    maxBytes: null,
    count: null,
    vsizeVmb: null,
    mempoolMinFeeSatVb: null,
    relayMinFeeSatVb: null,
    unbroadcastCount: null,
    feeEconomy: null,
    feeHalfHour: null,
    feeFastest: null,
  });
  const [loadingOfficial, setLoadingOfficial] = useState(true);
  const [loadingNode, setLoadingNode] = useState(true);
  const [activeSource, setActiveSource] = useState('official');

  useEffect(() => {
    let active = true;

    const loadOfficial = async () => {
      try {
        const [bundle, usage] = await Promise.all([
          fetchMempoolOverviewBundle({ timeout: 8000, cache: 'no-store' }),
          fetchMempoolOfficialUsageSnapshot({ timeout: 8000, cache: 'no-store' }),
        ]);

        if (!active) return;

        setOfficialOverview((prev) => ({
          count: bundle.mempool.count ?? prev.count,
          vsizeVmb: bundle.mempool.vsize != null ? toVmb(bundle.mempool.vsize) : prev.vsizeVmb,
          feeLow: bundle.fees.economy ?? prev.feeLow,
          feeMid: bundle.fees.normal ?? prev.feeMid,
          feeHigh: bundle.fees.priority ?? prev.feeHigh,
        }));

        setOfficialUsage((prev) => ({
          usageBytes: usage.usageBytes ?? prev.usageBytes,
          maxBytes: usage.maxBytes ?? prev.maxBytes,
          label: usage.label ?? prev.label,
        }));
      } catch {
        // Preserve the last good official view during transient upstream errors.
      } finally {
        if (active) setLoadingOfficial(false);
      }
    };

    loadOfficial();
    const timer = setInterval(loadOfficial, 30_000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadNode = async () => {
      try {
        const snapshot = await fetchMempoolNodeSnapshot({ timeout: 8000, cache: 'no-store' });
        if (!active) return;

        setNodeView((prev) => ({
          usageBytes: snapshot.usageBytes ?? prev.usageBytes,
          maxBytes: snapshot.maxBytes ?? prev.maxBytes,
          count: snapshot.count ?? prev.count,
          vsizeVmb: snapshot.vsizeBytes != null ? toVmb(snapshot.vsizeBytes) : prev.vsizeVmb,
          mempoolMinFeeSatVb: snapshot.mempoolMinFeeBtcKb != null ? btcKbToSatVb(snapshot.mempoolMinFeeBtcKb) : prev.mempoolMinFeeSatVb,
          relayMinFeeSatVb: snapshot.relayMinFeeBtcKb != null ? btcKbToSatVb(snapshot.relayMinFeeBtcKb) : prev.relayMinFeeSatVb,
          unbroadcastCount: snapshot.unbroadcastCount ?? prev.unbroadcastCount,
          feeEconomy: snapshot.feeEconomy ?? prev.feeEconomy,
          feeHalfHour: snapshot.feeHalfHour ?? prev.feeHalfHour,
          feeFastest: snapshot.feeFastest ?? prev.feeFastest,
        }));
      } catch {
        // Preserve the last good node snapshot during transient upstream errors.
      } finally {
        if (active) setLoadingNode(false);
      }
    };

    loadNode();
    const timer = setInterval(loadNode, 5_000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const officialMemory = useMemo(() => formatMemory(officialUsage.usageBytes), [officialUsage.usageBytes]);
  const nodeMemory = useMemo(() => formatMemory(nodeView.usageBytes), [nodeView.usageBytes]);
  const officialUsageLabel = officialUsage.usageBytes != null && officialUsage.maxBytes != null
    ? (officialUsage.label
        ? `official mempool usage · ${officialUsage.label}`
        : `official mempool usage · ${officialMemory.value} ${officialMemory.unit} / ${(officialUsage.maxBytes / 1e6).toFixed(0)} MB`)
    : 'official mempool usage unavailable';
  const nodeUsageLabel = nodeView.usageBytes != null && nodeView.maxBytes != null
    ? `bitcoin knots mempool · ${nodeMemory.value} ${nodeMemory.unit} / ${(nodeView.maxBytes / 1e6).toFixed(0)} MB`
    : 'bitcoin knots node unavailable';

  const officialStats = [
    { label: 'Pending Transactions', value: officialOverview.count },
    { label: 'Virtual Size', value: officialOverview.vsizeVmb, unit: 'vMB', decimals: 1 },
    { label: 'Memory Usage', value: officialMemory.value, unit: officialMemory.unit, decimals: officialMemory.decimals },
  ];

  const officialFooterTiles = [
    { label: 'Economy', value: officialOverview.feeLow, unit: 'sat/vB', decimals: getMetricDecimals(officialOverview.feeLow), color: UI_COLORS.positive },
    { label: 'Normal', value: officialOverview.feeMid, unit: 'sat/vB', decimals: getMetricDecimals(officialOverview.feeMid), color: UI_COLORS.brand },
    { label: 'Priority', value: officialOverview.feeHigh, unit: 'sat/vB', decimals: getMetricDecimals(officialOverview.feeHigh), color: UI_COLORS.negative },
  ];

  const nodeStats = [
    { label: 'Pending Transactions', value: nodeView.count },
    { label: 'Virtual Size', value: nodeView.vsizeVmb, unit: 'vMB', decimals: 1 },
    { label: 'Memory Usage', value: nodeMemory.value, unit: nodeMemory.unit, decimals: nodeMemory.decimals },
  ];

  const nodeFooterTiles = [
    { label: 'Economy', value: nodeView.feeEconomy, unit: 'sat/vB', decimals: getMetricDecimals(nodeView.feeEconomy), color: UI_COLORS.positive },
    { label: 'Normal', value: nodeView.feeHalfHour, unit: 'sat/vB', decimals: getMetricDecimals(nodeView.feeHalfHour), color: UI_COLORS.brand },
    { label: 'Priority', value: nodeView.feeFastest, unit: 'sat/vB', decimals: getMetricDecimals(nodeView.feeFastest), color: UI_COLORS.negative },
  ];

  const isNode = activeSource === 'node';

  return (
    <div className="flex h-full w-full flex-col items-center justify-start gap-4 bg-[#111111] px-3 py-4 sm:gap-6 sm:px-4">
      <div className="text-center">
        <div className="font-mono font-bold uppercase tracking-[0.2em]" style={{ fontSize: 'var(--fs-heading)', color: UI_COLORS.brand }}>
          MEMPOOL STATUS
        </div>
      </div>

      <div className="flex w-full max-w-[560px] flex-wrap items-center justify-center gap-2">
        <SourceButton
          label="Network View"
          description="mempool.space public data"
          active={!isNode}
          onClick={() => setActiveSource('official')}
        />
        <SourceButton
          label="Knots Node"
          description="Knots 29.3 bip110"
          active={isNode}
          onClick={() => setActiveSource('node')}
        />
      </div>

      {isNode ? (
        <MempoolPanel
          usageBytes={nodeView.usageBytes}
          maxBytes={nodeView.maxBytes}
          usageLabel={nodeUsageLabel}
          loading={loadingNode}
          unavailableLabel="NODE SOURCE UNAVAILABLE"
          stats={nodeStats}
          footerTiles={nodeFooterTiles}
          footerSource="src: Bitcoin Knots node · internal API · ~5s"
          hideSourceOnDesktop
        />
      ) : (
        <MempoolPanel
          usageBytes={officialUsage.usageBytes}
          maxBytes={officialUsage.maxBytes}
          usageLabel={officialUsageLabel}
          loading={loadingOfficial}
          unavailableLabel="OFFICIAL USAGE UNAVAILABLE"
          stats={officialStats}
          footerTiles={officialFooterTiles}
          footerSource="src: mempool.space · ~30s"
        />
      )}
    </div>
  );
}
