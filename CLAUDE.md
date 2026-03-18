# Satoshi Dashboard — Claude Code Instructions

## 🎯 Project Overview

**Satoshi Dashboard** is a Bitcoin analytics and real-time data visualization platform built with **SvelteKit + TypeScript**.

- **Framework**: SvelteKit (full-stack)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 + custom CSS variables
- **State Management**: Svelte stores (reactive)
- **Testing**: Vitest
- **Dev Port**: 5173

## 🗂️ Project Structure

```
satoshi-dashboard/
├── src/
│   ├── lib/                 # Reusable code
│   │   ├── api/             # External API calls
│   │   ├── components/      # UI components (layout/, ui/)
│   │   ├── stores/          # Global state (Svelte stores)
│   │   ├── services/        # Business logic
│   │   ├── hooks/           # Custom hooks
│   │   ├── utils/           # Utility functions
│   │   ├── types/           # TypeScript types
│   │   ├── data/            # Config, mocks, constants
│   │   └── styles/          # Global CSS + Tailwind
│   ├── routes/              # Pages (file-based routing)
│   ├── app.html             # Main HTML
│   ├── app.d.ts             # App types
│   ├── hooks.client.ts      # Client-side hooks
│   └── hooks.server.ts      # Server-side hooks
├── static/                  # Public assets
├── tests/                   # Unit tests (Vitest)
├── .claude/                 # Claude Code config
│   ├── obsidian.json        # Obsidian workspace config
│   ├── launch.json          # Dev server launch config
│   ├── .obsidian/           # Obsidian folder
│   └── memory/              # Project memory (MEMORY.md + modules)
├── package.json
├── svelte.config.js
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── eslint.config.js
├── .prettierrc
├── .env.example
└── README.md
```

## 🏗️ Architecture Guidelines

### File Organization
- **No barrel exports** — Import directly from source files
- **Lazy loading** — Use dynamic imports for heavy components
- **Type safety** — All `.ts` files use strict TypeScript
- **Path aliases** — Use `$lib`, `$components`, `$stores` (never relative imports)

### Naming Conventions
- **Components**: PascalCase (e.g., `Button.svelte`, `Card.svelte`)
- **Stores**: camelCase (e.g., `bitcoinStore`, `themeStore`)
- **Functions**: camelCase (e.g., `fetchBitcoinData`, `formatPrice`)
- **Types**: PascalCase (e.g., `BitcoinData`, `ApiResponse`)
- **Files**: Follow component name (e.g., `Button.svelte`, `api.ts`)

### Component Structure
```svelte
<script lang="ts">
  // Imports
  import { onMount } from 'svelte';
  import { bitcoinStore } from '$lib/stores';

  // Types
  interface Props { ... }

  // Reactive declarations
  let data = $bitcoinStore;
  $: data = $bitcoinStore;

  // Functions
  async function loadData() { ... }

  // Lifecycle
  onMount(() => { ... });
</script>

<!-- Template -->
<div class="...">
  {#if data}
    {data.price}
  {/if}
</div>

<style>
  /* Scoped styles only */
</style>
```

## 🎨 Design System

### Colors (CSS Variables)
```css
--bg-primary: #0A0A0F        /* Main background */
--bg-card: #12121A           /* Card background */
--accent-bitcoin: #F7931A    /* Bitcoin orange */
--accent-green: #00D897      /* Success green */
--accent-red: #FF4757        /* Error red */
--text-primary: #E8E6E3      /* Primary text */
--text-secondary: #9CA3AF    /* Secondary text */
```

### Typography
- **H1**: 28px, bold, primary text
- **H2/H3**: 20px, semibold, primary text
- **Body**: 16px, normal, secondary text
- **Small**: 14px, normal, secondary text
- **Mono**: Code blocks use monospace font

### Spacing Scale
- Base: 4px
- Increments: 4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px

### Responsive Breakpoints (Tailwind)
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

## 📦 Dependencies

### Core
- `svelte@4.x` — Framework
- `@sveltejs/kit@2.x` — Full-stack framework
- `typescript@5.x` — Language

### Styling
- `tailwindcss@4.x` — Utility-first CSS
- `@tailwindcss/vite@4.x` — Vite plugin

### Testing
- `vitest@1.x` — Unit testing
- `@vitest/ui@1.x` — Test UI
- `@vitest/coverage-v8@1.x` — Coverage

