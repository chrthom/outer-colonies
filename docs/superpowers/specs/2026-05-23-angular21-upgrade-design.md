---
name: Angular 21 Upgrade Design
description: Design document for upgrading website and client submodules from Angular 20 to Angular 21
---

# Angular 21 Upgrade - Design Specification

**Date:** 2026-05-23  
**Author:** OpenClaude  
**Status:** Approved  
**Target Branch:** feature/angular21

## Overview

Upgrade both `website` and `client` Angular submodules from Angular 20 to Angular 21, including all compatible dependencies (TypeScript, RxJS, zone.js, dev dependencies).

## Scope

- **Submodules:** website, client
- **Upgrade Type:** Full upgrade including core packages, compatible dependencies, and dev dependencies
- **Approach:** Use Angular CLI's `ng update` for automatic migrations, then manually update remaining dependencies

## Current State

### website
- Angular: 20.0.0 (actual: 20.3.21)
- TypeScript: 5.7.3
- RxJS: 7.8.0
- zone.js: 0.15.0
- @angular/material: 20.2.3

### client
- Angular: 20.0.0 (actual: 20.3.21)
- TypeScript: ~5.8.3
- RxJS: 7.8.0
- zone.js: 0.15.0

## Target State

### Core Packages
| Package | Current | Target |
|---------|---------|--------|
| @angular/core | 20.3.21 | 21.2.14 |
| @angular/common | 20.3.21 | 21.2.14 |
| @angular/compiler | 20.3.21 | 21.2.14 |
| @angular/compiler-cli | 20.3.21 | 21.2.14 |
| @angular/forms | 20.3.21 | 21.2.14 |
| @angular/platform-browser | 20.3.21 | 21.2.14 |
| @angular/platform-browser-dynamic | 20.3.21 | 21.2.14 |
| @angular/router | 20.3.21 | 21.2.14 |
| @angular/animations | 20.3.21 | 21.2.14 |
| @angular-devkit/build-angular | 20.3.26 | 21.2.12 |
| @angular/cli | 20.3.26 | 21.2.12 |
| typescript | 5.7.3 / ~5.8.3 | 5.9.3 |

### Additional Dependencies
| Package | Target |
|---------|--------|
| zone.js | ~0.15.0 (latest compatible) |
| rxjs | Latest 7.x |
| @angular/material | 21.x |
| karma | Latest compatible |
| jasmine-core | Latest compatible |
| puppeteer | Latest compatible |
| @types/jasmine | Latest compatible |
| @types/node | Latest compatible |

## Architecture

Both submodules are independent Angular projects within the same repository:

```
Root
├── website/          (Angular project)
│   ├── package.json
│   ├── angular.json
│   └── tsconfig.json
└── client/           (Angular project)
    ├── package.json
    ├── angular.json
    └── tsconfig.json
```

Each submodule will be upgraded sequentially to isolate any issues that arise.

## Data Flow

The upgrade process for each submodule follows this flow:

```
1. Change to submodule directory (website or client)
   ↓
2. Run `ng update @angular/core@21 @angular/cli@21`
   ↓
3. Angular CLI resolves compatible versions automatically
   ↓
4. Automatic migrations execute:
   - tsconfig.json: moduleResolution → 'bundler'
   - tsconfig.json: lib → 'es2022'
   - main.ts: migrate deprecated bootstrap options to providers
   - Remove default karma configuration files
   ↓
5. Manual updates:
   - Update zone.js to latest compatible version
   - Update rxjs to latest 7.x
   - Update @angular/material to 21.x
   - Update dev dependencies (karma, jasmine-core, puppeteer, etc.)
   ↓
6. Verify upgrade (see Testing Strategy)
```

## Components

### Automatic Migrations (Handled by Angular CLI)
1. **TypeScript Configuration:** Updates `moduleResolution` to `'bundler'` and `lib` to `'es2022'`
2. **Bootstrap Migration:** Converts deprecated bootstrap options to the new providers-based approach in `main.ts`
3. **Karma Configuration:** Removes default karma config files that only contain default content

### Manual Updates Required
1. **zone.js:** Update to latest compatible version with Angular 21
2. **RxJS:** Update to latest 7.x version
3. **@angular/material:** Update from 20.2.3 to 21.x
4. **Dev Dependencies:** Update karma, jasmine-core, puppeteer, @types/jasmine, @types/node

## Error Handling

| Scenario | Handling Strategy |
|----------|-------------------|
| Version conflicts during `ng update` | Use `--force` flag or manually resolve version conflicts in package.json |
| Migration failures | Check Angular update guide for specific error, run `ng update --migrate-only <package>` for individual migrations |
| Build failures after upgrade | Investigate TypeScript errors, check for deprecated API usage |
| Test failures | Update test configurations, check for deprecated APIs in tests |
| Linting failures | Update ESLint configurations if needed, fix new linting rules |

## Testing Strategy

### Pre-Upgrade Baseline
Before upgrading each submodule, establish a passing baseline:
- `npm run build:staging` - Verify staging build succeeds
- `npm run lint` - Verify linting passes
- `npm run test` - Verify unit tests pass

### Post-Upgrade Verification
After upgrading each submodule, re-run all verification commands:
- `npm run build:staging` - Verify staging build succeeds
- `npm run lint` - Verify linting passes
- `npm run test` - Verify unit tests pass

### Rollback Strategy
If any verification step fails and cannot be resolved:
1. Revert changes to package.json
2. Delete node_modules and package-lock.json
3. Run `npm install` to restore previous state
4. Investigate and fix the issue before re-attempting

## Implementation Order

1. **website** submodule first (smaller, less complex)
2. **client** submodule second (larger, Phaser integration)

This order allows us to identify and resolve common issues on the simpler project before tackling the more complex one.

## Success Criteria

- [ ] Both submodules build successfully with `npm run build:staging`
- [ ] Both submodules pass linting with `npm run lint`
- [ ] Both submodules pass all unit tests with `npm run test`
- [ ] No breaking changes in application functionality
- [ ] All Angular 21 features are available
- [ ] No deprecated API warnings in build output

## Out of Scope

- Upgrading Node.js version (current version should be compatible)
- Upgrading Phaser or other non-Angular dependencies in client
- Refactoring code to use new Angular 21 features (separate task)
- Updating documentation (can be done after upgrade)

## Risks

| Risk | Mitigation |
|------|------------|
| Breaking changes in Angular 21 | Use Angular CLI's automated update which handles most migrations |
| Dependency conflicts | Update dependencies in batches, verify at each step |
| Build configuration incompatibilities | Test build after each major change |
| Test failures due to API changes | Run tests frequently during upgrade process |

## References

- [Angular Update Guide](https://angular.dev/update-guide)
- [Angular v21 Release Notes](https://blog.angular.dev/)
