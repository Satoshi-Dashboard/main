# S27 — Data Schema

## Constants
| Constant | Value | Description |
|---|---|---|
| CURRENT_INTEREST | 41 | Current search interest (0–100) |
| CHANGE_PCT | +20.6 | 24h change percentage |
| H_MIN / H_MAX | 0 / 24.3 | Time axis range in elapsed hours |
| BTC_LO / BTC_HI | 83.4 / 89.2 | BTC price axis range in $K |

## ANCHORS
```ts
[elapsed_hours: number, search_interest: number, btc_price_k: number][]
```
- 68 data points covering a 24-hour window

## Derived Constants
| Constant | Description |
|---|---|
| SEARCHES | ANCHORS.map(a => a[1]) — search interest values |
| BTCPRICES | ANCHORS.map(a => a[2]) — BTC price values |
| CORR | Pearson correlation coefficient between SEARCHES and BTCPRICES |
| PEAK_VAL | Max search interest in 24h window |
| CURRENT_BTC | Last BTC price in ANCHORS |

## SVG Paths
| Path | Description |
|---|---|
| TREND_LINE | Bezier curve for search interest |
| BTC_LINE | Bezier curve for BTC price (right axis) |
| AREA_PATH | TREND_LINE closed to form filled area |

## Signal Zones
| Range | Label |
|---|---|
| <20 | Low Interest |
| 20–40 | Normal |
| 40–60 | Growing |
| 60–80 | High Interest |
| >=80 | Extreme / FOMO |
