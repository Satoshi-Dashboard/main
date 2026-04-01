# API Endpoints - S31 Thank You Satoshi

## Endpoints Used

**None.** This module is entirely static — it makes no external API calls.

---

## Static Content

All content is hardcoded in the component source file:

### DONATION_ADDRESS

```
BC1QC2GD3YN8DTLMZG4UW786MFN085WE69F60V4R6F
```

### External Links (opened via user interaction only)

| Label                  | URL                                                                          |
|------------------------|------------------------------------------------------------------------------|
| Bitcoin Whitepaper     | `https://bitcoin.org/bitcoin.pdf` (opened on hero click)                    |
| GitHub Organization    | `https://github.com/Satoshi-Dashboard`                                       |
| Project Supporters     | `https://github.com/Satoshi-Dashboard/project-supporters/blob/main/README.md` |

---

## Browser APIs Used

### navigator.clipboard.writeText()

Used for donation address copy-to-clipboard with fallback:

```javascript
// Primary: Clipboard API
await navigator.clipboard.writeText(DONATION_ADDRESS);

// Fallback: document.execCommand('copy')
const textArea = document.createElement('textarea');
textArea.value = DONATION_ADDRESS;
document.body.appendChild(textArea);
textArea.select();
document.execCommand('copy');
document.body.removeChild(textArea);
```

---

## Timer-Based Behavior (Client-Only)

### Message Rotation

```javascript
// setInterval: 2300ms — rotates through 28 language messages
setInterval(() => {
  setThanksVisible(false);           // Fade out
  setTimeout(() => {
    setThanksIndex(prev => (prev + 1) % 28);
    setThanksVisible(true);          // Fade in
  }, 220);
}, 2300);
```

**No network calls involved.**

---

## Caching Strategy

Not applicable — no data fetching.

---

## Integration Notes

### For Agents Extending This Module

To add a live data component (e.g., current block height or live BTC price):

1. Import `useModuleData` from `@/shared/hooks/useModuleData.js`
2. Import a fetch function from `@/shared/services/`
3. Add a new card to the grid with the live data
4. Document the new endpoint in this file
