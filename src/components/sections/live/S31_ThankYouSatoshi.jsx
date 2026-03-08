import { useEffect, useState } from 'react';
import { Copy, Github } from 'lucide-react';
import BitcoinDonationQr from '../../common/BitcoinDonationQr';

const DONATION_ADDRESS = 'BC1QC2GD3YN8DTLMZG4UW786MFN085WE69F60V4R6F';
const THANKS_FONT_STACK = "'SF Pro Display', 'Helvetica Neue', Arial, sans-serif";

const THANK_YOU_MESSAGES = [
  'Thank you, Satoshi Nakamoto',
  'Thank you for Bitcoin, Satoshi Nakamoto',
  'Thank you for open money, Satoshi Nakamoto',
  'Thank you for proof-of-work, Satoshi Nakamoto',
  'Thank you for digital scarcity, Satoshi Nakamoto',
  'Thank you for decentralization, Satoshi Nakamoto',
  'Thank you for the whitepaper, Satoshi Nakamoto',
  'Thank you for the network, Satoshi Nakamoto',
  'Thank you for the idea, Satoshi Nakamoto',
  'Thank you for the protocol, Satoshi Nakamoto',
  'Thank you for the block chain, Satoshi Nakamoto',
  'Thank you for the genesis block, Satoshi Nakamoto',
  'Thank you for censorship resistance, Satoshi Nakamoto',
  'Thank you for peer-to-peer money, Satoshi Nakamoto',
  'Thank you for the signal, Satoshi Nakamoto',
  'Thank you for the standard, Satoshi Nakamoto',
  'Thank you for the breakthrough, Satoshi Nakamoto',
  'Thank you for the blueprint, Satoshi Nakamoto',
  'Thank you for the code, Satoshi Nakamoto',
  'Thank you for the movement, Satoshi Nakamoto',
  'Thank you for the mission, Satoshi Nakamoto',
  'Thank you for sound money, Satoshi Nakamoto',
  'Thank you for the inspiration, Satoshi Nakamoto',
  'Thank you for the launch, Satoshi Nakamoto',
  'Thank you for the foundation, Satoshi Nakamoto',
  'Thank you for the future, Satoshi Nakamoto',
  'With gratitude, Satoshi Nakamoto',
  'Endless thanks, Satoshi Nakamoto',
  'Respect to Satoshi Nakamoto',
  'Gratitude to Satoshi Nakamoto',
  'Forever grateful, Satoshi Nakamoto',
  'Bitcoin changed everything, Satoshi Nakamoto',
  'The network says thank you, Satoshi Nakamoto',
  'The stackers say thank you, Satoshi Nakamoto',
  'The builders say thank you, Satoshi Nakamoto',
  'The believers say thank you, Satoshi Nakamoto',
  'The open network says thank you, Satoshi Nakamoto',
  'Thank you for the orange spark, Satoshi Nakamoto',
  'Thank you for the first block, Satoshi Nakamoto',
  'Thank you for financial freedom, Satoshi Nakamoto',
  'Thank you for a new monetary era, Satoshi Nakamoto',
  'Thank you for a borderless network, Satoshi Nakamoto',
  'Thank you for everything, Satoshi Nakamoto',
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

export default function S31_ThankYouSatoshi() {
  const [copied, setCopied] = useState(false);
  const [thanksIndex, setThanksIndex] = useState(0);
  const [thanksVisible, setThanksVisible] = useState(true);

  const onCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(DONATION_ADDRESS);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = DONATION_ADDRESS;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (successful) {
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        }
      } catch { /* ignore */ }
    }
  };

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
          <button
            type="button"
            onClick={() => window.open('https://bitcoin.org/bitcoin.pdf', '_blank')}
            className="mb-8 w-full cursor-pointer text-center sm:mb-10"
          >
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
          </button>

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

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start">
                <button
                  type="button"
                  onClick={onCopyAddress}
                  className="group/addr relative min-w-0 flex-1 cursor-pointer overflow-hidden rounded border px-3 py-2 pr-10 text-left font-mono transition-all"
                  style={{
                    fontSize: 'var(--fs-micro)',
                    borderColor: copied ? 'rgba(0,216,151,0.55)' : 'rgba(255,255,255,0.1)',
                    background: copied ? 'rgba(0,216,151,0.08)' : 'transparent',
                    color: copied ? 'var(--accent-green)' : '#fff',
                    height: '48px',
                  }}
                  title="Click to copy"
                >
                  <span className="block break-all leading-4">{DONATION_ADDRESS}</span>
                  <span
                    className="absolute inset-0 flex items-center justify-center bg-[#111111]/90 opacity-0 transition-opacity group-hover/addr:opacity-100"
                    style={{ fontSize: 'var(--fs-micro)' }}
                  >
                    <Copy size={14} className="mr-1.5" />
                    <span>Click to copy</span>
                  </span>
                  <span
                    className="absolute right-2 top-1/2 -translate-y-1/2 font-mono"
                    style={{
                      fontSize: 'var(--fs-tag)',
                      color: copied ? 'var(--accent-green)' : 'var(--text-primary)',
                      opacity: copied ? 1 : 0.6,
                    }}
                  >
                    {copied ? 'Copied' : <Copy size={12} />}
                  </span>
                </button>

                <div className="flex shrink-0 flex-col items-center self-center sm:self-start">
                  <BitcoinDonationQr value={DONATION_ADDRESS} size={112} />
                </div>
              </div>

              {/* GitHub link */}
              <a
                href="https://github.com/Satoshi-Dashboard"
                target="_blank"
                rel="noreferrer"
                className="mt-3 flex items-center gap-2 font-mono transition-opacity hover:opacity-80"
                style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-caption)' }}
              >
                <Github size={14} />
                <span>github.com/Satoshi-Dashboard</span>
              </a>
            </article>

          </div>
        </div>
      </div>
    </>
  );
}
