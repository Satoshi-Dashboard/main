<!-- Improved compatibility of back to top link: See: https://github.com/othneildrew/Best-README-Template/pull/73 -->
<a id="readme-top"></a>

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![Unlicense License][license-shield]][license-url]

<br />
<div align="center">
  <h3 align="center">Satoshi Dashboard</h3>

  <p align="center">
    Bitcoin analytics platform with 30 interactive modules, built with React + Vite.
    <br />
    <a href="https://github.com/Satoshi-Dashboard/main"><strong>Explore the repo</strong></a>
    <br />
    <br />
    <a href="https://github.com/Satoshi-Dashboard/main/issues/new?labels=bug&template=bug-report---.md">Report Bug</a>
    &middot;
    <a href="https://github.com/Satoshi-Dashboard/main/issues/new?labels=enhancement&template=feature-request---.md">Request Feature</a>
  </p>
</div>

## About The Project

[![Satoshi Dashboard Screenshot][product-screenshot]](public/modulos-referencia/001-main-dashboard.png)

Satoshi Dashboard is a frontend-focused Bitcoin intelligence dashboard that groups market, network, valuation, and sentiment metrics into a single UI.

It includes 30 ready-to-use modules such as price trends, MVRV, Stock-to-Flow, Fear & Greed, dominance, node versions, UTXO distribution, and more.

### Built With

- [![React][React.js]][React-url]
- [![Vite][Vite.dev]][Vite-url]
- [![Tailwind CSS][Tailwind.css]][Tailwind-url]
- [![Recharts][Recharts.js]][Recharts-url]
- [![Framer Motion][Framer.motion]][Framer-url]

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/Satoshi-Dashboard/main.git
   ```
2. Install dependencies
   ```sh
   npm install
   ```
3. Run development server
   ```sh
   npm run dev
   ```

## Usage

- `npm run dev`: start local development server
- `npm run build`: build production bundle in `dist/`
- `npm run preview`: preview production build locally
- `npm run lint`: run ESLint checks

## Modules and API Status

The table below shows current API usage per module. Modules without live endpoints are marked as `Proximamente`.

| Module | API status | APIs/endpoints in use |
| --- | --- | --- |
| `S01` Bitcoin Overview | Active | `CoinGecko /simple/price` + fallback `CoinCap /assets/bitcoin` + fallback `Binance /ticker/24hr` + fallback `Kraken /Ticker?pair=XBTUSD`.<br/>Mempool variants: `/api/v1/difficulty-adjustment`, `/api/blocks/tip/height`, `/api/v1/fees/recommended`, `/api/v1/mining/hashrate/pools`. |
| `S02` Price Chart | Active | Spot chain from `priceApi` (CoinGecko -> CoinCap -> Binance -> Kraken).<br/>History chain: `CoinGecko /coins/bitcoin/market_chart` -> fallback `Kraken /OHLC` -> fallback `CoinCap /assets/bitcoin/history`. |
| `S03` Multi-Currency | Active | `CoinGecko /simple/price` (multi-currency) -> fallback `Binance /ticker/price` + `jsDelivr @fawazahmed0/currency-api` -> fallback `Kraken /Ticker` + `jsDelivr @fawazahmed0/currency-api`.<br/>Extra external dataset: Natural Earth GeoJSON via CloudFront. |
| `S04` Mempool Gauge | Active | Mempool variants: `/api/mempool`, `/api/v1/fees/recommended`. |
| `S05` Long-Term Trend | Active | Mempool variant: `/api/blocks/tip/height`. |
| `S06` Block Composition | Active | Mempool variants: `/api/v1/blocks`, `/api/mempool`. |
| `S07` Top Addresses | Proximamente | No live API connected in the current component. |
| `S08` Nodes Map | Active | `Bitnodes /api/v1/snapshots/latest/`.<br/>Map tiles: `basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`. |
| `S09` Lightning Network | Active | `CoinGecko /simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true`. |
| `S10` Fear & Greed | Active | `Alternative.me /fng/?limit=31`. |
| `S11` Address Distribution | Proximamente | No live API connected in the current component. |
| `S12` BTC vs Gold | Active | `CoinGecko /coins/bitcoin/market_chart?vs_currency=usd&days=365&interval=daily`. |
| `S13` Global Assets | Proximamente | No live API connected in the current component. |
| `S14` Transaction Count | Active | `Blockchain.com /charts/n-transactions?timespan=3years&format=json&sampled=false`. |
| `S15` Wealth Pyramid | Proximamente | No live API connected in the current component. |
| `S16` Mayer Multiple | Proximamente | No live API connected in the current component. |
| `S17` Price Performance | Active | `CoinGecko /simple/price?ids=bitcoin&vs_currencies=usd`. |
| `S18` Cycle Spiral | Proximamente | No live API connected in the current component. |
| `S19` Power Law Model | Proximamente | No live API connected in the current component. |
| `S20` Stock to Flow | Proximamente | No live API connected in the current component. |
| `S21` Node Versions | Proximamente | No live API connected in the current component. |
| `S22` Seasonality | Proximamente | No live API connected in the current component. |
| `S23` Big Mac Index | Active | `CoinGecko /simple/price?ids=bitcoin&vs_currencies=usd`. |
| `S24` Network Activity | Proximamente | No live API connected in the current component. |
| `S25` Log Regression | Proximamente | No live API connected in the current component. |
| `S26` MVRV Score | Proximamente | No live API connected in the current component. |
| `S27` Google Trends | Proximamente | No live API connected in the current component. |
| `S28` BTC Dominance | Proximamente | No live API connected in the current component. |
| `S29` UTXO Distribution | Proximamente | No live API connected in the current component. |
| `S30` Thank You Satoshi | Proximamente | No live API connected in the current component. |

## Roadmap

- [x] Build complete Phase 1 dashboard shell with 30 modules
- [x] Add reusable card, toast, and export interactions
- [ ] Integrate live Bitcoin and blockchain APIs
- [ ] Add user preferences persistence
- [ ] Add alerts/watchlists and custom module filtering

See the [open issues][issues-url] for planned improvements.

## Contributing

Contributions are welcome. If you want to improve modules, docs, or UI quality:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/amazing-improvement`)
3. Commit your Changes (`git commit -m 'feat: improve module X'`)
4. Push to the Branch (`git push origin feature/amazing-improvement`)
5. Open a Pull Request

