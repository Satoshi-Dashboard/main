# S13 — Wealth Pyramid: API Endpoints

## Internal Endpoints

### GET /api/s12/address-distribution
Shared endpoint with S12. S13 uses the `richerThan` field from this response.

**Response Shape (S13-relevant fields):**
```json
{
  "richerThan": [
    { "usdThreshold": 1,       "addresses": 49850000 },
    { "usdThreshold": 10,      "addresses": 22000000 },
    { "usdThreshold": 100,     "addresses": 9500000  },
    { "usdThreshold": 1000,    "addresses": 3200000  },
    { "usdThreshold": 10000,   "addresses": 950000   },
    { "usdThreshold": 100000,  "addresses": 200000   },
    { "usdThreshold": 1000000, "addresses": 35000    }
  ],
  "updatedAt": "2024-03-15T12:00:00Z",
  "fetchedAt": "2024-03-15T12:05:00Z"
}
```

**Notes:**
- `usdThreshold` — the USD value threshold (address holds more than this amount)
- `addresses` — number of addresses holding MORE than the threshold
- Pyramid tiers are defined in `WEALTH_TIERS` constant (from `@/shared/constants/colors.js`)
- Each tier's `key` field matches a `usdThreshold` value in the `richerThan` array

## Fetch Function

The component uses `fetchAddressesRicher` imported from `@/shared/services/addressDistributionApi.js`.

This service function internally calls the shared `/api/s12/address-distribution` endpoint and extracts the `richerThan` sub-array.

## Upstream Source

| Field       | Value                                             |
|-------------|---------------------------------------------------|
| Provider    | BitInfoCharts                                     |
| External URL| `https://bitinfocharts.com/bitcoin/`              |
| Auth        | None                                              |
| Update freq | Every ~30 minutes upstream                        |

## Refresh Strategy

- Component refresh: `1_800_000 ms` (30 minutes)
- Initial state: all `addresses` values are `null` (tiers initialized from `WEALTH_TIERS` template with null addresses)
- Tiers are progressively filled as data arrives
