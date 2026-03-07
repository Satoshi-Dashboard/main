import { useEffect, useState } from 'react';

const DONATION_ADDRESS = 'BC1QC2GD3YN8DTLMZG4UW786MFN085WE69F60V4R6F';
const DONATION_URI = `bitcoin:${DONATION_ADDRESS}`;
const DONATION_QR_URL = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(DONATION_URI)}`;
const THANKS_FONT_STACK = "'SF Pro Display', 'Helvetica Neue', Arial, sans-serif";

const THANK_YOU_MESSAGES = [
  'Thank you, Satoshi Nakamoto',
  'Gracias, Satoshi Nakamoto',
  'Obrigado, Satoshi Nakamoto',
  'Merci, Satoshi Nakamoto',
  'Danke, Satoshi Nakamoto',
  'Grazie, Satoshi Nakamoto',
  'Bedankt, Satoshi Nakamoto',
  'Tack, Satoshi Nakamoto',
  'Dziekuje, Satoshi Nakamoto',
  'Tesekkurler, Satoshi Nakamoto',
  'Shukriya, Satoshi Nakamoto',
  'Arigato, Satoshi Nakamoto',
  'Xie xie, Satoshi Nakamoto',
  'Kamsahamnida, Satoshi Nakamoto',
  'Spasibo, Satoshi Nakamoto',
  'Efharisto, Satoshi Nakamoto',
  'Toda, Satoshi Nakamoto',
  'Shukran, Satoshi Nakamoto',
  'Asante, Satoshi Nakamoto',
  'Terima kasih, Satoshi Nakamoto',
  'Salamat, Satoshi Nakamoto',
  'Cam on, Satoshi Nakamoto',
  'Khop khun, Satoshi Nakamoto',
  'Mulțumesc, Satoshi Nakamoto',
  'Dekuji, Satoshi Nakamoto',
  'Ďakujem, Satoshi Nakamoto',
  'Hvala, Satoshi Nakamoto',
  'Kiitos, Satoshi Nakamoto',
  'Takk, Satoshi Nakamoto',
  'Dankie, Satoshi Nakamoto',
  'Je vous remercie, Satoshi Nakamoto',
  'Gracias infinitas, Satoshi Nakamoto',
  'ありがとう, Satoshi Nakamoto',
  '谢谢, Satoshi Nakamoto',
  '감사합니다, Satoshi Nakamoto',
  'Спасибо, Satoshi Nakamoto',
  'شكرا, Satoshi Nakamoto',
  'धन्यवाद, Satoshi Nakamoto',
  'ขอบคุณ, Satoshi Nakamoto',
  'Cảm ơn, Satoshi Nakamoto',
  'Terima kasih banyak, Satoshi Nakamoto',
  'Maraming salamat, Satoshi Nakamoto',
  'Grazie mille, Satoshi Nakamoto',
];

const PRINCIPLES = [
  'Decentralized currency with no central authority',
  'Immutable ledger secured by cryptography',
  'Peer-to-peer network eliminating intermediaries',
  'Proof-of-work creating consensus',
  'Fixed supply creating digital scarcity',
];

const GENESIS_HASH = '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f';
const WHITEPAPER = 'A purely peer-to-peer electronic cash system would allow online payments to be sent directly from one party to another without going through a financial institution.';

export default function S30_ThankYouSatoshi() {
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [thanksIndex, setThanksIndex] = useState(0);
  const [thanksVisible, setThanksVisible] = useState(true);

  const onCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(DONATION_ADDRESS);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  useEffect(() => {
    if (!qrOpen) return undefined;
    const onKeyDown = (e) => { if (e.key === 'Escape') setQrOpen(false); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [qrOpen]);

  useEffect(() => {
    let switchTimer = null;
    const timer = setInterval(() => {
      setThanksVisible(false);
      switchTimer = setTimeout(() => {
        setThanksIndex((prev) => (prev + 1) % THANK_YOU_MESSAGES.length);
        setThanksVisible(true);
      }, 220);
    }, 2300);
    return () => {
      clearInterval(timer);
      if (switchTimer) clearTimeout(switchTimer);
    };
  }, []);

  return (
    <>
      {/* ── FULL VIEWPORT WRAPPER ── */}
      {/* mobile/tablet: scrollable from top; desktop: vertically centered */}
      <div className="flex h-full w-full items-start justify-center overflow-y-auto bg-[#111111] lg:items-center">

        {/* ── CONTENT BLOCK — breathing room on all 4 sides ── */}
        <div className="w-full max-w-[1280px] px-5 py-8 sm:px-10 sm:py-10 lg:px-16 lg:py-10 xl:px-24 xl:py-12">

          {/* ── HERO: rotating "thank you" ── */}
          <div className="mb-8 text-center sm:mb-10">
            <div
              className="font-mono uppercase tracking-[0.24em]"
              style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-tertiary)' }}
            >
              Global Gratitude
            </div>

            <div className="mx-auto mt-4 flex h-[clamp(72px,9vw,120px)] max-w-[1100px] items-center justify-center overflow-hidden px-2">
              <span
                className="font-semibold leading-tight"
                style={{
                  fontFamily: THANKS_FONT_STACK,
                  letterSpacing: '-0.015em',
                  fontSize: 'clamp(1.35rem, 4vw, 3rem)',
                  color: 'var(--text-primary)',
                  textShadow: '0 0 32px rgba(247,147,26,0.22)',
                  opacity: thanksVisible ? 1 : 0,
                  transform: `translateY(${thanksVisible ? 0 : 6}px)`,
                  transition: 'opacity 220ms ease, transform 220ms ease',
                }}
              >
                {THANK_YOU_MESSAGES[thanksIndex]}
              </span>
            </div>

            {/* orange accent line */}
            <div
              className="glow-pulse mx-auto mt-3 h-[2px] w-28 rounded-full"
              style={{
                background: 'linear-gradient(90deg, rgba(247,147,26,0) 0%, rgba(247,147,26,0.9) 50%, rgba(247,147,26,0) 100%)',
                boxShadow: '0 0 16px rgba(247,147,26,0.35)',
              }}
            />
          </div>

          {/* ── CARD GRID ── */}
          <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">

            {/* Genesis Block */}
            <article className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
              <div className="flex items-center gap-2 font-mono text-white" style={{ fontSize: 'var(--fs-section)' }}>
                <span style={{ color: 'var(--accent-bitcoin)' }}>•</span>
                Genesis Block Information
              </div>
              <div className="mt-3 h-px bg-white/10" />
              <div className="mt-4 space-y-2 font-mono" style={{ fontSize: 'var(--fs-body)' }}>
                <div style={{ color: 'var(--text-secondary)' }}>Genesis Block Hash</div>
                <div className="break-all text-white">{GENESIS_HASH}</div>
                <div style={{ color: 'var(--text-secondary)' }}>Block Height 0 — January 3, 2009</div>
              </div>
            </article>

            {/* Bitcoin Principles */}
            <article className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
              <div className="font-mono text-white" style={{ fontSize: 'var(--fs-section)' }}>
                Bitcoin Principles
              </div>
              <div className="mt-3 h-px bg-white/10" />
              <ul className="mt-4 space-y-2.5 font-mono" style={{ fontSize: 'var(--fs-body)' }}>
                {PRINCIPLES.map((item) => (
                  <li key={item} className="flex items-start gap-3" style={{ color: 'var(--text-secondary)' }}>
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: 'var(--accent-bitcoin)' }}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </article>

            {/* Whitepaper quote */}
            <article className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
              <div
                className="font-mono italic leading-relaxed text-white"
                style={{ fontSize: 'var(--fs-heading)' }}
              >
                &ldquo;{WHITEPAPER}&rdquo;
              </div>
              <div
                className="mt-3 font-mono"
                style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-body)' }}
              >
                — Bitcoin Whitepaper Abstract, 2008
              </div>
            </article>

            {/* Donation */}
            <article className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
              <div className="font-mono text-white" style={{ fontSize: 'var(--fs-section)' }}>
                Support this Dashboard
              </div>
              <p
                className="mt-2 font-mono"
                style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-caption)' }}
              >
                If this website is useful to you consider donating to this wallet.
              </p>

              <div className="mt-4 flex items-start gap-3">
                {/* address + copy */}
                <div className="group relative min-w-0 flex-1">
                  <a
                    href={DONATION_URI}
                    className="block break-all rounded border border-white/10 bg-transparent px-3 py-2 pr-16 font-mono text-white transition hover:border-white/20"
                    style={{ fontSize: 'var(--fs-caption)' }}
                    title="Open Bitcoin wallet"
                  >
                    {DONATION_ADDRESS}
                  </a>
                  <button
                    type="button"
                    onClick={onCopyAddress}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded border px-2 py-1 font-mono transition lg:pointer-events-none lg:opacity-0 lg:group-hover:pointer-events-auto lg:group-hover:opacity-100"
                    style={{
                      borderColor: copied ? 'rgba(0,216,151,0.55)' : 'rgba(255,255,255,0.2)',
                      color: copied ? 'var(--accent-green)' : 'var(--text-primary)',
                      background: 'rgba(10,10,15,0.95)',
                      fontSize: 'var(--fs-micro)',
                    }}
                    title="Copy donation address"
                  >
                    {copied ? 'Copied ✓' : 'Copy'}
                  </button>
                </div>

                {/* QR thumbnail */}
                <button
                  type="button"
                  onClick={() => setQrOpen(true)}
                  className="shrink-0 rounded border border-white/15 bg-white/5 p-1 transition-transform duration-300 hover:scale-105"
                  title="Expand QR"
                  aria-label="Expand QR"
                >
                  <img
                    src={DONATION_QR_URL}
                    alt="Bitcoin donation QR"
                    className="h-20 w-20 rounded sm:h-24 sm:w-24"
                    loading="lazy"
                  />
                </button>
              </div>
            </article>

          </div>
        </div>
      </div>

      {/* ── QR MODAL ── */}
      {qrOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setQrOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-white/15 bg-[#0b0f18] p-5"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Bitcoin donation QR"
          >
            <div
              className="text-center font-mono"
              style={{ color: 'var(--accent-bitcoin)', fontSize: 'var(--fs-label)' }}
            >
              Scan to Donate
            </div>
            <div className="mt-3 flex justify-center">
              <img
                src={DONATION_QR_URL}
                alt="Bitcoin donation QR code"
                className="h-56 w-56 max-w-full rounded border border-white/15 bg-white p-2"
                loading="lazy"
              />
            </div>
            <div
              className="mt-3 break-all rounded border border-white/10 bg-white/5 px-2 py-2 text-center font-mono text-white"
              style={{ fontSize: 'var(--fs-caption)' }}
            >
              {DONATION_ADDRESS}
            </div>
            <button
              type="button"
              onClick={() => setQrOpen(false)}
              className="mt-3 w-full rounded border border-white/10 py-1.5 font-mono text-white/50 transition hover:border-white/25 hover:text-white/80"
              style={{ fontSize: 'var(--fs-caption)' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
