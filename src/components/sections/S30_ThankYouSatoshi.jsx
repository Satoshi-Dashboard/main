import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import DashboardCard from '../common/DashboardCard';

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

export default function S30_ThankYouSatoshi() {
  const genesisHash = '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f';
  const whitePaperAbstract = 'A purely peer-to-peer electronic cash system would allow online payments to be sent directly from one party to another without going through a financial institution.';

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

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setQrOpen(false);
    };

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
    <div id="section-29">
      <DashboardCard
        id="s29"
        title="Thank You, Satoshi"
        subtitle="Tribute to Bitcoin's creator"
        icon={Heart}
      >
        <div className="mx-auto w-full max-w-[1400px] space-y-4 px-2 sm:space-y-5 sm:px-4 lg:px-10 xl:px-14 2xl:px-20">
          <section className="fade-up bg-transparent px-3 py-6 sm:px-6 sm:py-8 lg:py-10" style={{ animationDelay: '40ms', animationFillMode: 'forwards' }}>
            <div className="mx-auto max-w-[980px] text-center">
              <div
                className="font-mono uppercase tracking-[0.24em]"
                style={{
                  fontSize: 'var(--fs-caption)',
                  color: 'var(--text-tertiary)',
                }}
              >
                Global Gratitude
              </div>

              <div className="mx-auto mt-3 flex h-[clamp(86px,11vw,136px)] max-w-[1120px] items-center justify-center overflow-hidden px-2 sm:px-5">
                <div
                  className="font-semibold leading-[1.08]"
                  style={{
                    fontFamily: THANKS_FONT_STACK,
                    letterSpacing: '-0.015em',
                    fontSize: 'clamp(1.35rem, 4.2vw, 3.2rem)',
                    color: 'var(--text-primary)',
                    textShadow: '0 0 24px rgba(247,147,26,0.2)',
                    opacity: thanksVisible ? 1 : 0,
                    transform: `translateY(${thanksVisible ? 0 : 6}px)`,
                    transition: 'opacity 220ms ease, transform 220ms ease',
                  }}
                >
                  {THANK_YOU_MESSAGES[thanksIndex]}
                </div>
              </div>

              <div
                className="glow-pulse mx-auto mt-2 h-[2px] w-28 rounded-full"
                style={{
                  background: 'linear-gradient(90deg, rgba(247,147,26,0) 0%, rgba(247,147,26,0.9) 50%, rgba(247,147,26,0) 100%)',
                  boxShadow: '0 0 16px rgba(247,147,26,0.35)',
                }}
              />
            </div>
          </section>

          <div className="grid gap-4 lg:gap-5 xl:grid-cols-2">
            <article className="fade-up rounded-xl border border-gray-700/30 bg-transparent p-4 sm:p-5" style={{ animationDelay: '90ms', animationFillMode: 'forwards' }}>
              <div className="font-mono text-white" style={{ fontSize: 'var(--fs-section)' }}>
                <span style={{ color: 'var(--accent-bitcoin)', marginRight: 8 }}>•</span>
                Genesis Block Information
              </div>
              <div className="mt-3 h-px bg-white/10" />
              <div className="mt-4 space-y-2 font-mono" style={{ fontSize: 'var(--fs-body)' }}>
                <div style={{ color: 'var(--text-secondary)' }}>Genesis Block Hash</div>
                <div className="break-all text-white">{genesisHash}</div>
                <div style={{ color: 'var(--text-secondary)' }}>Block Height 0 — January 3, 2009</div>
              </div>
            </article>

            <article className="fade-up rounded-xl border border-gray-700/30 bg-transparent p-4 sm:p-5" style={{ animationDelay: '140ms', animationFillMode: 'forwards' }}>
              <div className="font-mono text-white" style={{ fontSize: 'var(--fs-section)' }}>
                Bitcoin Principles
              </div>
              <div className="mt-3 h-px bg-white/10" />
              <ul className="mt-4 space-y-2.5 font-mono" style={{ fontSize: 'var(--fs-body)' }}>
                {PRINCIPLES.map((item) => (
                  <li key={item} className="flex items-start gap-3" style={{ color: 'var(--text-secondary)' }}>
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: 'var(--accent-bitcoin)' }} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="fade-up rounded-xl border border-gray-700/30 bg-transparent p-4 sm:p-5" style={{ animationDelay: '190ms', animationFillMode: 'forwards' }}>
              <div className="font-mono italic leading-relaxed text-white" style={{ fontSize: 'var(--fs-heading)' }}>
                &ldquo;{whitePaperAbstract}&rdquo;
              </div>
              <div className="mt-3 font-mono" style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-body)' }}>
                — Bitcoin Whitepaper Abstract, 2008
              </div>
            </article>

            <article className="fade-up rounded-xl border border-gray-700/30 bg-transparent p-4 sm:p-5" style={{ animationDelay: '240ms', animationFillMode: 'forwards' }}>
              <div className="font-mono text-white" style={{ fontSize: 'var(--fs-section)' }}>
                Support this Dashboard
              </div>
              <p className="mt-2 font-mono" style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-caption)' }}>
                If this website is useful to you consider donating to this wallet.
              </p>

              <div className="mt-3 flex items-start gap-3">
                <div className="group relative min-w-0 flex-1">
                  <a
                    href={DONATION_URI}
                    className="block break-all rounded border border-white/10 bg-transparent px-2 py-2 pr-16 font-mono text-white"
                    style={{ fontSize: 'var(--fs-caption)' }}
                    title="Open Bitcoin wallet"
                  >
                    {DONATION_ADDRESS}
                  </a>

                  <button
                    type="button"
                    onClick={onCopyAddress}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded border px-2 py-1 font-mono transition-opacity lg:pointer-events-none lg:opacity-0 lg:group-hover:pointer-events-auto lg:group-hover:opacity-100 lg:group-focus-within:pointer-events-auto lg:group-focus-within:opacity-100"
                    style={{
                      borderColor: copied ? 'rgba(0,216,151,0.55)' : 'rgba(255,255,255,0.2)',
                      color: copied ? 'var(--accent-green)' : 'var(--text-primary)',
                      background: 'rgba(10,10,15,0.95)',
                      fontSize: 'var(--fs-micro)',
                    }}
                    title="Copy donation address"
                  >
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>

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
      </DashboardCard>

      {qrOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setQrOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-white/15 bg-[#0b0f18] p-4"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Bitcoin donation QR"
          >
            <div className="font-mono text-center" style={{ color: 'var(--accent-bitcoin)', fontSize: 'var(--fs-label)' }}>
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
            <div className="mt-3 break-all rounded border border-white/10 bg-white/5 px-2 py-2 text-center font-mono text-white" style={{ fontSize: 'var(--fs-caption)' }}>
              {DONATION_ADDRESS}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
