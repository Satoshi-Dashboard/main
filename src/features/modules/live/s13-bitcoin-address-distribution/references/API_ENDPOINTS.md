# S12 — Address Distribution: API Endpoints

## Internal Endpoints

### GET /api/s12/address-distribution
Returns the current Bitcoin address distribution by BTC balance range.

**Response Shape:**
```json
{
  "distribution": [
    {
      "range": "0 - 0.00001",
      "addresses": 12345678,
      "totalBTC": 12.34,
      "btcPercent": 0.00006
    },
    {
      "range": "0.1 - 1",
      "addresses": 3479084,
      "totalBTC": 1072660.00,
      "btcPercent": 5.40
    }
  ],
  "updatedAt": "2024-03-15T12:00:00Z",
  "fetchedAt": "2024-03-15T12:05:00Z"
}
```

**Notes:**
- `range` — string format `"min - max"` with no commas and spaces around dash
- `addresses` — integer count of addresses in this range
- `totalBTC` — sum of BTC held by addresses in this range
- `btcPercent` — percentage of total Bitcoin supply held by this range
- `updatedAt` — when the upstream source last updated this data
- `fetchedAt` — when our cache last pulled from the upstream source

## Source Ranges Aggregated per Tier

The component maps many raw ranges into 8 display tiers:

| Tier     | Source Ranges Aggregated                                                           |
|----------|------------------------------------------------------------------------------------|
| PLANKTON | `0-0.00001`, `0.00001-0.0001`, `0.0001-0.001`, `0.001-0.01`, `0.01-0.1`           |
| SHRIMP   | `0.1-1`                                                                            |
| CRAB     | `1-10`                                                                             |
| FISH     | `10-100`                                                                           |
| SHARK    | `100-1000`                                                                         |
| WHALE    | `1000-10000`                                                                       |
| HUMPBACK | `10000-100000`                                                                     |
| 100K+    | `100000-1000000`                                                                   |

## Upstream Source

| Field       | Value                                             |
|-------------|---------------------------------------------------|
| Provider    | BitInfoCharts                                     |
| External URL| `https://bitinfocharts.com/bitcoin/`              |
| Auth        | None (scraped/cached internally)                  |
| Update freq | Every ~30 minutes upstream                        |

## Refresh Strategy

- Component refresh: `1_800_000 ms` (30 minutes)
- Component uses `FALLBACK_TIERS` static data until first successful fetch
