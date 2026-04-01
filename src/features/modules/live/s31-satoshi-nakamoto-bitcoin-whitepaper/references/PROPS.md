# Component Props & Interfaces - S31 Thank You Satoshi

## Main Component

### S31_ThankYouSatoshi(props)

**Props:**
```typescript
interface S31Props {
  // No external props — fully self-contained static module
}
```

**Usage:**
```jsx
<S31_ThankYouSatoshi />
```

**Notes:**
- Wrapped in `<ModuleShell layout="none">` for full-viewport centering on desktop
- No `onOpenDonate` prop — donation is handled inline within the card
- No data fetching — zero API dependencies

---

## Internal State

```typescript
const [copied, setCopied]               = useState<boolean>(false);
const [thanksIndex, setThanksIndex]     = useState<number>(0);
const [thanksVisible, setThanksVisible] = useState<boolean>(true);
```

---

## Inline Card Sections (no separate named components)

### Rotating Hero Button

- `onClick`: Opens `https://bitcoin.org/bitcoin.pdf` in new tab
- Renders current `THANK_YOU_MESSAGES[thanksIndex]`
- CSS opacity/transform controlled by `thanksVisible`

### Genesis Block Card

Static content:
```typescript
{
  hash: string,     // GENESIS_HASH constant
  height: 0,
  date: "January 3, 2009"
}
```

### Bitcoin Principles Card

Renders `PRINCIPLES` as `<ul>` with orange dot bullets.

### Whitepaper Quote Card

Renders `WHITEPAPER` constant in italic monospace.

### Support Dashboard Card

```typescript
interface DonationCardState {
  copied: boolean;            // true for 1.4s after copy
  address: string;            // DONATION_ADDRESS constant
}
```

**Donation Address Button:**
- `onClick`: triggers `onCopyAddress()` — copies to clipboard
- Visual states:
  - Default: white text, neutral border
  - Copied: green text (`var(--accent-green)`), green border

**QR Code:**
- `<BitcoinDonationQr value={DONATION_ADDRESS} size={104} />`
- From: `@/shared/components/common/BitcoinDonationQr.jsx`

**GitHub Links:**
- Two `<a>` elements linking to GitHub org and supporters README
- Use `<Github size={14} />` icon from lucide-react

---

## Shared Components Used

### ModuleShell

```typescript
// From @/shared/components/module/index.js
interface ModuleShellProps {
  layout: "none";
  className?: string;
  children: ReactNode;
}
```

**In S31:** `layout="none"` + `className="flex items-start justify-center lg:items-center"`

### BitcoinDonationQr

```typescript
// From @/shared/components/common/BitcoinDonationQr.jsx
interface BitcoinDonationQrProps {
  value: string;    // Bitcoin address
  size?: number;    // QR code pixel size, default 104
}
```

---

## CSS Variables Used

| Variable             | Purpose                               |
|----------------------|---------------------------------------|
| `--accent-bitcoin`   | Orange bullet dots, glow pulse line   |
| `--accent-green`     | Copy confirmation state               |
| `--text-primary`     | Main message text, card headings      |
| `--text-secondary`   | Card sub-labels, GitHub link color    |
| `--text-tertiary`    | "Global Gratitude" label              |
| `--fs-caption`       | "Global Gratitude" label size         |
| `--fs-body`          | Card body text                        |
| `--fs-section`       | Card heading text                     |
| `--fs-micro`         | Donation helper text                  |
| `--fs-tag`           | Copied confirmation text              |

## Layout

- Outer: `max-w-[1240px]`, responsive px-5 to xl:px-20, py-6 to xl:py-10
- Card grid: `grid gap-3.5 sm:gap-4 lg:grid-cols-2`
- Cards: `rounded-xl border border-white/[0.08] bg-white/[0.025]`
- Donation card: `flex flex-col gap-2.5 sm:flex-row sm:items-start`
