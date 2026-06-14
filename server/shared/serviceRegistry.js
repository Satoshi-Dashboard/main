// Lightweight service aggregator — centralizes all service imports for server/app.js
// Re-export all public data feed getters
export {
  getBinanceBtcHistoryPayload,
  getBtcMapBusinessesByCountryPayload,
  getBtcMapBusinessesPayload,
  getCountriesGeoPayload,
  getFearGreedPayload,
  getLandGeoPayload,
  getLightningChannelsGeoPayload,
  getLightningWorldPayload,
  getJohoeBtcQueueBootstrapPayload,
  getJohoeBtcQueuePayload,
  getMempoolLivePayload,
  getMempoolNodePayload,
  getMempoolOfficialUsagePayload,
  getMempoolOverviewPayload,
  getS15BtcVsGoldMarketCapPayload,
  getS18BtcCyclesPayload,
  getS21BigMacSatsPayload,
  getUsNationalDebtPayload,
} from '../services/publicDataFeeds.js';
export { PublicFeedError } from '../shared/errors/SatoshiBaseError.js';

// Re-export BTC rates service
export { ExternalApiError, getBtcRates, updateBtcRates } from '../services/btcRates.js';

// Re-export Bitnodes feature
export {
  getBitnodesPayload,
  pendingResponse,
  refreshBitnodesCache,
} from '../features/bitnodes/bitnodesCache.js';

// Re-export BitInfoCharts S12 — BTC distribution
export {
  getS12BtcDistributionPayload,
  getS12BtcDistributionStatus,
  updateBtcDistributionCache,
} from '../features/bitinfocharts/s12BtcDistribution.js';

// Re-export BitInfoCharts S13 — addresses richer
export {
  getS13AddressesRicherPayload,
  getS13AddressesRicherStatus,
  updateS13AddressesRicherCache,
} from '../features/bitinfocharts/s13AddressesRicher.js';

// Re-export S03 multi-currency scraper
export {
  getS03MultiCurrencyPayload,
  getS03MultiCurrencyStatus,
  refreshS03MultiCurrencyPayload,
  S03ScrapeError,
} from '../features/multi-currency/s03MultiCurrencyScraper.js';

// Re-export S10 stablecoin peg cache
export {
  getS10StablecoinDetail,
  getS10StablecoinList,
  getS10StablecoinLivePrices,
  S10StablecoinError,
} from '../features/stablecoins/s10StablecoinPegCache.js';

// Re-export S14 global assets cache
export {
  getS14GlobalAssetsPayload,
  getS14GlobalAssetsStatus,
  refreshS14GlobalAssetsPayload,
  S14GlobalAssetsError,
} from '../features/global-assets/s14GlobalAssetsCache.js';

// Re-export S17 FRED house price
export {
  S17ApiError,
  getS17HousePricePayload,
  getS17HousePriceStatus,
  refreshS17HousePriceCache,
} from '../features/fred/s17HousePrice.js';
