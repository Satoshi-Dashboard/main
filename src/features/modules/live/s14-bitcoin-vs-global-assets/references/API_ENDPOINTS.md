# S14 — Global Assets Treemap: API Endpoints

## Internal Endpoints

### GET /api/s14/global-assets
Returns market capitalization data for major global asset classes including Bitcoin.

**Response Shape:**
```json
{
  "data": {
    "assets": [
      {
        "id": "real_estate",
        "name": "Global Real Estate",
        "value_trillions": 326.5,
        "pct_total": 39.2,
        "rank": 1
      },
      {
        "id": "bitcoin",
        "name": "Bitcoin",
        "value_trillions": 1.32,
        "pct_total": 0.16,
        "rank": 8
      }
    ]
  },
  "updated_at": "2024-03-15T10:00:00Z"
}
```

**Asset IDs:**
- `real_estate` — Global real estate market cap
- `bonds` — Global bond market cap
- `money` — Total global money supply (M2)
- `equities` — Global equity market cap
- `gold` — Gold total market cap
- `collectibles` — Art, collectibles, luxury goods
- `sp500` — S&P 500 index market cap
- `bitcoin` — Bitcoin market cap

## Upstream Source

| Field       | Value                                                     |
|-------------|-----------------------------------------------------------|
| Provider    | CoinGecko (aggregated with other data sources)            |
| Auth        | API key required for CoinGecko Pro endpoints              |
| Update freq | Approximately hourly (market caps are slow-moving)        |

## Refresh Strategy

- Component refresh: `60 * 60 * 1000 ms` (1 hour)
- Uses `keepPreviousOnError: true` — stale data stays visible during fetch failures
- Module-level `lastGlobalAssetsPayload` variable caches data across component remounts

## Error Handling

If the endpoint returns an error and no previous data is cached:
- `assetData` will be an empty array (`[]`)
- Component renders: `"Global asset values are temporarily unavailable."`

If the endpoint returns an error but cached data exists:
- Previous asset data continues to be displayed
- No error message shown to user
