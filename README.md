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

## Contact

Maintainer: **iKhunsa**  
Email: `luisleon.exe@gmail.com`

Project Link: [https://github.com/Satoshi-Dashboard/main](https://github.com/Satoshi-Dashboard/main)

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
