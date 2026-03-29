# S21 — Data Schema

## API Payload

| Field | Type | Description |
|---|---|---|
| spot_btc_usd | number | Current BTC price in USD |
| spot_change_24h_pct | number | BTC 24h % change (can be negative) |
| big_mac_usd | number | Big Mac price in USD (global average) |
| history_btc | object | Historical BTC prices keyed by period |

## history_btc keys
| Key | Period |
|---|---|
| 1y | 1 year ago |
| 30d | 30 days ago |
| 7d | 7 days ago |
| 10y | 10 years ago |
| 5y | 5 years ago |
| 3y | 3 years ago |

## Derived Values
- `currentSats` = floor((big_mac_usd / spot_btc_usd) * 100_000_000)
- `headerPct` = percent change in sats cost based on 24h BTC price movement
- `histSats[period]` = floor((big_mac_usd / history_btc[period]) * 100_000_000)
- Card `improved = true` when pct < 0 (fewer sats needed = BTC appreciated)
