# Angular 21 Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade both `website` and `client` Angular submodules from Angular 20 to Angular 21, including all compatible dependencies.

**Architecture:** Use Angular CLI's `ng update` for automatic migrations of core packages, then manually update remaining dependencies (zone.js, RxJS, dev dependencies). Each submodule is upgraded independently.

**Tech Stack:** Angular 21, TypeScript 5.9.3, RxJS 7.x, zone.js, karma, jasmine

---

## File Structure

### website/ (Angular Project)
- `package.json` - Update Angular packages, TypeScript, dependencies
- `package-lock.json` - Auto-updated by npm
- `angular.json` - May need schema updates
- `tsconfig.json` - Will be migrated: moduleResolution -> 'bundler', lib -> 'es2022'
- `src/main.ts` - May need bootstrap migration
- `karma.conf.js` - May be removed if it only contains defaults

### client/ (Angular Project)
- `package.json` - Update Angular packages, TypeScript, dependencies
- `package-lock.json` - Auto-updated by npm
- `angular.json` - May need schema updates
- `tsconfig.json` - Will be migrated: moduleResolution -> 'bundler', lib -> 'es2022'
- `src/main.ts` - May need bootstrap migration
- `karma.conf.js` - May be removed if it only contains defaults

---

## Pre-Upgrade Verification Tasks

### Task 0: Verify Pre-Upgrade Baseline for website

**Files:**
- Test: `website/`

- [ ] **Step 1: Change to website directory**

Run: `cd /home/christopher/Dokumente/outer-colonies2/website`
Expected: Working directory is website

- [ ] **Step 2: Install dependencies**

Run: `npm install`
Expected: All dependencies installed successfully

- [ ] **Step 3: Run staging build**

Run: `npm run build:staging`
Expected: Build succeeds with no errors

- [ ] **Step 4: Run linting**

Run: `npm run lint`
Expected: Linting passes with no errors

- [ ] **Step 5: Run tests**

Run: `npm run test -- --no-watch --browsers=ChromeHeadless`
Expected: All tests pass

- [ ] **Step 6: Commit baseline verification**

```bash
cd /home/christopher/Dokumente/outer-colonies2
git add -A
git commit -m "chore(website): verify pre-upgrade baseline"
```

---

### Task 1: Verify Pre-Upgrade Baseline for client

**Files:**
- Test: `client/`

- [ ] **Step 1: Change to client directory**

Run: `cd /home/christopher/Dokumente/outer-colonies2/client`
Expected: Working directory is client

- [ ] **Step 2: Install dependencies**

Run: `npm install`
Expected: All dependencies installed successfully

- [ ] **Step 3: Run staging build**

Run: `npm run build:staging`
Expected: Build succeeds with no errors

- [ ] **Step 4: Run linting**

Run: `npm run lint`
Expected: Linting passes with no errors

- [ ] **Step 5: Run tests**

Run: `npm run test -- --no-watch --browsers=ChromeHeadless`
Expected: All tests pass

- [ ] **Step 6: Commit baseline verification**

```bash
cd /home/christopher/Dokumente/outer-colonies2
git add -A
git commit -m "chore(client): verify pre-upgrade baseline"
```

---

## Website Upgrade Tasks

### Task 2: Upgrade Angular Core in website

**Files:**
- Modify: `website/package.json`
- Modify: `website/package-lock.json`
- Modify: `website/tsconfig.json`
- Modify: `website/src/main.ts` (if bootstrap migration needed)

- [ ] **Step 1: Change to website directory**

Run: `cd /home/christopher/Dokumente/outer-colonies2/website`

- [ ] **Step 2: Run Angular update for core packages**

Run: `ng update @angular/core@21 @angular/cli@21 --force`
Expected: Packages updated, automatic migrations applied

- [ ] **Step 3: Verify package versions**

Run: `grep @angular package.json`
Expected: All @angular packages show version 21.x

- [ ] **Step 4: Verify TypeScript version**

Run: `grep typescript package.json`
Expected: typescript version is 5.9.3

- [ ] **Step 5: Check for migration failures**

Run: `ng update --migrate-only 2>&1 | grep -i error || echo "No errors"`
Expected: No migration errors

- [ ] **Step 6: Commit Angular core upgrade**

```bash
cd /home/christopher/Dokumente/outer-colonies2
git add website/package.json website/package-lock.json website/tsconfig.json website/src/main.ts
git commit -m "feat(website): upgrade Angular core to v21"
```

---

### Task 3: Update Remaining Dependencies in website

**Files:**
- Modify: `website/package.json`
- Modify: `website/package-lock.json`

- [ ] **Step 1: Update zone.js**

Run: `npm install zone.js@latest`
Expected: zone.js updated to latest version

- [ ] **Step 2: Update RxJS**

Run: `npm install rxjs@latest`
Expected: RxJS updated to latest 7.x

- [ ] **Step 3: Update @angular/material**

Run: `npm install @angular/material@21 @angular/cdk@21`
Expected: Angular Material updated to v21

- [ ] **Step 4: Update dev dependencies**

Run: `npm install karma@latest jasmine-core@latest puppeteer@latest @types/jasmine@latest @types/node@latest`
Expected: All dev dependencies updated

- [ ] **Step 5: Clean install**

Run: `rm -rf node_modules package-lock.json && npm install`
Expected: Fresh install with all updated dependencies

- [ ] **Step 6: Commit dependency updates**

```bash
cd /home/christopher/Dokumente/outer-colonies2
git add website/package.json website/package-lock.json
git commit -m "feat(website): update dependencies for Angular 21"
```

---

### Task 4: Verify website Upgrade

**Files:**
- Test: `website/`

