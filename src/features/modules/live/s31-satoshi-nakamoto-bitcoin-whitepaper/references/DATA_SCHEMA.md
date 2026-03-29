# Data Schema - S31 Thank You Satoshi

## Static Data (No API)

All data in this module is hardcoded constants. No external data fetching occurs.

---

## Content Constants

### THANK_YOU_MESSAGES

```typescript
const THANK_YOU_MESSAGES: string[] = [
  'Thank you Satoshi Nakamoto',      // English
  'Gracias Satoshi Nakamoto',        // Spanish
  'Merci Satoshi Nakamoto',          // French
  'Danke Satoshi Nakamoto',          // German
  'Grazie Satoshi Nakamoto',         // Italian
  'Obrigado Satoshi Nakamoto',       // Portuguese
  'Bedankt Satoshi Nakamoto',        // Dutch
  'Tack Satoshi Nakamoto',           // Swedish
  'Dziękuję Satoshi Nakamoto',       // Polish
  'Teşekkürler Satoshi Nakamoto',    // Turkish
  // Arabic, Hindi, Bengali, Urdu, Russian, Ukrainian, Greek,
  // Hebrew, Persian, Chinese (simplified), Chinese (traditional),
  // Japanese, Korean, Thai, Vietnamese, Indonesian, Filipino, Swahili
  // ... 28 total entries
]
```

- **Length:** 28 messages
- **Cycle:** Rotates every 2.3 seconds
- **Transition:** 220ms fade + 6px upward translateY

---

### PRINCIPLES

```typescript
const PRINCIPLES: string[] = [
  'Decentralized currency with no central authority',
  'Immutable ledger secured by cryptography',
  'Peer-to-peer network eliminating intermediaries',
  'Proof-of-work creating consensus',
  'Fixed supply creating digital scarcity',
]
```

- **Length:** 5 principles
- Rendered as a `<ul>` list with bitcoin orange bullet dots

---

### GENESIS_HASH

```typescript
const GENESIS_HASH = '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f';
```

- The SHA-256 hash of Bitcoin's genesis block (block height 0)
- Mined January 3, 2009 by Satoshi Nakamoto

---

### WHITEPAPER

```typescript
const WHITEPAPER = 'A purely peer-to-peer electronic cash system would allow online payments to be sent directly from one party to another without going through a financial institution.';
```

- Opening sentence of the Bitcoin whitepaper abstract (2008)

---

### DONATION_ADDRESS

```typescript
const DONATION_ADDRESS = 'BC1QC2GD3YN8DTLMZG4UW786MFN085WE69F60V4R6F';
```

- Bech32 (P2WPKH) Bitcoin address
- Used for QR code generation and copy-to-clipboard

---

## Component State

```typescript
const [copied, setCopied]           = useState(false);         // clipboard copy confirmation
const [thanksIndex, setThanksIndex] = useState(0);             // current message index
const [thanksVisible, setThanksVisible] = useState(true);      // controls fade transition
```

---

## Rotation Timing

```
Interval: 2300ms
  → setThanksVisible(false)
  → wait 220ms
    → setThanksIndex(prev + 1 mod 28)
    → setThanksVisible(true)

CSS transition: opacity 220ms ease, transform (6px) 220ms ease
```

---

## Copy Confirmation Timing

```
onClick → writeText(DONATION_ADDRESS)
        → setCopied(true)
        → setTimeout 1400ms → setCopied(false)
```
