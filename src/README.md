# SvelteKit + TypeScript Project Structure

This is the source directory for the Satoshi Dashboard project using SvelteKit and TypeScript.

## 📁 Folder Structure

```
src/
├── lib/
│   ├── api/            → Backend / External API connection
│   │   └── index.ts    - API endpoint definitions
│   │
│   ├── assets/         → Static importable files (images, icons, etc.)
│   │
│   ├── components/     → Reusable UI components
│   │   ├── Card.svelte - Example card component
│   │   └── ...
│   │
│   ├── stores/         → Global state management
│   │   └── index.ts    - Svelte stores for Bitcoin, theme, user
│   │
│   ├── data/           → Static content, config, and mock data
│   │   └── index.ts    - App constants, feature flags, error messages
│   │
│   ├── hooks/          → Reusable frontend logic
│   │   ├── useBitcoin.ts       - Bitcoin data hook
│   │   ├── useWindowSize.ts    - Window resize hook
│   │   └── useTheme.ts         - Theme management hook
│   │
│   ├── services/       → Frontend business logic
│   │   └── bitcoinService.ts   - Bitcoin data operations
│   │
│   ├── styles/         → Global styles
│   │   └── app.css     - Tailwind + custom CSS
│   │
│   └── types/          → TypeScript types and interfaces
│       └── index.ts    - Shared type definitions
│
├── routes/             → Application pages (SvelteKit routing)
│   ├── +page.svelte    - Home/dashboard page
│   ├── +layout.svelte  - Root layout
│   └── [id]/           - Dynamic routes example
│
├── hooks.client.ts     → Client-side hooks (browser)
├── hooks.server.ts     → Server-side hooks (Node.js)
├── app.d.ts           → SvelteKit and app type definitions
└── README.md          → This file
```

## 🚀 Quick Start

### Setting up a new page

1. Create a file in `src/routes/` (e.g., `src/routes/analytics/+page.svelte`)
2. Svelte automatically creates the route

```svelte
<script lang="ts">
  import Card from '$lib/components/Card.svelte';
  import { bitcoinStore } from '$lib/stores';
</script>

<h1>Analytics Page</h1>
<Card title="Data">
  <!-- Your content here -->
</Card>
```

### Adding a new component

1. Create a file in `src/lib/components/` (e.g., `Chart.svelte`)
2. Import and use it in your pages

```svelte
<script lang="ts">
  export let title: string = '';
  export let data: any[] = [];
</script>

<div class="component">
  <h3>{title}</h3>
  <!-- Component content -->
</div>
```

### Adding a new store

1. Add to `src/lib/stores/index.ts`:

```typescript
export const myStore = writable<MyType>(initialValue);

export function updateStore(value: MyType) {
  myStore.update(state => ({ ...state, ...value }));
}
```

2. Use in components:

```svelte
<script lang="ts">
  import { myStore } from '$lib/stores';

  let data = $myStore;
  $: data = $myStore; // Subscribe to updates
</script>
```

### Adding API calls

1. Add to `src/lib/api/index.ts`:

```typescript
export async function myApiCall(params: any) {
  return fetchAPI('/endpoint', { method: 'POST', body: JSON.stringify(params) });
}
```

2. Use in hooks or services

## 📝 Naming Conventions

- **Components**: PascalCase (e.g., `Card.svelte`, `UserProfile.svelte`)
- **Stores**: camelCase (e.g., `bitcoinStore`, `userStore`)
- **Functions**: camelCase (e.g., `getBitcoinData`, `formatPrice`)
- **Types**: PascalCase (e.g., `BitcoinData`, `ApiResponse`)
- **Files**: PascalCase for components, camelCase for utilities

## 🎨 Styling

Uses **Tailwind CSS** with custom CSS variables for theming. See `src/lib/styles/app.css` for:
- Color palette
- Custom utility classes (`.btn-primary`, `.card`, etc.)
- Animations
- Dark mode support

## 🔑 Key Features

- **Type-safe**: Full TypeScript support
- **Reactive**: Svelte stores for state management
- **Scalable**: Organized folder structure
- **Reusable**: Components and hooks for DRY code
- **Styled**: Tailwind CSS with custom utilities

## 📚 Resources

- [SvelteKit Docs](https://kit.svelte.dev/)
- [Svelte Docs](https://svelte.dev/docs)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/)

---

**Last Updated**: 2026-03-18
