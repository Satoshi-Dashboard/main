const TIERS = [
  { name: 'PLANKTON', emoji: '🦐', range: '< 0.1 BTC',          bg: '#f5e8d4', fg: '#2a1000', addresses: 50680627, totalBtc: 315444.78,  pct: 1.59,  cum: 100.00 },
  { name: 'SHRIMP',   emoji: '🦞', range: '0.1 – 1',            bg: '#efce96', fg: '#2a1000', addresses: 3479084,  totalBtc: 1072660.00, pct: 5.40,  cum: 98.41  },
  { name: 'CRAB',     emoji: '🦀', range: '1 – 10',             bg: '#e6a050', fg: '#1a0800', addresses: 836399,   totalBtc: 2073749.00, pct: 10.43, cum: 93.02  },
  { name: 'FISH',     emoji: '🐟', range: '10 – 100',           bg: '#d07030', fg: '#ffffff', addresses: 133242,   totalBtc: 4296739.00, pct: 21.62, cum: 82.58  },
  { name: 'SHARK',    emoji: '🦈', range: '100 – 1,000',        bg: '#a84010', fg: '#ffffff', addresses: 16294,    totalBtc: 4720464.00, pct: 23.75, cum: 60.96  },
  { name: 'WHALE',    emoji: '🐋', range: '1,000 – 10,000',     bg: '#7e2000', fg: '#ffc08a', addresses: 2006,     totalBtc: 4514961.00, pct: 22.72, cum: 37.21  },
  { name: 'HUMPBACK', emoji: '🐳', range: '10,000 – 100,000',   bg: '#580c00', fg: '#ffa060', addresses: 90,       totalBtc: 2226328.00, pct: 11.20, cum: 14.49  },
  { name: '100K+',    emoji: '💰', range: '100,000+',           bg: '#380400', fg: '#ff7040', addresses: 4,        totalBtc: 653463.00,  pct: 3.29,  cum: 3.29   },
];

export default function S11_AddressDistribution() {
  return (
    <div className="flex h-full w-full flex-col bg-[#111111]">
      {/* Title */}
      <div className="flex-none px-10 pt-6 pb-3">
        <h1
          style={{
            color: '#F7931A',
            fontFamily: 'monospace',
            fontSize: 'var(--fs-subtitle)',
            fontWeight: 700,
            letterSpacing: '0.05em',
          }}
        >
          Address Distribution
        </h1>
      </div>

      {/* Table */}
      <div className="min-h-0 flex-1 flex flex-col px-6 pb-6">
        {/* Header */}
        <div className="flex-none flex rounded-t-lg border border-[#2a2a2a] bg-[#1c1c1c] px-4 py-2s font-bold uppercase tracking-widest text-gray-500">
          <div className="w-12" />
          <div className="flex-1">Address Type</div>
          <div className="w-44 text-right pr-2">BTC Balance</div>
          <div className="w-40 text-right pr-2"># of Addresses</div>
          <div className="w-40 text-right pr-2">Total BTC</div>
          <div className="w-44 text-right pr-2">BTC %</div>
        </div>

        {/* Rows */}
        {TIERS.map((t, i) => (
          <div
            key={t.name}
            className="flex flex-1 items-center border-x border-b border-black/20 px-4"
            style={{
              backgroundColor: t.bg,
              borderBottomLeftRadius: i === TIERS.length - 1 ? 8 : 0,
              borderBottomRightRadius: i === TIERS.length - 1 ? 8 : 0,
              minHeight: 0,
            }}
          >
            <div className="w-12l leading-none">{t.emoji}</div>
            <div
              className="flex-1 font-mono font-bold"
              style={{ color: t.fg, fontSize: 'var(--fs-label)' }}
            >
              {t.name}
            </div>
            <div
              className="w-44 text-right pr-2 font-mono"
              style={{ color: t.fg, opacity: 0.8, fontSize: 'var(--fs-caption)' }}
            >
              {t.range}
            </div>
            <div
              className="w-40 text-right pr-2 font-mono font-bold"
              style={{ color: t.fg, fontSize: 'var(--fs-caption)' }}
            >
              {t.addresses.toLocaleString()}
            </div>
            <div
              className="w-40 text-right pr-2 font-mono"
              style={{ color: t.fg, fontSize: 'var(--fs-caption)' }}
            >
              {t.totalBtc.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div
              className="w-44 text-right pr-2 font-mono font-bold"
              style={{ color: t.fg, fontSize: 'var(--fs-caption)' }}
            >
              {t.pct.toFixed(2)}%{' '}
              <span style={{ opacity: 0.7 }}>({t.cum.toFixed(2)}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
