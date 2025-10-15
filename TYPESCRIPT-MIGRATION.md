# TypeScript Migration Guide

## Current Status

TypeScript 5.9.3 has been successfully integrated into the FlixCapacitor project with full type checking support.

### Installed Packages
- `typescript` v5.9.3
- `@types/node` v24.7.2
- `@types/jquery` v3.5.33
- `@types/backbone` v1.4.23
- `@types/backbone.marionette` v3.3.18
- `@types/lodash` v4.17.20
- `@types/underscore` v1.13.0

### Configuration

**tsconfig.json** has been configured with the following settings:
- **Target:** ES2022
- **Module:** ESNext with bundler resolution
- **JavaScript Support:** `allowJs: true` - existing JS files work alongside TS
- **Type Checking:** `strict: false` - gradual migration without breaking changes
- **Path Aliases:** `@/*`, `@app/*`, `@lib/*` for cleaner imports

### Type Definitions

Created custom type definitions in `src/types/`:

1. **global.d.ts** - Window object augmentation, global services, environment types
2. **library.d.ts** - Library service interfaces (LibraryItem, LibraryFilters, ScanResults, etc.)

### Scripts

New npm scripts added:
- `npm run typecheck` - Run TypeScript type checking without emitting files
- `npm run typecheck:watch` - Watch mode for continuous type checking during development

## Migration Strategy

This project uses a **gradual migration** approach:

### Phase 1: Setup ✅ (Completed)
- [x] Install TypeScript and type definitions
- [x] Create tsconfig.json configuration
- [x] Add type definition files
- [x] Configure npm scripts
- [x] Verify build still works

### Phase 2: Incremental Adoption (Recommended Next Steps)
1. **New Files:** Write all new code in TypeScript (.ts)
2. **Critical Files:** Convert high-value files first:
   - Service classes (library-service.js → library-service.ts)
   - Data models
   - API clients
3. **Utility Functions:** Convert standalone utilities to TypeScript
4. **Configuration Files:** Convert config files to TypeScript

### Phase 3: Strict Mode (Future)
Once most code is TypeScript:
1. Enable `strict: true` in tsconfig.json
2. Enable `checkJs: true` to type-check JavaScript files
3. Fix any type errors that surface
4. Consider converting remaining JavaScript files

## Using TypeScript

### Creating New TypeScript Files

```typescript
// src/app/lib/example-service.ts
import type { LibraryItem } from '../../types/library';

export class ExampleService {
  async getItem(id: number): Promise<LibraryItem | null> {
    // Implementation
  }
}
```

### Using Path Aliases

```typescript
// Instead of:
import { LibraryService } from '../../../app/lib/library-service';

// Use:
import { LibraryService } from '@lib/library-service';
```

### Adding Type Definitions

Add custom types to `src/types/*.d.ts`:

```typescript
// src/types/custom.d.ts
export interface CustomType {
  id: number;
  name: string;
}
```

## IDE Integration

### VS Code
TypeScript support works out of the box. Install recommended extensions:
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript Importer** - Auto-import suggestions

### Type Checking
Run type checks locally before committing:
```bash
npm run typecheck
```

## Benefits of This Approach

1. **No Breaking Changes** - Existing JavaScript code continues to work
2. **Gradual Migration** - Convert files at your own pace
3. **Type Safety** - New code gets full TypeScript benefits
4. **Better IntelliSense** - IDE autocomplete and type hints
5. **Refactoring Safety** - Catch errors during refactoring
6. **Documentation** - Types serve as inline documentation

## Current Architecture

The project maintains a hybrid JavaScript/TypeScript setup:
- **Build Tool:** Vite (supports both JS and TS out of the box)
- **Test Framework:** Vitest (TypeScript-aware)
- **Package Manager:** npm (as documented in BUN-TERMUX-NOTES.md)

## Notes

- TypeScript compilation is handled by Vite during the build process
- No separate TypeScript build step needed for development
- Type checking is optional but recommended before commits
- The `noEmit` flag means TypeScript only checks types, Vite handles the actual compilation

---

Last updated: 2025-10-15
