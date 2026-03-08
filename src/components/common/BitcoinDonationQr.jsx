import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export default function BitcoinDonationQr({ value, size = 144, className = '' }) {
  const [svgMarkup, setSvgMarkup] = useState('');

  useEffect(() => {
    let active = true;

    QRCode.toString(value, {
      type: 'svg',
      errorCorrectionLevel: 'M',
      margin: 1,
      width: size,
      color: {
        dark: '#111111',
        light: '#FFFFFF',
      },
    })
      .then((markup) => {
        if (active) setSvgMarkup(markup);
      })
      .catch(() => {
        if (active) setSvgMarkup('');
      });

    return () => {
      active = false;
    };
  }, [size, value]);

  return (
    <div
      className={`overflow-hidden rounded-xl border border-[#F7931A]/20 bg-white p-2 shadow-[0_8px_24px_rgba(0,0,0,0.28)] ${className}`.trim()}
      style={{ width: size + 16, minWidth: size + 16, minHeight: size + 16 }}
      aria-label="Bitcoin donation QR"
    >
      {svgMarkup ? (
        <div dangerouslySetInnerHTML={{ __html: svgMarkup }} />
      ) : (
        <div
          className="flex items-center justify-center bg-white text-center font-mono text-[#111111]"
          style={{ width: size, height: size, fontSize: 'var(--fs-micro)' }}
        >
          Loading QR...
        </div>
      )}
    </div>
  );
}