### Development
- `vite@5.x` — Build tool
- `eslint@8.x` — Linting
- `prettier@3.x` — Code formatting
- `svelte-check@3.x` — Type checking

## 🚀 Development Workflow

### Start Development
```bash
npm run dev
# Opens http://localhost:5173
```

### Code Quality
```bash
npm run check          # TypeScript check
npm run lint          # ESLint check
npm run format        # Prettier format
npm run test          # Run tests
npm run test:ui       # Test UI
npm run test:coverage # Coverage report
```

### Build & Deploy
```bash
npm run build         # Production build
npm run preview       # Preview build locally
```

## 💾 State Management (Svelte Stores)

### Creating a Store
```typescript
// src/lib/stores/index.ts
import { writable } from 'svelte/store';

export const myStore = writable<MyType>(initialValue);

export function updateStore(value: MyType) {
  myStore.update(state => ({ ...state, ...value }));
}
```

### Using in Components
```svelte
<script lang="ts">
  import { myStore } from '$lib/stores';
  let data = $myStore;       // Auto-subscribe
  $: data = $myStore;        // Update on change
</script>

<p>{data.value}</p>
```

## 🔗 API Integration

### External APIs
- **CoinGecko**: `https://api.coingecko.com/api/v3`
- **Mempool.space**: `https://mempool.space/api`
- **Bitnodes**: `https://bitnodes.io/api/v1`

### Adding API Calls
1. Add endpoint to `src/lib/api/index.ts`
2. Use in services or hooks
3. Handle errors gracefully
4. Type responses with TypeScript interfaces

Example:
```typescript
export async function getBitcoinData(): Promise<ApiResponse<BitcoinData>> {
  return fetchAPI<BitcoinData>('/bitcoin');
}
```

## 🧪 Testing Strategy

### Unit Tests
- Test formatters, utilities, services
- Use `describe()` for test groups
- Keep tests isolated and fast

### Run Tests
```bash
npm run test          # Watch mode
npm run test:ui       # Interactive UI
npm run test:coverage # Generate coverage
```

## 📝 Environment Variables

Copy `.env.example` to `.env.local`:
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_COINGECKO_API=https://api.coingecko.com/api/v3
NODE_ENV=development
```

## 🔒 Code Standards

### TypeScript
- ✅ Use strict mode
- ✅ Type all function parameters and returns
- ✅ Use interfaces for object types
- ✅ Avoid `any` type
- ❌ No `@ts-ignore` comments

### Components
- ✅ Use reactive declarations (`$:`)
- ✅ Keep components focused (single responsibility)
- ✅ Use slots for composition
- ✅ Export props interface
- ❌ Avoid inline styles

### Commits
- **Format**: `type(scope): description`
- **Types**: `feat`, `fix`, `refactor`, `docs`, `test`, `style`
- **Examples**:
  - `feat(stores): add bitcoinStore`
  - `fix(Button): correct hover state`
  - `refactor(api): extract API logic`

## 🎯 Performance

### Best Practices
- Lazy load heavy components
- Use `{@const}` for computed values
- Debounce expensive operations
- Optimize bundle size (check with `npm run build`)
- Profile with browser DevTools

### Accessibility
- Use semantic HTML
- Add `alt` text to images
- Test with keyboard navigation
- Maintain color contrast ratios
- Use ARIA attributes when needed

## 🐛 Debugging

### Browser DevTools
- Use Svelte DevTools extension
- Check Network tab for API calls
- Inspect component props/state
- Use Console for logging

### VS Code
- Install "Svelte for VS Code" extension
- Use TypeScript IntelliSense
- Debug with breakpoints (F5)

## 📚 Resources

- [SvelteKit Docs](https://kit.svelte.dev/)
- [Svelte Docs](https://svelte.dev/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite Guide](https://vitejs.dev/)

## 🔄 Project Phases

### Phase 1: ✅ Complete
- SvelteKit scaffold
- Component library
- Store setup
- API layer foundation

### Phase 2: 📅 In Progress
- Real Bitcoin data integration
- Chart/visualization libraries
- Real-time updates

### Phase 3: 🔜 Upcoming
- Mobile responsiveness
- PWA features
- Performance optimization
- Deployment

---

**Version**: 1.0.0
**Last Updated**: 2026-03-18
**Author**: Development Team