- [ ] **Step 1: Run staging build**

Run: `cd /home/christopher/Dokumente/outer-colonies2/website && npm run build:staging`
Expected: Build succeeds with no errors

- [ ] **Step 2: Run linting**

Run: `npm run lint`
Expected: Linting passes with no errors

- [ ] **Step 3: Run tests**

Run: `npm run test -- --no-watch --browsers=ChromeHeadless`
Expected: All tests pass

- [ ] **Step 4: Commit verification**

```bash
cd /home/christopher/Dokumente/outer-colonies2
git add -A
git commit -m "chore(website): verify Angular 21 upgrade"
```

---

## Client Upgrade Tasks

### Task 5: Upgrade Angular Core in client

**Files:**
- Modify: `client/package.json`
- Modify: `client/package-lock.json`
- Modify: `client/tsconfig.json`
- Modify: `client/src/main.ts` (if bootstrap migration needed)

- [ ] **Step 1: Change to client directory**

Run: `cd /home/christopher/Dokumente/outer-colonies2/client`

- [ ] **Step 2: Run Angular update for core packages**

Run: `ng update @angular/core@21 @angular/cli@21 --force`
Expected: Packages updated, automatic migrations applied

- [ ] **Step 3: Verify package versions**

Run: `grep @angular package.json`
Expected: All @angular packages show version 21.x

- [ ] **Step 4: Verify TypeScript version**

Run: `grep typescript package.json`
Expected: typescript version is 5.9.3

- [ ] **Step 5: Check for migration failures**

Run: `ng update --migrate-only 2>&1 | grep -i error || echo "No errors"`
Expected: No migration errors

- [ ] **Step 6: Commit Angular core upgrade**

```bash
cd /home/christopher/Dokumente/outer-colonies2
git add client/package.json client/package-lock.json client/tsconfig.json client/src/main.ts
git commit -m "feat(client): upgrade Angular core to v21"
```

---

### Task 6: Update Remaining Dependencies in client

**Files:**
- Modify: `client/package.json`
- Modify: `client/package-lock.json`

- [ ] **Step 1: Update zone.js**

Run: `npm install zone.js@latest`
Expected: zone.js updated to latest version

- [ ] **Step 2: Update RxJS**

Run: `npm install rxjs@latest`
Expected: RxJS updated to latest 7.x

- [ ] **Step 3: Update dev dependencies**

Run: `npm install karma@latest jasmine-core@latest puppeteer@latest @types/jasmine@latest @types/node@latest`
Expected: All dev dependencies updated

- [ ] **Step 4: Clean install**

Run: `rm -rf node_modules package-lock.json && npm install`
Expected: Fresh install with all updated dependencies

- [ ] **Step 5: Commit dependency updates**

```bash
cd /home/christopher/Dokumente/outer-colonies2
git add client/package.json client/package-lock.json
git commit -m "feat(client): update dependencies for Angular 21"
```

---

### Task 7: Verify client Upgrade

**Files:**
- Test: `client/`

- [ ] **Step 1: Run staging build**

Run: `cd /home/christopher/Dokumente/outer-colonies2/client && npm run build:staging`
Expected: Build succeeds with no errors

- [ ] **Step 2: Run linting**

Run: `npm run lint`
Expected: Linting passes with no errors

- [ ] **Step 3: Run tests**

Run: `npm run test -- --no-watch --browsers=ChromeHeadless`
Expected: All tests pass

- [ ] **Step 4: Commit verification**

```bash
cd /home/christopher/Dokumente/outer-colonies2
git add -A
git commit -m "chore(client): verify Angular 21 upgrade"
```

---

## Final Verification

### Task 8: Final Full Verification

**Files:**
- Test: `website/`, `client/`

- [ ] **Step 1: Verify both submodules have Angular 21**

Run: `cd /home/christopher/Dokumente/outer-colonies2/website && grep @angular/package package.json | head -1 && cd ../client && grep @angular/package package.json | head -1`
Expected: Both show @angular/core 21.x

- [ ] **Step 2: Run final build for both**

Run: `cd /home/christopher/Dokumente/outer-colonies2/website && npm run build:staging && cd ../client && npm run build:staging`
Expected: Both builds succeed

- [ ] **Step 3: Run final lint for both**

Run: `cd /home/christopher/Dokumente/outer-colonies2/website && npm run lint && cd ../client && npm run lint`
Expected: Both linting passes

- [ ] **Step 4: Run final tests for both**

Run: `cd /home/christopher/Dokumente/outer-colonies2/website && npm run test -- --no-watch --browsers=ChromeHeadless && cd ../client && npm run test -- --no-watch --browsers=ChromeHeadless`
Expected: All tests pass for both submodules

- [ ] **Step 5: Push all commits**

Run: `git push origin feature/angular21`
Expected: All commits pushed successfully

---

## Rollback Plan

If any task fails and cannot be resolved:

1. **Revert the failing commit:**
   ```bash
   git revert HEAD
   ```

2. **Or reset to last known good state:**
   ```bash
   git reset --hard <last-good-commit-hash>
   ```

3. **Re-run npm install:**
   ```bash
   cd <submodule>
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Investigate the specific error before re-attempting**

---

## Success Criteria Checklist

- [ ] website: Angular 21 packages installed
- [ ] website: TypeScript 5.9.3 installed
- [ ] website: `npm run build:staging` passes
- [ ] website: `npm run lint` passes
- [ ] website: `npm run test` passes
- [ ] client: Angular 21 packages installed
- [ ] client: TypeScript 5.9.3 installed
- [ ] client: `npm run build:staging` passes
- [ ] client: `npm run lint` passes
- [ ] client: `npm run test` passes