## License

Distributed under the Unlicense. See `LICENSE.txt` for details.

## Acknowledgments

- [Best-README-Template](https://github.com/othneildrew/Best-README-Template)
- [Bitcoin whitepaper](https://bitcoin.org/bitcoin.pdf)
- [Recharts documentation](https://recharts.org/)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
[contributors-shield]: https://img.shields.io/github/contributors/Satoshi-Dashboard/main.svg?style=for-the-badge
[contributors-url]: https://github.com/Satoshi-Dashboard/main/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/Satoshi-Dashboard/main.svg?style=for-the-badge
[forks-url]: https://github.com/Satoshi-Dashboard/main/network/members
[stars-shield]: https://img.shields.io/github/stars/Satoshi-Dashboard/main.svg?style=for-the-badge
[stars-url]: https://github.com/Satoshi-Dashboard/main/stargazers
[issues-shield]: https://img.shields.io/github/issues/Satoshi-Dashboard/main.svg?style=for-the-badge
[issues-url]: https://github.com/Satoshi-Dashboard/main/issues
[license-shield]: https://img.shields.io/github/license/Satoshi-Dashboard/main.svg?style=for-the-badge
[license-url]: https://github.com/Satoshi-Dashboard/main/blob/main/LICENSE.txt
[product-screenshot]: public/modulos-referencia/001-main-dashboard.png
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://react.dev/
[Vite.dev]: https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white
[Vite-url]: https://vite.dev/
[Tailwind.css]: https://img.shields.io/badge/TailwindCSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white
[Tailwind-url]: https://tailwindcss.com/
[Recharts.js]: https://img.shields.io/badge/Recharts-FF6B6B?style=for-the-badge
[Recharts-url]: https://recharts.org/
[Framer.motion]: https://img.shields.io/badge/Framer%20Motion-black?style=for-the-badge&logo=framer
[Framer-url]: https://www.framer.com/motion/
