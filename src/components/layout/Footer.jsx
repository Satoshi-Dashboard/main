export default function Footer() {
  const currentDate = new Date();
  const year = currentDate.getFullYear();

  return (
    <footer className="bg-gradient-to-t from-gray-950 to-gray-900 border-t border-gray-700/30 mt-12 py-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-yellow-50 font-mono font-bold mb-2">SATOSHI DASHBOARD</h3>
            <p className="text-gray-500 text-sm font-mono">Built with love for Bitcoin</p>
          </div>

          <div>
            <h4 className="text-yellow-400 font-mono text-xs uppercase tracking-widest mb-3">Data Sources</h4>
            <ul className="space-y-1 text-gray-500 text-xs font-mono">
              <li>Blockchain.com API</li>
              <li>Google Trends (proxy)</li>
              <li>Mock Market Data</li>
            </ul>
          </div>

          <div>
            <h4 className="text-yellow-400 font-mono text-xs uppercase tracking-widest mb-3">Info</h4>
            <ul className="space-y-1 text-gray-500 text-xs font-mono">
              <li>Phase 1: UI Shell</li>
              <li>Version: 0.1.0</li>
              <li>Updated: {currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700/20 pt-6">
          <p className="text-center text-gray-600 text-xs font-mono">
            Copyright {year} SATOSHI DASHBOARD. Always verify data before making financial decisions.
          </p>
        </div>
      </div>
    </footer>
  );
}
