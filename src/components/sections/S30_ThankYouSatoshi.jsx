import DashboardCard from '../common/DashboardCard';
import { Heart } from 'lucide-react';
import UniqueVisitorsCounter from '../common/UniqueVisitorsCounter';

export default function S30_ThankYouSatoshi() {
  const genesisHash = '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f';
  const whitePaperAbstract = 'A purely peer-to-peer electronic cash system would allow online payments to be sent directly from one party to another without going through a financial institution.';
  const blockZeroTime = 'January 3, 2009';

  return (
    <div id="section-29">
      <DashboardCard
        id="s30"
        title="Thank You, Satoshi"
        subtitle="Tribute to Bitcoin's creator"
        icon={Heart}
      >
        <div className="space-y-6">
          <UniqueVisitorsCounter />

          {/* Animated BTC Symbol */}
          <div className="flex justify-center py-4">
            <div className="text-9xl animate-pulse">₿</div>
          </div>

          {/* Genesis Block */}
          <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-950/20 border border-yellow-500/30 rounded-lg p-4 space-y-2">
            <div className="text-gray-500s uppercase tracking-widest mb-2">Genesis Block Hash</div>
            <div className="font-monos text-yellow-50 break-all">{genesisHash}</div>
            <div className="s text-gray-600 mt-2">Block Height 0 - {blockZeroTime}</div>
          </div>

          {/* Whitepaper Quote */}
          <div className="bg-gradient-to-br from-blue-900/30 to-blue-950/20 border border-blue-500/30 rounded-lg p-4 italic">
            <div className="text-blue-200 leading-relaxed" style={{ fontSize: 'var(--fs-micro)' }}>
              &ldquo;{whitePaperAbstract}&rdquo;
            </div>
            <div className="s text-blue-400 mt-3">— Bitcoin Whitepaper Abstract, 2008</div>
          </div>

          {/* Legacy */}
          <div className="space-y-2 text-gray-300" style={{ fontSize: 'var(--fs-micro)' }}>
            <p>Bitcoin was born from the ashes of the 2008 financial crisis. An idea that became reality:</p>
            <ul className="space-y-1s text-gray-400 list-disc list-inside">
              <li>Decentralized currency without central authority</li>
              <li>Immutable ledger secured by cryptography</li>
              <li>Peer-to-peer network eliminating intermediaries</li>
              <li>Proof-of-work enabling trustless consensus</li>
              <li>Fixed supply creating digital scarcity</li>
            </ul>
          </div>

          {/* Quote */}
          <div className="border-l-4 border-yellow-500 pl-4 italic text-gray-300">
            <p className="">&ldquo;We have elected to put the system in the hands of the people who use it. The result is Bitcoin.&rdquo;</p>
            <p className="s text-gray-500 mt-2">— Satoshi Nakamoto</p>
          </div>

          {/* Footer Message */}
          <div className="text-center pt-4 border-t border-gray-700/30">
            <div className="text-gray-600s uppercase tracking-widest">
              In memory of the pseudonymous visionary
            </div>
            <div className="text-yellow-400 font-mono mt-2 font-bold" style={{ fontSize: 'var(--fs-body)' }}>SATOSHI NAKAMOTO</div>
            <div className="text-gray-600s mt-1">
              Forever grateful for the technological breakthrough that is Bitcoin
            </div>
          </div>

          {/* Easter Egg */}
          <div className="text-centers text-gray-600 opacity-60 hover:opacity-100 transition pt-2">
            If you read this: Hodl strong. The revolution will not be televised, it will be decentralized.
          </div>
        </div>
      </DashboardCard>
    </div>
  );
}
