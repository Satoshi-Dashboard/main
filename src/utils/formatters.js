export const fmt = {
  usd: (n, d = 0) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: d }).format(n),
  usd2: (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n),
  num: (n) => new Intl.NumberFormat('en-US').format(n),
  number: (n) => new Intl.NumberFormat('en-US').format(n),
  pct: (n, d = 2) => `${n >= 0 ? '+' : ''}${Number(n).toFixed(d)}%`,
  btc: (n) => `₿${Number(n).toFixed(4)}`,
  sats: (n) => `${Math.round(n).toLocaleString()} sats`,
  compact: (n) => {
    if (Math.abs(n) >= 1e12) return `$${(n/1e12).toFixed(2)}T`;
    if (Math.abs(n) >= 1e9) return `$${(n/1e9).toFixed(2)}B`;
    if (Math.abs(n) >= 1e6) return `$${(n/1e6).toFixed(2)}M`;
    if (Math.abs(n) >= 1e3) return `$${(n/1e3).toFixed(1)}K`;
    return `$${n.toFixed(0)}`;
  },
  usdCompact: (n) => {
    if (Math.abs(n) >= 1e12) return `$${(n/1e12).toFixed(2)}T`;
    if (Math.abs(n) >= 1e9) return `$${(n/1e9).toFixed(2)}B`;
    if (Math.abs(n) >= 1e6) return `$${(n/1e6).toFixed(2)}M`;
    if (Math.abs(n) >= 1e3) return `$${(n/1e3).toFixed(1)}K`;
    return `$${n.toFixed(0)}`;
  },
  compactNum: (n) => {
    if (Math.abs(n) >= 1e12) return `${(n/1e12).toFixed(2)}T`;
    if (Math.abs(n) >= 1e9) return `${(n/1e9).toFixed(2)}B`;
    if (Math.abs(n) >= 1e6) return `${(n/1e6).toFixed(2)}M`;
    if (Math.abs(n) >= 1e3) return `${(n/1e3).toFixed(1)}K`;
    return `${n}`;
  },
  numberCompact: (n) => {
    if (Math.abs(n) >= 1e12) return `${(n/1e12).toFixed(2)}T`;
    if (Math.abs(n) >= 1e9) return `${(n/1e9).toFixed(2)}B`;
    if (Math.abs(n) >= 1e6) return `${(n/1e6).toFixed(2)}M`;
    if (Math.abs(n) >= 1e3) return `${(n/1e3).toFixed(1)}K`;
    return `${n}`;
  },
  date: (ts) => new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }),
  dateShort: (ts) => new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  time: (ts) => new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  hashRate: (h) => {
    if (h >= 1e18) return `${(h / 1e18).toFixed(2)} EH/s`;
    if (h >= 1e15) return `${(h / 1e15).toFixed(2)} PH/s`;
    if (h >= 1e12) return `${(h / 1e12).toFixed(2)} TH/s`;
    return `${h} H/s`;
  },
  bytes: (b) => {
    if (b >= 1e9) return `${(b / 1e9).toFixed(2)} GB`;
    if (b >= 1e6) return `${(b / 1e6).toFixed(2)} MB`;
    if (b >= 1e3) return `${(b / 1e3).toFixed(1)} KB`;
    return `${b} B`;
  },
  ago: (ts) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff/60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins/60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs/24)}d ago`;
  }
};

export const getChangeColor = (n) =>
  n >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';

export const getChangeClass = (n) =>
  n >= 0 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]';
