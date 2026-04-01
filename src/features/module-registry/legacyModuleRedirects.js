export const LEGACY_MODULE_ALIASES = [
  { slug: 's01-bitcoin-overview', slugBase: 'bitcoin-price-market-overview' },
  { slug: 's02-price-chart', slugBase: 'bitcoin-price-chart-live' },
  { slug: 's03-multi-currency', slugBase: 'bitcoin-price-multi-currency' },
  { slug: 's04-mempool-gauge', slugBase: 'bitcoin-mempool-fees' },
  { slug: 's05-long-term-trend', slugBase: 'bitcoin-mempool-trend' },
  { slug: 's06-btc-queue', slugBase: 'bitcoin-nodes-world-map' },
  { slug: 's06-bitcoin-mempool-queue', slugBase: 'bitcoin-nodes-world-map' },
  { slug: 's06-nodes-map', slugBase: 'bitcoin-nodes-world-map' },
  { slug: 's06-bitcoin-nodes-world-map', slugBase: 'bitcoin-nodes-world-map' },
  { slug: 's07-lightning-nodes-map', slugBase: 'lightning-nodes-world-map' },
  { slug: 's07-lightning-nodes-world-map', slugBase: 'lightning-nodes-world-map' },
  { slug: 's08-btcmap-business-density', slugBase: 'bitcoin-merchant-map' },
  { slug: 's08-bitcoin-merchant-map', slugBase: 'bitcoin-merchant-map' },
  { slug: 's09-lightning-network', slugBase: 'lightning-network-stats' },
  { slug: 's09-lightning-network-stats', slugBase: 'lightning-network-stats' },
  { slug: 's10-stablecoin-peg', slugBase: 'stablecoin-peg-tracker' },
  { slug: 's10-stablecoin-peg-tracker', slugBase: 'stablecoin-peg-tracker' },
  { slug: 's11-fear-greed', slugBase: 'bitcoin-fear-greed-index' },
  { slug: 's11-bitcoin-fear-greed-index', slugBase: 'bitcoin-fear-greed-index' },
  { slug: 's12-address-distribution', slugBase: 'bitcoin-address-distribution' },
  { slug: 's12-bitcoin-address-distribution', slugBase: 'bitcoin-address-distribution' },
  { slug: 's13-wealth-pyramid', slugBase: 'bitcoin-wealth-pyramid' },
  { slug: 's13-bitcoin-wealth-pyramid', slugBase: 'bitcoin-wealth-pyramid' },
  { slug: 's14-global-assets', slugBase: 'bitcoin-vs-global-assets' },
  { slug: 's14-bitcoin-vs-global-assets', slugBase: 'bitcoin-vs-global-assets' },
  { slug: 's15-btc-vs-gold', slugBase: 'bitcoin-vs-gold-chart' },
  { slug: 's15-bitcoin-vs-gold-chart', slugBase: 'bitcoin-vs-gold-chart' },
  { slug: 's16-mayer-multiple', slugBase: 'bitcoin-mayer-multiple' },
  { slug: 's16-bitcoin-mayer-multiple', slugBase: 'bitcoin-mayer-multiple' },
  { slug: 's17-price-performance', slugBase: 'bitcoin-price-performance' },
  { slug: 's17-bitcoin-price-performance', slugBase: 'bitcoin-price-performance' },
  { slug: 's18-cycle-spiral', slugBase: 'bitcoin-halving-cycle-spiral' },
  { slug: 's18-bitcoin-halving-cycle-spiral', slugBase: 'bitcoin-halving-cycle-spiral' },
  { slug: 's19-power-law-model', slugBase: 'bitcoin-power-law-model' },
  { slug: 's19-bitcoin-power-law-model', slugBase: 'bitcoin-power-law-model' },
  { slug: 's20-stock-to-flow', slugBase: 'bitcoin-stock-to-flow-model' },
  { slug: 's20-bitcoin-stock-to-flow-model', slugBase: 'bitcoin-stock-to-flow-model' },
  { slug: 's21-node-versions', slugBase: 'bitcoin-big-mac-sats-tracker' },
  { slug: 's21-bitcoin-big-mac-sats-tracker', slugBase: 'bitcoin-big-mac-sats-tracker' },
  { slug: 's22-seasonality', slugBase: 'bitcoin-seasonality-heatmap' },
  { slug: 's22-bitcoin-seasonality-heatmap', slugBase: 'bitcoin-seasonality-heatmap' },
  { slug: 's23-big-mac-index', slugBase: 'bitcoin-big-mac-index' },
  { slug: 's23-bitcoin-big-mac-index', slugBase: 'bitcoin-big-mac-index' },
  { slug: 's24-network-activity', slugBase: 'bitcoin-network-activity' },
  { slug: 's24-bitcoin-network-activity', slugBase: 'bitcoin-network-activity' },
  { slug: 's25-log-regression', slugBase: 'bitcoin-log-regression-channel' },
  { slug: 's25-bitcoin-log-regression-channel', slugBase: 'bitcoin-log-regression-channel' },
  { slug: 's26-mvrv-score', slugBase: 'bitcoin-mvrv-score' },
  { slug: 's26-bitcoin-mvrv-score', slugBase: 'bitcoin-mvrv-score' },
  { slug: 's27-google-trends', slugBase: 'bitcoin-google-trends' },
  { slug: 's27-bitcoin-google-trends', slugBase: 'bitcoin-google-trends' },
  { slug: 's28-btc-dominance', slugBase: 'bitcoin-dominance-chart' },
  { slug: 's28-bitcoin-dominance-chart', slugBase: 'bitcoin-dominance-chart' },
  { slug: 's29-utxo-distribution', slugBase: 'bitcoin-utxo-distribution' },
  { slug: 's29-bitcoin-utxo-distribution', slugBase: 'bitcoin-utxo-distribution' },
  { slug: 's30-us-national-debt', slugBase: 'us-national-debt-live-counter' },
  { slug: 's30-us-national-debt-live-counter', slugBase: 'us-national-debt-live-counter' },
  { slug: 's31-thank-you-satoshi', slugBase: 'satoshi-nakamoto-bitcoin-whitepaper' },
  { slug: 's31-satoshi-nakamoto-bitcoin-whitepaper', slugBase: 'satoshi-nakamoto-bitcoin-whitepaper' },
];

export function buildLegacyModuleRedirects(modules) {
  const firstModuleCode = modules[0]?.code;
  const modulesBySlugBase = new Map(modules.map((module) => [module.slugBase, module]));

  return Object.fromEntries(
    LEGACY_MODULE_ALIASES.flatMap(({ slug, slugBase }) => {
      const module = modulesBySlugBase.get(slugBase);
      if (!module) return [];

      const targetPath = module.code === firstModuleCode ? '/' : `/module/${module.slug}`;
      if (slug === module.slug) return [];

      return [[slug, targetPath]];
    }),
  );
}
