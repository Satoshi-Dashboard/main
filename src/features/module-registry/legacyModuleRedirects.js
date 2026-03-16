export const LEGACY_MODULE_SLUGS = [
  's01-bitcoin-overview',
  's02-price-chart',
  's03-multi-currency',
  's04-mempool-gauge',
  's05-long-term-trend',
  's06-nodes-map',
  's07-lightning-nodes-map',
  's08-btcmap-business-density',
  's09-lightning-network',
  's10-stablecoin-peg',
  's11-fear-greed',
  's12-address-distribution',
  's13-wealth-pyramid',
  's14-global-assets',
  's15-btc-vs-gold',
  's16-mayer-multiple',
  // 's17-price-performance', // Missing file
  's18-cycle-spiral',
  's19-power-law-model',
  's20-stock-to-flow',
  's21-node-versions',
  's22-seasonality',
  's23-big-mac-index',
  's24-network-activity',
  's25-log-regression',
  's26-mvrv-score',
  's27-google-trends',
  's28-btc-dominance',
  's29-utxo-distribution',
  's30-us-national-debt',
  's31-thank-you-satoshi',
];

export function buildLegacyModuleRedirects(modules) {
  return Object.fromEntries(
    LEGACY_MODULE_SLUGS.map((slug, index) => [slug, index === 0 ? '/' : `/module/${modules[index].slug}`]),
  );
}
