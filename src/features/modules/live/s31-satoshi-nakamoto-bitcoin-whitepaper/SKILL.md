---
code: S31
title: Thank You Satoshi
description: Tribute module to Satoshi Nakamoto with rotating multilingual thank-you messages, Genesis Block info, Bitcoin principles, whitepaper abstract, and donation card
category: live
status: published
providers: []
refreshSeconds: 0
---

# Thank You Satoshi (S31)

## Description

The Thank You Satoshi module is a static tribute page honoring Satoshi Nakamoto. It displays:

- **Rotating Multilingual Messages:** "Thank you Satoshi Nakamoto" cycling through 28 languages every 2.3 seconds with fade/slide transition
- **Genesis Block Card:** Genesis block hash, block height 0, and creation date (January 3, 2009)
- **Bitcoin Principles Card:** 5 core Bitcoin principles listed as bullet points
- **Whitepaper Abstract Quote:** Key quote from the Bitcoin whitepaper (2008)
- **Support / Donation Card:** Bitcoin donation address with copy-to-clipboard, QR code, and GitHub links

## Data Sources

This module is entirely static — no external API calls are made. All content is hardcoded:

- `THANK_YOU_MESSAGES`: Array of 28 multilingual thank-you strings
- `PRINCIPLES`: Array of 5 Bitcoin principle strings
- `GENESIS_HASH`: The well-known genesis block hash string
- `WHITEPAPER`: The whitepaper abstract quote
- `DONATION_ADDRESS`: Bitcoin donation wallet address

## Component Structure

### Main Component: S31_ThankYouSatoshi()

Wraps content in `<ModuleShell layout="none">` centered vertically on desktop.

### State
- `thanksIndex` (number): Index into `THANK_YOU_MESSAGES` array
- `thanksVisible` (boolean): Controls fade/slide transition opacity
- `copied` (boolean): Clipboard copy confirmation state

### Rotation Logic
```javascript
setInterval(() => {
  setThanksVisible(false);            // fade out
  setTimeout(() => {
    setThanksIndex(prev => (prev + 1) % messages.length);
    setThanksVisible(true);           // fade in
  }, 220);
}, 2300);
```

### Sub-Components (inline, no separate files)

#### Rotating Hero
- Click opens `https://bitcoin.org/bitcoin.pdf` in new tab
- Orange gradient accent line below the message
- CSS transition: `opacity 220ms ease, transform 220ms ease`

#### Card Grid (2-column on lg+)
1. Genesis Block Information
2. Bitcoin Principles
3. Whitepaper Quote (italic)
4. Support Dashboard (donate + GitHub links)

#### Donation Copy Button
- Uses `navigator.clipboard.writeText()` with `document.execCommand('copy')` fallback
- Visual confirmation: green border + "Copied" text for 1.4 seconds

#### BitcoinDonationQr
- Imported from `@/shared/components/common/BitcoinDonationQr.jsx`
- `size={104}` pixels

## Props

```typescript
interface S31Props {
  // No props — fully self-contained static module
}
```

## Styling

- Outer shell: `ModuleShell layout="none"`, dark background
- Content: `max-w-[1240px]`, responsive padding px-5 to xl:px-20
- Cards: `rounded-xl border border-white/[0.08] bg-white/[0.025]`
- Hero font: SF Pro Display / Helvetica Neue
- Accent: `var(--accent-bitcoin)` (#F7931A)
- Glow pulse animation on accent line
