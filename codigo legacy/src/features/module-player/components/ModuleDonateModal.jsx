import { Suspense, lazy } from 'react';

const BitcoinDonationQr = lazy(() => import('@/shared/components/common/BitcoinDonationQr.jsx'));

function DonationQrFallback({ size }) {
  return (
    <div
      className="flex items-center justify-center rounded-xl border border-[rgba(247,147,26,0.2)] bg-white p-2 text-center font-mono shadow-[0_8px_24px_rgba(0,0,0,0.28)]"
      style={{ color: 'var(--bg-primary)', width: size + 16, minWidth: size + 16, minHeight: size + 16, fontSize: 'var(--fs-micro)' }}
      aria-label="Loading Bitcoin donation QR"
    >
      Loading QR...
    </div>
  );
}

export default function ModuleDonateModal({
  donateCopied,
  donationAddress,
  onClose,
  onCopyDonation,
}) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-white/15 bg-[#0b0f18] p-5"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Bitcoin donation options"
      >
        <div
          className="text-center font-mono"
          style={{ color: 'var(--accent-bitcoin)', fontSize: 'var(--fs-label)' }}
        >
          Support the Dashboard
        </div>
        <div className="mt-4 flex justify-center">
          <div className="flex flex-col items-center gap-3">
            <Suspense fallback={<DonationQrFallback size={176} />}>
              <BitcoinDonationQr value={donationAddress} size={176} />
            </Suspense>
            <div className="text-center font-mono text-white/65" style={{ fontSize: 'var(--fs-caption)' }}>
              Scan to donate BTC
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onCopyDonation}
          className="group/addr mt-3 w-full overflow-hidden rounded border px-2 py-2 text-center font-mono text-white transition-colors"
          style={{
            fontSize: 'var(--fs-caption)',
            borderColor: donateCopied ? 'rgba(0,216,151,0.55)' : 'rgba(255,255,255,0.1)',
            background: donateCopied ? 'rgba(0,216,151,0.08)' : 'rgba(255,255,255,0.04)',
            color: donateCopied ? 'var(--accent-green)' : '#fff',
          }}
        >
          {donateCopied ? '✓ Copied!' : (
            <>
              <span className="block truncate group-hover/addr:hidden">{donationAddress}</span>
              <span className="hidden text-white/60 group-hover/addr:block">Click to copy</span>
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full rounded border border-white/10 py-1.5 font-mono text-white/50 transition hover:border-white/25 hover:text-white/80"
          style={{ fontSize: 'var(--fs-caption)' }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
