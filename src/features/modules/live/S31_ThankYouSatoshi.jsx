import { useEffect, useState } from 'react';
import Copy from 'lucide-react/dist/esm/icons/copy';
import Github from 'lucide-react/dist/esm/icons/github';
import BitcoinDonationQr from '@/shared/components/common/BitcoinDonationQr.jsx';

const DONATION_ADDRESS = 'BC1QC2GD3YN8DTLMZG4UW786MFN085WE69F60V4R6F';
const THANKS_FONT_STACK = "'SF Pro Display', 'Helvetica Neue', Arial, sans-serif";

const THANK_YOU_MESSAGES = [
  'Thank you Satoshi Nakamoto',
  'Gracias Satoshi Nakamoto',
  'Merci Satoshi Nakamoto',
  'Danke Satoshi Nakamoto',
  'Grazie Satoshi Nakamoto',
  'Obrigado Satoshi Nakamoto',
  'Bedankt Satoshi Nakamoto',
  'Tack Satoshi Nakamoto',
  'Dziękuję Satoshi Nakamoto',
  'Teşekkürler Satoshi Nakamoto',
  'شكرا ساتوشي ناكاموتو',
  'धन्यवाद सतोशी नाकामोटो',
  'ধন্যবাদ সাতোশি নাকামোতো',
  'شکریہ ساتوشی ناکاموتو',
  'Спасибо Сатоши Накамото',
  'Дякую Сатоші Накамото',
  'Ευχαριστώ Σατόσι Νακαμότο',
  'תודה סאטושי נקאמוטו',
  'ممنون ساتوشی ناکاموتو',
  '谢谢中本聪',
  '謝謝中本聰',
  'ありがとう サトシ・ナカモト',
  '감사합니다 사토시 나카모토',
  'ขอบคุณ ซาโตชิ นากาโมโตะ',
  'Cảm ơn Satoshi Nakamoto',
  'Terima kasih Satoshi Nakamoto',
  'Salamat Satoshi Nakamoto',
  'Asante Satoshi Nakamoto',
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
        <div className="w-full max-w-[1240px] px-5 py-6 pb-20 sm:px-9 sm:py-8 sm:pb-24 lg:px-14 lg:py-8 lg:pb-16 xl:px-20 xl:py-10 xl:pb-18">

          {/* ── HERO: rotating "thank you" ── */}
          <button
            type="button"
            onClick={() => window.open('https://bitcoin.org/bitcoin.pdf', '_blank')}
            className="mb-6 w-full cursor-pointer text-center sm:mb-8"
          >
            <div
              className="font-mono uppercase tracking-[0.24em]"
              style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-tertiary)' }}
            >
              Global Gratitude
            </div>

            <div className="mx-auto mt-3 flex h-[clamp(68px,8vw,108px)] max-w-[1040px] items-center justify-center overflow-hidden px-2">
              <span
                className="font-semibold leading-tight"
                style={{
                  fontFamily: THANKS_FONT_STACK,
                  letterSpacing: '-0.015em',
                  fontSize: 'clamp(1.25rem, 3.6vw, 2.7rem)',
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
              className="glow-pulse mx-auto mt-2.5 h-[2px] w-24 rounded-full"
              style={{
                background: 'linear-gradient(90deg, rgba(247,147,26,0) 0%, rgba(247,147,26,0.9) 50%, rgba(247,147,26,0) 100%)',
                boxShadow: '0 0 16px rgba(247,147,26,0.35)',
              }}
            />
          </button>

          {/* ── CARD GRID ── */}
          <div className="grid gap-3.5 sm:gap-4 lg:grid-cols-2">

            {/* Genesis Block */}
            <article className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4.5 sm:p-5.5">
              <div className="flex items-center gap-2 font-mono text-white" style={{ fontSize: 'var(--fs-section)' }}>
                <span style={{ color: 'var(--accent-bitcoin)' }}>•</span>
                Genesis Block Information
              </div>
              <div className="mt-3 h-px bg-white/10" />
              <div className="mt-3.5 space-y-1.5 font-mono" style={{ fontSize: 'var(--fs-body)' }}>
                <div style={{ color: 'var(--text-secondary)' }}>Genesis Block Hash</div>
                <div className="break-all text-white">{GENESIS_HASH}</div>
                <div style={{ color: 'var(--text-secondary)' }}>Block Height 0 — January 3, 2009</div>
              </div>
            </article>

            {/* Bitcoin Principles */}
            <article className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4.5 sm:p-5.5">
              <div className="font-mono text-white" style={{ fontSize: 'var(--fs-section)' }}>
                Bitcoin Principles
              </div>
              <div className="mt-3 h-px bg-white/10" />
              <ul className="mt-3.5 space-y-2 font-mono" style={{ fontSize: 'var(--fs-body)' }}>
                {PRINCIPLES.map((item) => (
                  <li key={item} className="flex items-start gap-2.5" style={{ color: 'var(--text-secondary)' }}>
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
            <article className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4.5 sm:p-5.5">
              <div
                className="font-mono italic leading-relaxed text-white"
                style={{ fontSize: 'clamp(1.08rem, 1.8vw, 1.35rem)' }}
              >
                &ldquo;{WHITEPAPER}&rdquo;
              </div>
              <div
                className="mt-2.5 font-mono"
                style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-body)' }}
              >
                — Bitcoin Whitepaper Abstract, 2008
              </div>
            </article>

            {/* Donation */}
            <article className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4.5 sm:p-5.5">
              <div className="font-mono text-white" style={{ fontSize: 'var(--fs-section)' }}>
                Support this Dashboard
              </div>
              <p
                className="mt-1.5 font-mono"
                style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-caption)' }}
              >
                If this website is useful to you consider donating to this wallet.
              </p>

              <div className="mt-3.5 flex flex-col gap-2.5 sm:flex-row sm:items-start">
                <button
                  type="button"
                  onClick={onCopyAddress}
                  className="group/addr relative min-w-0 flex-1 cursor-pointer overflow-hidden rounded border px-3 py-2 pr-10 text-left font-mono transition-all"
                  style={{
                    fontSize: 'var(--fs-micro)',
                    borderColor: copied ? 'rgba(0,216,151,0.55)' : 'rgba(255,255,255,0.1)',
                    background: copied ? 'rgba(0,216,151,0.08)' : 'transparent',
                    color: copied ? 'var(--accent-green)' : '#fff',
                     height: '44px',
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
                  <BitcoinDonationQr value={DONATION_ADDRESS} size={104} />
                </div>
              </div>

              {/* GitHub links */}
              <div className="mt-2.5 flex flex-col gap-2">
                <a
                  href="https://github.com/Satoshi-Dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 font-mono transition-opacity hover:opacity-80"
                  style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-caption)' }}
                >
                  <Github size={14} />
                  <span>github.com/Satoshi-Dashboard</span>
                </a>
                <a
                  href="https://github.com/Satoshi-Dashboard/project-supporters/blob/main/README.md"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 font-mono transition-opacity hover:opacity-80"
                  style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-caption)' }}
                >
                  <Github size={14} />
                  <span>Project supporters</span>
                </a>
              </div>
            </article>

          </div>
        </div>
      </div>
    </>
  );
}
