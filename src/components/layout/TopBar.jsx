import { Github, Download } from 'lucide-react';
import { fmt } from '../../utils/formatters';

export default function TopBar() {
  const btcPrice = 97234.56;
  const change24h = 3.42;

  const handleExportAll = () => {
    const data = {
      timestamp: new Date().toISOString(),
      btcPrice,
      change24h,
      sections: 30,
      mockData: true
    };
    const link = document.createElement('a');
    link.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    link.download = `satoshi-dashboard-export-${Date.now()}.json`;
    link.click();
  };

  return (
    <div className="fixed top-0 left-0 right-0 h-20 bg-gradient-to-b from-gray-950 to-gray-900 border-b border-gray-700/30 z-40">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left */}
        <div className="flex items-center gap-4">
          <img src="/logo.svg" alt="Satoshi Dashboard" className="h-9 w-auto max-w-[180px]" />
          <div className="flex flex-col">
            <span className="font-mono text-lg font-bold text-yellow-50">SATOSHI</span>
            <span className="font-mono text-xs text-gray-500">DASHBOARD</span>
          </div>
        </div>

        {/* Center */}
        <div className="flex flex-col items-center gap-1">
          <div className="text-4xl font-mono font-bold text-yellow-400">
            {fmt.usd(btcPrice, 2)}
          </div>
          <div className="flex items-center gap-2 text-sm font-mono">
            <span className="text-green-400 font-semibold">
              {fmt.pct(change24h, 2)}
            </span>
            <span className="text-gray-500 text-xs">24H</span>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-4">
          <div className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded text-yellow-400 text-xs font-mono font-semibold">
            MOCK DATA
          </div>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-yellow-400 transition"
          >
            <Github size={20} />
          </a>
          <button
            onClick={handleExportAll}
            className="flex items-center gap-2 px-3 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 hover:border-yellow-500/50 rounded font-mono text-xs text-yellow-400 transition"
          >
            <Download size={16} />
            <span>Export All</span>
          </button>
        </div>
      </div>
    </div>
  );
}
