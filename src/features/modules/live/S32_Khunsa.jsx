import { Suspense, useEffect, useState } from 'react';
import Copy from 'lucide-react/dist/esm/icons/copy';
import Github from 'lucide-react/dist/esm/icons/github';
import BitcoinDonationQr from '@/shared/components/common/BitcoinDonationQr.jsx';
import { ModuleShell } from '@/shared/components/module/index.js';

const ONCHAIN_ADDRESS = 'BC1QC2GD3YN8DTLMZG4UW786MFN085WE69F60V4R6F';
const LIGHTNING_ADDRESS = 'Khunsa@coinos.io';
const ONCHAIN_SHORT = 'BC1QC2\u2026R6F';
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

function DonationQrFallback({ size }) {
  return (
    <div
      className="flex items-center justify-center rounded-xl border border-[rgba(247,147,26,0.2)] bg-white p-2 text-center font-mono shadow-[0_8px_24px_rgba(0,0,0,0.28)]"
      style={{ color: '#111', width: size + 16, minWidth: size + 16, minHeight: size + 16, fontSize: 'var(--fs-micro)' }}
    >
      Loading QR...
    </div>
  );
}

function QrModal({ activeQr, setActiveQr, copiedLightning, copiedOnchain, onCopyLightning, onCopyOnchain, onClose }) {
  const showLightning = activeQr === 'lightning';

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-white/15 bg-[#0b0f18] p-5"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Donation QR options"
      >
        <div
          className="text-center font-mono"
          style={{ color: 'var(--accent-bitcoin)', fontSize: 'var(--fs-label)' }}
        >
          Support this Dashboard
        </div>

        {/* Tab switcher */}
        <div className="mt-4 flex gap-2 rounded-lg border border-white/10 bg-white/5 p-1">
          <button
            type="button"
            onClick={() => setActiveQr('lightning')}
            className="flex-1 rounded px-3 py-2 font-mono transition-all"
            style={{
              fontSize: 'var(--fs-caption)',
              backgroundColor: showLightning ? 'rgba(247,147,26,0.2)' : 'transparent',
              color: showLightning ? 'var(--accent-bitcoin)' : 'rgba(255,255,255,0.5)',
              border: showLightning ? '1px solid rgba(247,147,26,0.4)' : '1px solid transparent',
            }}
          >
            ⚡ Lightning
          </button>
          <button
            type="button"
            onClick={() => setActiveQr('btc')}
            className="flex-1 rounded px-3 py-2 font-mono transition-all"
            style={{
              fontSize: 'var(--fs-caption)',
              backgroundColor: !showLightning ? 'rgba(247,147,26,0.2)' : 'transparent',
              color: !showLightning ? 'var(--accent-bitcoin)' : 'rgba(255,255,255,0.5)',
              border: !showLightning ? '1px solid rgba(247,147,26,0.4)' : '1px solid transparent',
            }}
          >
            ₿ Bitcoin
          </button>
        </div>

        {/* QR */}
        <div className="mt-4 flex justify-center">
          <div className="flex flex-col items-center gap-3">
            <Suspense fallback={<DonationQrFallback size={176} />}>
              <BitcoinDonationQr
                value={showLightning ? LIGHTNING_ADDRESS : ONCHAIN_ADDRESS}
                size={176}
              />
            </Suspense>
            <div className="text-center font-mono text-white/65" style={{ fontSize: 'var(--fs-caption)' }}>
              {showLightning ? 'Scan to pay via Lightning' : 'Scan to donate BTC'}
            </div>
          </div>
        </div>

        {/* Copy button */}
        <button
          type="button"
          onClick={showLightning ? onCopyLightning : onCopyOnchain}
          className="mt-3 w-full overflow-hidden rounded border px-2 py-2 text-center font-mono transition-colors"
          style={{
            fontSize: 'var(--fs-caption)',
            borderColor: (showLightning ? copiedLightning : copiedOnchain) ? 'rgba(0,216,151,0.55)' : 'rgba(255,255,255,0.1)',
            background: (showLightning ? copiedLightning : copiedOnchain) ? 'rgba(0,216,151,0.08)' : 'rgba(255,255,255,0.04)',
            color: (showLightning ? copiedLightning : copiedOnchain) ? 'var(--accent-green)' : '#fff',
          }}
        >
          {(showLightning ? copiedLightning : copiedOnchain)
            ? '✓ Copied!'
            : (showLightning ? LIGHTNING_ADDRESS : ONCHAIN_SHORT)}
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

export default function S32_Khunsa() {
  const [copiedLightning, setCopiedLightning] = useState(false);
  const [copiedOnchain, setCopiedOnchain] = useState(false);
  const [thanksIndex, setThanksIndex] = useState(0);
  const [thanksVisible, setThanksVisible] = useState(true);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [activeQr, setActiveQr] = useState('lightning');

  const copyToClipboard = async (text, setCopied) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (ok) {
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        }
      } catch { /* ignore */ }
    }
  };

  const onCopyLightning = () => copyToClipboard(LIGHTNING_ADDRESS, setCopiedLightning);
  const onCopyOnchain = () => copyToClipboard(ONCHAIN_ADDRESS, setCopiedOnchain);

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
      <ModuleShell layout="none" className="flex items-start justify-center lg:items-center">

        <div className="w-full max-w-[1240px] px-5 py-6 pb-20 sm:px-9 sm:py-8 sm:pb-24 lg:px-14 lg:py-8 lg:pb-16 xl:px-20 xl:py-10 xl:pb-18">

          {/* HERO: rotating "thank you" */}
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

            <div
              className="glow-pulse mx-auto mt-2.5 h-[2px] w-24 rounded-full"
              style={{
                background: 'linear-gradient(90deg, rgba(247,147,26,0) 0%, rgba(247,147,26,0.9) 50%, rgba(247,147,26,0) 100%)',
                boxShadow: '0 0 16px rgba(247,147,26,0.35)',
              }}
            />
          </button>

          {/* CARD GRID */}
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

              {/* Address copy buttons */}
              <div className="mt-3.5 flex flex-col gap-2">
                {/* Lightning */}
                <button
                  type="button"
                  onClick={onCopyLightning}
                  className="group/ln relative w-full cursor-pointer overflow-hidden rounded border px-3 py-2 pr-10 text-left font-mono transition-all"
                  style={{
                    fontSize: 'var(--fs-micro)',
                    borderColor: copiedLightning ? 'rgba(0,216,151,0.55)' : 'rgba(255,255,255,0.1)',
                    background: copiedLightning ? 'rgba(0,216,151,0.08)' : 'transparent',
                    color: copiedLightning ? 'var(--accent-green)' : '#fff',
                    height: '44px',
                  }}
                  title="Click to copy Lightning address"
                >
                  <span className="block truncate leading-4">
                    <span style={{ color: 'var(--accent-bitcoin)', opacity: 0.8 }}>⚡ </span>
                    {LIGHTNING_ADDRESS}
                  </span>
                  <span
                    className="absolute inset-0 flex items-center justify-center bg-[#111111]/90 opacity-0 transition-opacity group-hover/ln:opacity-100"
                    style={{ fontSize: 'var(--fs-micro)' }}
                  >
                    <Copy size={14} className="mr-1.5" />
                    <span>Click to copy</span>
                  </span>
                  <span
                    className="absolute right-2 top-1/2 -translate-y-1/2 font-mono"
                    style={{
                      fontSize: 'var(--fs-tag)',
                      color: copiedLightning ? 'var(--accent-green)' : 'var(--text-primary)',
                      opacity: copiedLightning ? 1 : 0.6,
                    }}
                  >
                    {copiedLightning ? 'Copied' : <Copy size={12} />}
                  </span>
                </button>

                {/* On-chain */}
                <button
                  type="button"
                  onClick={onCopyOnchain}
                  className="group/btc relative w-full cursor-pointer overflow-hidden rounded border px-3 py-2 pr-10 text-left font-mono transition-all"
                  style={{
                    fontSize: 'var(--fs-micro)',
                    borderColor: copiedOnchain ? 'rgba(0,216,151,0.55)' : 'rgba(255,255,255,0.1)',
                    background: copiedOnchain ? 'rgba(0,216,151,0.08)' : 'transparent',
                    color: copiedOnchain ? 'var(--accent-green)' : '#fff',
                    height: '44px',
                  }}
                  title="Click to copy Bitcoin on-chain address"
                >
                  <span className="block truncate leading-4">
                    <span style={{ color: 'var(--accent-bitcoin)', opacity: 0.8 }}>₿ </span>
                    {ONCHAIN_SHORT}
                  </span>
                  <span
                    className="absolute inset-0 flex items-center justify-center bg-[#111111]/90 opacity-0 transition-opacity group-hover/btc:opacity-100"
                    style={{ fontSize: 'var(--fs-micro)' }}
                  >
                    <Copy size={14} className="mr-1.5" />
                    <span>Click to copy</span>
                  </span>
                  <span
                    className="absolute right-2 top-1/2 -translate-y-1/2 font-mono"
                    style={{
                      fontSize: 'var(--fs-tag)',
                      color: copiedOnchain ? 'var(--accent-green)' : 'var(--text-primary)',
                      opacity: copiedOnchain ? 1 : 0.6,
                    }}
                  >
                    {copiedOnchain ? 'Copied' : <Copy size={12} />}
                  </span>
                </button>
              </div>

              {/* QR modal trigger */}
              <button
                type="button"
                onClick={() => setQrModalOpen(true)}
                className="mt-3 w-full rounded border border-white/10 py-1.5 font-mono transition-colors hover:border-white/25 hover:bg-white/5"
                style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-caption)' }}
              >
                View QR codes →
              </button>

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
      </ModuleShell>

      {/* QR Modal */}
      {qrModalOpen && (
        <QrModal
          activeQr={activeQr}
          setActiveQr={setActiveQr}
          copiedLightning={copiedLightning}
          copiedOnchain={copiedOnchain}
          onCopyLightning={onCopyLightning}
          onCopyOnchain={onCopyOnchain}
          onClose={() => setQrModalOpen(false)}
        />
      )}
    </>
  );
}
