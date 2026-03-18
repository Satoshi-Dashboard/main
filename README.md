# Satoshi Dashboard

Bitcoin analytics and real-time data visualization dashboard built with SvelteKit + TypeScript.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (with npm or pnpm)
- Git

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd satoshi-dashboard

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

## 📦 Project Structure

```
satoshi-dashboard/
├── static/                  # Static assets (favicon, images)
├── src/
│   ├── lib/                 # Reusable code
│   │   ├── api/             # API calls
│   │   ├── components/      # Reusable UI components
│   │   ├── stores/          # Global state (Svelte stores)
│   │   ├── services/        # Business logic
│   │   ├── hooks/           # Custom hooks
│   │   ├── utils/           # Utility functions
│   │   ├── types/           # TypeScript types
│   │   ├── data/            # Static data & config
│   │   ├── styles/          # Global CSS
│   │   └── assets/          # Importable assets
│   ├── routes/              # Application pages (file-based routing)
│   ├── app.html             # Main HTML file
│   ├── app.d.ts             # App type definitions
│   ├── hooks.client.ts      # Client-side hooks
│   └── hooks.server.ts      # Server-side hooks
├── tests/                   # Test files
├── package.json
├── tsconfig.json
├── svelte.config.js
├── vite.config.ts
├── tailwind.config.ts
├── eslint.config.js
└── README.md
```

## 🛠️ Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Check TypeScript and Svelte
npm run check
npm run check:watch

# Lint code
npm run lint

# Format code
npm run format

# Run tests
npm run test
npm run test:ui      # With UI
npm run test:coverage # With coverage
```

## 📁 Key Files

- **src/routes/** — Page components (file-based routing)
- **src/lib/stores/index.ts** — Global state (bitcoinStore, themeStore, userStore)
- **src/lib/components/** — Reusable UI components
- **src/lib/api/index.ts** — External API calls
- **src/lib/services/** — Business logic layer
- **svelte.config.js** — SvelteKit configuration
- **vite.config.ts** — Vite configuration
- **tailwind.config.ts** — Tailwind CSS configuration

## 🎨 Styling

The project uses **Tailwind CSS** with custom CSS variables for theming.

See `src/lib/styles/app.css` for:
- Color palette
- Custom utility classes
- Animations
- Dark mode support

## 🧪 Testing

Tests are written with Vitest. Run:

```bash
npm run test
```

See `tests/example.test.ts` for examples.

## 🔐 Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_COINGECKO_API=https://api.coingecko.com/api/v3
VITE_MEMPOOL_API=https://mempool.space/api
```

## 📚 Resources

- [SvelteKit Documentation](https://kit.svelte.dev/)
- [Svelte Documentation](https://svelte.dev/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite Documentation](https://vitejs.dev/)

## 📖 Documentation

- [src/README.md](src/README.md) — Detailed source code structure and conventions
- [Architecture guide](docs/architecture.md) — High-level architecture overview

## 🤝 Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit changes (`git commit -m 'Add amazing feature'`)
3. Push to branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

Built with:
- [SvelteKit](https://kit.svelte.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)

---

**Version:** 1.0.0
**Last Updated:** 2026-03-18
