# FlixCapacitor v2

Modern streaming app built with Svelte 5 + Konsta UI + Capacitor.

## Tech Stack

- **Svelte 5** with Runes API
- **SvelteKit** for routing and SSG
- **Konsta UI** for iOS-style components
- **Tailwind CSS 4** for styling
- **Capacitor 7** for native capabilities
- **TypeScript** with strict mode
- **Vitest** for testing
- **Biome** for linting and formatting

## Directory Structure

```
src/
├── lib/
│   ├── components/      # Reusable components
│   │   ├── ui/         # Base UI components
│   │   ├── media/      # Video player, thumbnails
│   │   ├── content/    # Content cards, grids
│   │   ├── navigation/ # Nav bars, tabs
│   │   ├── overlays/   # Modals, sheets
│   │   └── forms/      # Form components
│   ├── stores/         # Svelte stores
│   ├── services/       # Business logic
│   ├── plugins/        # Capacitor wrappers
│   ├── utils/          # Utility functions
│   ├── types/          # TypeScript definitions
│   └── config/         # Configuration
└── routes/             # SvelteKit routes
    ├── movies/
    ├── shows/
    ├── anime/
    ├── library/
    ├── downloads/
    ├── favorites/
    ├── collections/
    ├── settings/
    └── player/
```

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Type checking
npm run check

# Run tests
npm test

# Lint and format
npm run lint
npm run format

# Build for production
npm run build
```

## Path Aliases

- `$components` → `src/lib/components`
- `$stores` → `src/lib/stores`
- `$services` → `src/lib/services`
- `$plugins` → `src/lib/plugins`
- `$utils` → `src/lib/utils`
- `$types` → `src/lib/types`
- `$config` → `src/lib/config`
